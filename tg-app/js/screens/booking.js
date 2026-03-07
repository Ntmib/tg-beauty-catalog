/**
 * Экран К4: Выбор даты и времени
 *
 * Загружает расписание мастера из Supabase.
 * Проверяет занятые слоты через getBookedSlots().
 */

import { formatPrice, formatDuration, formatDate, getEndTime, toDateStr } from '../data.js';
import { navigateTo } from '../router.js';
import { showMainButton, disableMainButton, enableMainButton, hapticSelection, hapticLight, enableClosingConfirmation } from '../telegram.js';
import { getServiceById, getSchedule, getBookedSlots, createBooking, notifyMasterAboutBooking } from '../api.js';

let selectedDate = null;
let selectedTime = null;
let _schedule = null;
let _service = null;

export const bookingScreen = {
  render(params) {
    return `
      <div class="page-title fade-in-up">Выберите дату</div>
      <div id="date-scroll-wrap">
        <div class="caption text-center" style="padding: 16px 0;">Загрузка...</div>
      </div>
      <div class="section-title fade-in-up delay-2" id="time-title">Выберите время</div>
      <div id="time-grid-container" class="fade-in-up delay-2" aria-live="polite">
        <div class="caption text-center" style="padding: var(--space-5) 0;">
          Выберите дату, чтобы увидеть свободное время
        </div>
      </div>
      <div id="booking-summary" style="display: none;" class="booking-summary fade-in-up" aria-live="polite">
        <div class="booking-summary-title" id="summary-service"></div>
        <div class="booking-summary-details" id="summary-details"></div>
      </div>
      <button class="btn btn-primary mt-lg" id="btn-confirm-booking" style="display: none;">
        Подтвердить запись
      </button>
    `;
  },

  async onEnter(el, params) {
    selectedDate = null;
    selectedTime = null;

    // Загрузить услугу и расписание
    [_service, _schedule] = await Promise.all([
      getServiceById(params.serviceId).catch(() => null),
      getSchedule().catch(() => ({ work_days: [1,2,3,4,5], start_hour: 10, end_hour: 19, break_start: 13, break_end: 14 })),
    ]);

    if (!_service) {
      el.querySelector('#date-scroll-wrap').innerHTML = `
        <div class="empty-state"><div class="empty-state-title">Услуга не найдена</div></div>
      `;
      return;
    }

    el.querySelector('#summary-service').textContent = `💅 ${_service.title}`;
    enableClosingConfirmation();

    showMainButton('Подтвердить запись', () => confirmBooking(el));
    disableMainButton();

    // Рендер дат
    renderDates(el);

    el.querySelector('#btn-confirm-booking')?.addEventListener('click', () => confirmBooking(el));
  },
};

function renderDates(el) {
  const dates = generateDates(14);
  const dateItems = dates.map(d => {
    const isWorkDay = _schedule.work_days.includes(d.dayOfWeek);
    return `
      <button class="date-item ${!isWorkDay ? 'disabled' : ''}" data-date="${d.dateStr}" ${!isWorkDay ? 'disabled' : ''}>
        <span class="date-weekday">${d.weekdayShort}</span>
        <span class="date-number">${d.day}</span>
        <span class="date-month">${d.monthShort}</span>
      </button>
    `;
  }).join('');

  el.querySelector('#date-scroll-wrap').innerHTML = `
    <div class="date-scroll fade-in-up delay-1" id="date-scroll">${dateItems}</div>
  `;

  el.querySelectorAll('.date-item:not(.disabled)').forEach(item => {
    item.addEventListener('click', async () => {
      hapticSelection();
      el.querySelectorAll('.date-item.active').forEach(d => d.classList.remove('active'));
      item.classList.add('active');
      selectedDate = item.dataset.date;
      selectedTime = null;
      await renderTimeSlots(el);
      updateSummary(el);
    });
  });
}

async function renderTimeSlots(el) {
  const container = el.querySelector('#time-grid-container');
  container.innerHTML = '<div class="caption text-center" style="padding:16px 0;">Проверяем занятые слоты...</div>';

  const bookedSlots = await getBookedSlots(selectedDate).catch(() => []);
  const slots = generateSlots(selectedDate, _service.duration, _schedule, bookedSlots);

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

  container.querySelectorAll('.time-slot:not(.disabled)').forEach(slot => {
    slot.addEventListener('click', () => {
      hapticSelection();
      container.querySelectorAll('.time-slot.active').forEach(s => s.classList.remove('active'));
      slot.classList.add('active');
      selectedTime = slot.dataset.time;
      updateSummary(el);
      enableMainButton();

      const btn = el.querySelector('#btn-confirm-booking');
      if (btn) btn.style.display = 'block';
    });
  });
}

async function confirmBooking(el) {
  if (!selectedDate || !selectedTime || !_service) return;

  const btn = el.querySelector('#btn-confirm-booking');
  if (btn) { btn.disabled = true; btn.textContent = 'Оформляем...'; }

  try {
    const booking = await createBooking({
      serviceId: _service.id,
      date: selectedDate,
      time: selectedTime,
      duration: _service.duration,
    });

    // Уведомить мастера (не ждём)
    notifyMasterAboutBooking(booking.id);

    navigateTo('success', {
      serviceId: _service.id,
      serviceTitle: _service.title,
      servicePrice: _service.price,
      serviceDuration: _service.duration,
      date: selectedDate,
      time: selectedTime,
    });
  } catch (e) {
    console.error('[booking] Ошибка записи:', e);
    if (btn) { btn.disabled = false; btn.textContent = 'Подтвердить запись'; }
    window.alert && window.alert('Не удалось создать запись. Попробуйте ещё раз.');
  }
}

function updateSummary(el) {
  const summary = el.querySelector('#booking-summary');
  const details = el.querySelector('#summary-details');
  if (!summary || !details) return;

  if (selectedDate && selectedTime) {
    summary.style.display = 'block';
    const endTime = getEndTime(selectedTime, _service.duration);
    details.textContent = `${formatDate(selectedDate)} · ${selectedTime} - ${endTime} · ${formatPrice(_service.price)}`;
  } else if (selectedDate) {
    summary.style.display = 'block';
    details.textContent = `${formatDate(selectedDate)} · Выберите время`;
  } else {
    summary.style.display = 'none';
  }
}

function generateDates(count) {
  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const result = [];
  for (let i = 1; i <= count; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    let dow = date.getDay();
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

function generateSlots(dateStr, serviceDuration, schedule, bookedSlots) {
  const { start_hour, end_hour, break_start, break_end } = schedule;
  const step = 30;
  const slots = [];

  for (let h = start_hour; h < end_hour; h++) {
    for (let m = 0; m < 60; m += step) {
      const startMin = h * 60 + m;
      const endMin = startMin + serviceDuration;
      if (endMin > end_hour * 60) continue;

      if (break_start !== undefined && break_end !== undefined) {
        const bsMin = break_start * 60;
        const beMin = break_end * 60;
        if (startMin < beMin && endMin > bsMin) continue;
      }

      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const isBooked = bookedSlots.some(b =>
        isTimeOverlap(timeStr, serviceDuration, b.booking_time, b.duration)
      );
      slots.push({ time: timeStr, available: !isBooked });
    }
  }
  return slots;
}

function isTimeOverlap(t1, dur1, t2, dur2) {
  const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const s1 = toMin(t1), e1 = s1 + dur1;
  const s2 = toMin(t2), e2 = s2 + dur2;
  return s1 < e2 && e1 > s2;
}
