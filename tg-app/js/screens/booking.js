/**
 * Экран К4: Выбор даты и времени
 *
 * Горизонтальный скролл дат (14 дней),
 * сетка слотов (30-мин шаг),
 * сводка выбора, MainButton "Подтвердить запись".
 */

import { master, services, bookings, formatPrice, formatDuration, formatDate, getEndTime, toDateStr } from '../data.js';
import { navigateTo } from '../router.js';
import { showMainButton, disableMainButton, enableMainButton, hapticSelection, hapticLight, enableClosingConfirmation } from '../telegram.js';

let selectedDate = null;
let selectedTime = null;

export const bookingScreen = {
  render(params) {
    const service = services.find(s => s.id === params.serviceId);
    if (!service) return '<div class="empty-state"><div class="empty-state-title">Услуга не найдена</div></div>';

    // Генерация дат на 14 дней вперёд
    const dates = generateDates(14);
    const dateItems = dates.map((d, i) => {
      const isWorkDay = master.schedule.work_days.includes(d.dayOfWeek);
      return `
        <button class="date-item ${!isWorkDay ? 'disabled' : ''}" data-date="${d.dateStr}" ${!isWorkDay ? 'disabled' : ''}>
          <span class="date-weekday">${d.weekdayShort}</span>
          <span class="date-number">${d.day}</span>
          <span class="date-month">${d.monthShort}</span>
        </button>
      `;
    }).join('');

    return `
      <div class="page-title fade-in-up">Выберите дату</div>

      <!-- Горизонтальный скролл дат -->
      <div class="date-scroll fade-in-up delay-1" id="date-scroll">
        ${dateItems}
      </div>

      <!-- Время -->
      <div class="section-title fade-in-up delay-2" id="time-title">Выберите время</div>
      <div id="time-grid-container" class="fade-in-up delay-2" aria-live="polite">
        <div class="caption text-center" style="padding: var(--space-5) 0;">
          Выберите дату, чтобы увидеть свободное время
        </div>
      </div>

      <!-- Сводка (скрыта до выбора) -->
      <div id="booking-summary" style="display: none;" class="booking-summary fade-in-up" aria-live="polite">
        <div class="booking-summary-title" id="summary-service">💅 ${service.title}</div>
        <div class="booking-summary-details" id="summary-details"></div>
      </div>

      <!-- Кнопка для браузера -->
      <button class="btn btn-primary mt-lg" id="btn-confirm-booking"
              style="display: none;">
        Подтвердить запись
      </button>
    `;
  },

  onEnter(el, params) {
    const service = services.find(s => s.id === params.serviceId);
    if (!service) return;

    selectedDate = null;
    selectedTime = null;

    // Включить подтверждение закрытия
    enableClosingConfirmation();

    // MainButton (неактивна)
    showMainButton('Подтвердить запись', () => {
      if (selectedDate && selectedTime) {
        navigateTo('success', {
          serviceId: service.id,
          date: selectedDate,
          time: selectedTime,
        });
      }
    });
    disableMainButton();

    // Клики по датам
    el.querySelectorAll('.date-item:not(.disabled)').forEach(item => {
      item.addEventListener('click', () => {
        hapticSelection();

        // Убрать active с текущей
        el.querySelectorAll('.date-item.active').forEach(d => d.classList.remove('active'));
        item.classList.add('active');

        selectedDate = item.dataset.date;
        selectedTime = null;

        // Генерировать слоты
        renderTimeSlots(el, service);
        updateSummary(el, service);
      });
    });
  },
};

/** Генерация слотов времени */
function renderTimeSlots(el, service) {
  const container = el.querySelector('#time-grid-container');
  const slots = generateSlots(selectedDate, service.duration);

  if (slots.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: var(--space-5) 0;">
        <div class="empty-state-icon">😔</div>
        <div class="empty-state-text">Нет свободного времени на эту дату</div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="time-grid">
      ${slots.map(s => `
        <button class="time-slot ${s.available ? '' : 'disabled'}" data-time="${s.time}" ${!s.available ? 'disabled' : ''}>
          ${s.time}
        </button>
      `).join('')}
    </div>
  `;

  // Клики по слотам
  container.querySelectorAll('.time-slot:not(.disabled)').forEach(slot => {
    slot.addEventListener('click', () => {
      hapticSelection();
      container.querySelectorAll('.time-slot.active').forEach(s => s.classList.remove('active'));
      slot.classList.add('active');
      selectedTime = slot.dataset.time;
      updateSummary(el, service);
      enableMainButton();

      // Показать кнопку для браузера
      const btn = el.querySelector('#btn-confirm-booking');
      if (btn) {
        btn.style.display = 'block';
        btn.onclick = () => {
          hapticLight();
          navigateTo('success', {
            serviceId: service.id,
            date: selectedDate,
            time: selectedTime,
          });
        };
      }
    });
  });
}

/** Обновить сводку */
function updateSummary(el, service) {
  const summary = el.querySelector('#booking-summary');
  const details = el.querySelector('#summary-details');

  if (selectedDate && selectedTime) {
    summary.style.display = 'block';
    const endTime = getEndTime(selectedTime, service.duration);
    details.textContent = `${formatDate(selectedDate)} · ${selectedTime} - ${endTime} · ${formatPrice(service.price)}`;
  } else if (selectedDate) {
    summary.style.display = 'block';
    details.textContent = `${formatDate(selectedDate)} · Выберите время`;
  } else {
    summary.style.display = 'none';
  }
}

/** Генерировать даты на N дней вперёд */
function generateDates(count) {
  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const result = [];

  for (let i = 1; i <= count; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);

    // dayOfWeek: 1=Пн ... 7=Вс (ISO)
    let dow = date.getDay(); // 0=Вс
    dow = dow === 0 ? 7 : dow;

    result.push({
      dateStr: toDateStr(date),
      weekdayShort: days[date.getDay()],
      day: date.getDate(),
      monthShort: months[date.getMonth()],
      dayOfWeek: dow,
    });
  }
  return result;
}

/** Генерировать слоты времени для выбранной даты */
function generateSlots(dateStr, serviceDuration) {
  const { start_hour, end_hour, break_start, break_end } = master.schedule;
  const slots = [];
  const step = 30; // 30 минут

  for (let h = start_hour; h < end_hour; h++) {
    for (let m = 0; m < 60; m += step) {
      const startMin = h * 60 + m;
      const endMin = startMin + serviceDuration;

      // Не выходить за рабочие часы
      if (endMin > end_hour * 60) continue;

      // Не попадать на обед
      if (break_start !== undefined && break_end !== undefined) {
        const breakStartMin = break_start * 60;
        const breakEndMin = break_end * 60;
        if (startMin < breakEndMin && endMin > breakStartMin) continue;
      }

      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      // Проверка на существующие записи
      const isBooked = bookings.some(b =>
        b.booking_date === dateStr &&
        b.status !== 'cancelled_by_client' &&
        b.status !== 'cancelled_by_master' &&
        isTimeOverlap(timeStr, serviceDuration, b.booking_time, b.duration)
      );

      slots.push({
        time: timeStr,
        available: !isBooked,
      });
    }
  }
  return slots;
}

/** Проверка пересечения времени */
function isTimeOverlap(time1, dur1, time2, dur2) {
  const toMin = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const start1 = toMin(time1);
  const end1 = start1 + dur1;
  const start2 = toMin(time2);
  const end2 = start2 + dur2;
  return start1 < end2 && end1 > start2;
}
