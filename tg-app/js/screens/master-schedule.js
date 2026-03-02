/**
 * Экран М4: Расписание мастера
 *
 * Выбор рабочих дней, часов, перерыва.
 * Кнопка "Не работаю завтра".
 */

import { master } from '../data.js';
import { goBack } from '../router.js';
import { showMainButton, hapticSelection, hapticSuccess } from '../telegram.js';

export const masterScheduleScreen = {
  render() {
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const dayToggles = days.map((d, i) => {
      const isActive = master.schedule.work_days.includes(i + 1);
      return `<div class="day-toggle ${isActive ? 'active' : ''}" data-day="${i + 1}">${d}</div>`;
    }).join('');

    const hourOptions = (selected) => Array.from({ length: 15 }, (_, i) => i + 7)
      .map(h => `<option value="${h}" ${h === selected ? 'selected' : ''}>${String(h).padStart(2, '0')}:00</option>`)
      .join('');

    // Завтрашний день
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const tomorrowLabel = `${tomorrowDays[tomorrow.getDay()]}, ${tomorrow.getDate()} ${['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'][tomorrow.getMonth()]}`;

    return `
      <div class="page-title fade-in-up">Расписание</div>

      <div class="section-title fade-in-up delay-1">Рабочие дни</div>
      <div class="day-toggles fade-in-up delay-1" id="day-toggles">
        ${dayToggles}
      </div>

      <div class="section-title fade-in-up delay-2">Часы работы</div>
      <div style="display: flex; gap: 12px;" class="fade-in-up delay-2">
        <div style="flex: 1;">
          <label class="input-label">С</label>
          <select class="input" id="start-hour">${hourOptions(master.schedule.start_hour)}</select>
        </div>
        <div style="flex: 1;">
          <label class="input-label">До</label>
          <select class="input" id="end-hour">${hourOptions(master.schedule.end_hour)}</select>
        </div>
      </div>

      <div class="section-title fade-in-up delay-3">Перерыв</div>
      <div style="display: flex; gap: 12px;" class="fade-in-up delay-3">
        <div style="flex: 1;">
          <label class="input-label">С</label>
          <select class="input" id="break-start">${hourOptions(master.schedule.break_start)}</select>
        </div>
        <div style="flex: 1;">
          <label class="input-label">До</label>
          <select class="input" id="break-end">${hourOptions(master.schedule.break_end)}</select>
        </div>
      </div>

      <div class="section-title fade-in-up delay-4">Выходной</div>
      <div class="toggle-row fade-in-up delay-4" id="toggle-tomorrow">
        <div class="toggle-row-text">
          <div class="toggle-row-title">🚫 Не работаю завтра</div>
          <div class="toggle-row-subtitle">${tomorrowLabel}</div>
        </div>
        <div class="toggle-switch" id="tomorrow-switch"></div>
      </div>

      <!-- Кнопка для браузера -->
      <button class="btn btn-primary btn-full mt fade-in-up delay-5" id="btn-save-schedule">
        Сохранить
      </button>
    `;
  },

  onEnter(el) {
    // Тогглы дней
    el.querySelectorAll('.day-toggle').forEach(toggle => {
      toggle.addEventListener('click', () => {
        hapticSelection();
        toggle.classList.toggle('active');
      });
    });

    // Тоггл "не работаю завтра"
    el.querySelector('#toggle-tomorrow')?.addEventListener('click', () => {
      hapticSelection();
      const sw = el.querySelector('#tomorrow-switch');
      sw.classList.toggle('on');
    });

    const save = () => {
      hapticSuccess();
      goBack();
    };

    showMainButton('Сохранить', save);
    el.querySelector('#btn-save-schedule')?.addEventListener('click', save);
  },
};
