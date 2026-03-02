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
      <div class="text-center" style="padding-top: var(--space-10);">
        <!-- Анимированная галочка -->
        <div class="success-check">
          <svg viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div class="page-title" style="margin-bottom: var(--space-1);">Вы записаны!</div>
        <div class="caption">Ожидает подтверждения мастера</div>
      </div>

      <!-- Карточка записи -->
      <div class="card fade-in-up delay-2 mt-lg">
        <div class="flex-col-center gap-2" style="align-items: stretch;">
          <div class="card-row gap-2">
            <span>💅</span>
            <span class="card-title">${service.title}</span>
          </div>
          <div class="card-row gap-2">
            <span>📅</span>
            <span>${formatDate(params.date)}</span>
          </div>
          <div class="card-row gap-2">
            <span>🕐</span>
            <span>${params.time} - ${endTime}</span>
          </div>
          <div class="card-row gap-2">
            <span>💰</span>
            <span class="text-bold">${formatPrice(service.price)}</span>
          </div>
          <div class="card-row gap-2">
            <span>👩</span>
            <span>${master.name}</span>
          </div>
          <div class="card-row gap-2">
            <span>📍</span>
            <span class="text-link">${master.address}</span>
          </div>
        </div>
      </div>

      <!-- Подсказка -->
      <div class="caption text-center fade-in-up delay-3 mt">
        Напоминание придёт за 24ч и за 2ч до записи
      </div>

      <!-- Кнопки -->
      <div class="flex-col-center gap-2 mt-lg fade-in-up delay-4" style="align-items: stretch;">
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
