/**
 * Экран К5: Запись подтверждена
 *
 * Данные передаются в params из booking.js.
 */

import { formatPrice, formatDuration, formatDate, getEndTime } from '../data.js';
import { navigateTo, navigateToRoot } from '../router.js';
import { showMainButton, hapticSuccess, disableClosingConfirmation } from '../telegram.js';

export const successScreen = {
  render(params) {
    const title = params.serviceTitle || 'Услуга';
    const price = params.servicePrice || 0;
    const duration = params.serviceDuration || 60;
    const endTime = params.time ? getEndTime(params.time, duration) : '';

    return `
      <div class="text-center" style="padding-top: var(--space-10);">
        <div class="success-check">
          <svg viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div class="page-title" style="margin-bottom: var(--space-1);">Вы записаны!</div>
        <div class="caption">Ожидает подтверждения мастера</div>
      </div>

      <div class="card fade-in-up delay-2 mt-lg">
        <div class="flex-col-center gap-2" style="align-items: stretch;">
          <div class="card-row gap-2">
            <span>💅</span>
            <span class="card-title">${title}</span>
          </div>
          <div class="card-row gap-2">
            <span>📅</span>
            <span>${params.date ? formatDate(params.date) : ''}</span>
          </div>
          <div class="card-row gap-2">
            <span>🕐</span>
            <span>${params.time || ''} - ${endTime}</span>
          </div>
          <div class="card-row gap-2">
            <span>⏱</span>
            <span>${formatDuration(duration)}</span>
          </div>
          <div class="card-row gap-2">
            <span>💰</span>
            <span class="text-bold">${formatPrice(price)}</span>
          </div>
        </div>
      </div>

      <div class="caption text-center fade-in-up delay-3 mt">
        Напоминание придёт в бота за 24ч и за 2ч до записи
      </div>

      <div class="flex-col-center gap-2 mt-lg fade-in-up delay-4" style="align-items: stretch;">
        <button class="btn btn-secondary btn-full" id="btn-my-records">📋 Мои записи</button>
        <button class="btn btn-link btn-full" id="btn-back-catalog">← Вернуться в каталог</button>
      </div>
    `;
  },

  onEnter(el) {
    hapticSuccess();
    disableClosingConfirmation();

    showMainButton('Закрыть', () => navigateToRoot('catalog'));

    el.querySelector('#btn-my-records')?.addEventListener('click', () => {
      navigateTo('records');
    });
    el.querySelector('#btn-back-catalog')?.addEventListener('click', () => {
      navigateToRoot('catalog');
    });
  },
};
