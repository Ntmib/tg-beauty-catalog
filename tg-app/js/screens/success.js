/**
 * Экран К5: Запись подтверждена
 *
 * Экран успеха с анимированной галочкой,
 * деталями записи и кнопками действий.
 */

import { master, services, formatPrice, formatDuration, formatDate, getEndTime } from '../data.js';
import { navigateTo, navigateToRoot } from '../router.js';
import { showMainButton, hapticSuccess, disableClosingConfirmation } from '../telegram.js';

export const successScreen = {
  render(params) {
    const service = services.find(s => s.id === params.serviceId);
    if (!service) return '';

    const endTime = getEndTime(params.time, service.duration);

    return `
      <div style="text-align: center; padding-top: 40px;">
        <!-- Анимированная галочка -->
        <div class="success-check">
          <svg viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div class="page-title" style="margin-bottom: 4px;">Вы записаны!</div>
        <div class="caption">Ожидает подтверждения мастера</div>
      </div>

      <!-- Карточка записи -->
      <div class="card fade-in-up delay-2" style="margin-top: 24px;">
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>💅</span>
            <span class="card-title">${service.title}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>📅</span>
            <span>${formatDate(params.date)}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>🕐</span>
            <span>${params.time} - ${endTime}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>💰</span>
            <span class="text-bold">${formatPrice(service.price)}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>👩</span>
            <span>${master.name}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>📍</span>
            <span class="text-link">${master.address}</span>
          </div>
        </div>
      </div>

      <!-- Подсказка -->
      <div class="caption fade-in-up delay-3" style="text-align: center; margin-top: 16px;">
        Напоминание придёт за 24ч и за 2ч до записи
      </div>

      <!-- Кнопки -->
      <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 24px;" class="fade-in-up delay-4">
        <button class="btn btn-secondary btn-full" id="btn-my-records">📋 Мои записи</button>
        <button class="btn btn-link btn-full" id="btn-back-catalog">← Вернуться в каталог</button>
      </div>
    `;
  },

  onEnter(el) {
    // Вибрация успеха
    hapticSuccess();

    // Отключить подтверждение закрытия
    disableClosingConfirmation();

    // MainButton "Закрыть"
    showMainButton('Закрыть', () => {
      // В Telegram — закрыть Mini App
      // В браузере — вернуться в каталог
      navigateToRoot('catalog');
    });

    el.querySelector('#btn-my-records')?.addEventListener('click', () => {
      navigateTo('records');
    });

    el.querySelector('#btn-back-catalog')?.addEventListener('click', () => {
      navigateToRoot('catalog');
    });
  },
};
