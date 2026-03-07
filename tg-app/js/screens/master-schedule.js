/**
 * Экран М4: Расписание мастера
 *
 * Загружает расписание из Supabase, сохраняет изменения.
 */

import { goBack } from '../router.js';
import { showMainButton, hapticSelection, hapticSuccess } from '../telegram.js';
import { getSchedule, saveSchedule } from '../api.js';

export const masterScheduleScreen = {
  render() {
    return `
      <div id="schedule-content">
        <div class="caption text-center" style="padding: 40px 0;">Загрузка расписания...</div>
      </div>
    `;
  },

  async onEnter(el) {
    const schedule = await getSchedule(true).catch(() => ({
      work_days: [1,2,3,4,5], start_hour: 10, end_hour: 19, break_start: 13, break_end: 14,
    }));

    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const dayToggles = days.map((d, i) => {
      const isActive = (schedule.work_days || []).includes(i + 1);
      return `<button class="day-toggle ${isActive ? 'active' : ''}" data-day="${i + 1}">${d}</button>`;
    }).join('');

    const hourOptions = (selected) => Array.from({ length: 15 }, (_, i) => i + 7)
      .map(h => `<option value="${h}" ${h === selected ? 'selected' : ''}>${String(h).padStart(2, '0')}:00</option>`)
      .join('');

    el.querySelector('#schedule-content').innerHTML = `
      <div class="page-title fade-in-up">Расписание</div>

      <div class="section-title fade-in-up delay-1">Рабочие дни</div>
      <div class="day-toggles fade-in-up delay-1" id="day-toggles">${dayToggles}</div>

      <div class="section-title fade-in-up delay-2">Часы работы</div>
      <div class="flex-between gap-3 fade-in-up delay-2">
        <div class="flex-1">
          <label class="input-label" for="start-hour">С</label>
          <select class="input" id="start-hour">${hourOptions(schedule.start_hour)}</select>
        </div>
        <div class="flex-1">
          <label class="input-label" for="end-hour">До</label>
          <select class="input" id="end-hour">${hourOptions(schedule.end_hour)}</select>
        </div>
      </div>

      <div class="section-title fade-in-up delay-3">Перерыв</div>
      <div class="flex-between gap-3 fade-in-up delay-3">
        <div class="flex-1">
          <label class="input-label" for="break-start">С</label>
          <select class="input" id="break-start">${hourOptions(schedule.break_start || 13)}</select>
        </div>
        <div class="flex-1">
          <label class="input-label" for="break-end">До</label>
          <select class="input" id="break-end">${hourOptions(schedule.break_end || 14)}</select>
        </div>
      </div>

      <button class="btn btn-primary btn-full mt fade-in-up delay-5" id="btn-save-schedule">Сохранить</button>
      <div id="schedule-error" class="caption text-center" style="color:red;display:none;margin-top:8px;"></div>
    `;

    el.querySelectorAll('.day-toggle').forEach(toggle => {
      toggle.addEventListener('click', () => {
        hapticSelection();
        toggle.classList.toggle('active');
      });
    });

    const save = async () => {
      const work_days = Array.from(el.querySelectorAll('.day-toggle.active'))
        .map(t => parseInt(t.dataset.day));

      if (work_days.length === 0) {
        el.querySelector('#schedule-error').textContent = 'Выберите хотя бы один рабочий день';
        el.querySelector('#schedule-error').style.display = 'block';
        return;
      }

      el.querySelector('#schedule-error').style.display = 'none';
      const saveBtn = el.querySelector('#btn-save-schedule');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Сохранение...';

      try {
        await saveSchedule({
          work_days,
          start_hour: parseInt(el.querySelector('#start-hour').value),
          end_hour: parseInt(el.querySelector('#end-hour').value),
          break_start: parseInt(el.querySelector('#break-start').value),
          break_end: parseInt(el.querySelector('#break-end').value),
        });
        hapticSuccess();
        goBack();
      } catch (e) {
        console.error('[master-schedule] Ошибка:', e);
        el.querySelector('#schedule-error').textContent = e.message || 'Ошибка сохранения';
        el.querySelector('#schedule-error').style.display = 'block';
        saveBtn.disabled = false;
        saveBtn.textContent = 'Сохранить';
      }
    };

    showMainButton('Сохранить', save);
    el.querySelector('#btn-save-schedule')?.addEventListener('click', save);
  },
};
