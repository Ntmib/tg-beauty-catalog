/**
 * Экран М2.1: Редактирование / добавление услуги
 *
 * Форма: название, цена, длительность, описание.
 * Кнопка удаления (для существующих).
 */

import { services, formatPrice, formatDuration } from '../data.js';
import { goBack } from '../router.js';
import { showMainButton, hapticSuccess, hapticWarning, confirm as tgConfirm } from '../telegram.js';

const durationOptions = [30, 60, 90, 120, 150, 180];

export const serviceEditScreen = {
  render(params) {
    const service = params.serviceId ? services.find(s => s.id === params.serviceId) : null;
    const isNew = !service;

    const durationChips = durationOptions.map(d => `
      <button class="chip ${service && service.duration === d ? 'active' : ''}" data-duration="${d}">
        ${formatDuration(d)}
      </button>
    `).join('');

    return `
      <div class="page-title fade-in-up">${isNew ? 'Новая услуга' : 'Редактировать услугу'}</div>

      <div class="input-group fade-in-up delay-1">
        <label class="input-label" for="edit-title">Название</label>
        <input type="text" class="input" id="edit-title" name="title" autocomplete="off"
               value="${service ? service.title : ''}"
               placeholder="Например: Маникюр + покрытие">
      </div>

      <div class="input-group fade-in-up delay-2">
        <label class="input-label" for="edit-price">Цена (₽)</label>
        <input type="number" class="input" id="edit-price" name="price" autocomplete="off"
               value="${service ? service.price : ''}"
               placeholder="2500" inputmode="numeric">
      </div>

      <div class="input-group fade-in-up delay-3">
        <label class="input-label">Длительность</label>
        <div class="chips" id="duration-chips">
          ${durationChips}
        </div>
      </div>

      <div class="input-group fade-in-up delay-4">
        <label class="input-label" for="edit-desc">Описание (необязательно)</label>
        <textarea class="input" id="edit-desc" name="description" autocomplete="off" rows="3"
                  placeholder="Что входит в услугу">${service ? (service.description || '') : ''}</textarea>
      </div>

      ${!isNew ? `
        <button class="btn btn-destructive btn-full mt fade-in-up delay-5" id="btn-delete-service">
          🗑 Удалить услугу
        </button>
      ` : ''}

      <!-- Кнопка для браузера -->
      <button class="btn btn-primary btn-full mt fade-in-up delay-5" id="btn-save-service">
        Сохранить
      </button>
    `;
  },

  onEnter(el, params) {
    let selectedDuration = null;
    const service = params.serviceId ? services.find(s => s.id === params.serviceId) : null;
    if (service) selectedDuration = service.duration;

    // Выбор длительности
    el.querySelectorAll('#duration-chips .chip').forEach(chip => {
      chip.addEventListener('click', () => {
        el.querySelectorAll('#duration-chips .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        selectedDuration = parseInt(chip.dataset.duration);
      });
    });

    const save = () => {
      hapticSuccess();
      // В продакшене — сохранение в Supabase
      goBack();
    };

    showMainButton('Сохранить', save);

    el.querySelector('#btn-save-service')?.addEventListener('click', save);

    // Удаление
    el.querySelector('#btn-delete-service')?.addEventListener('click', async () => {
      hapticWarning();
      const ok = await tgConfirm('Удалить услугу?');
      if (ok) {
        hapticSuccess();
        goBack();
      }
    });
  },
};
