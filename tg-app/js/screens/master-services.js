/**
 * Экран М2: Управление услугами
 *
 * Список услуг мастера с возможностью редактировать и добавить новую.
 */

import { services, formatPrice, formatDuration } from '../data.js';
import { navigateTo } from '../router.js';
import { hapticLight, hideMainButton } from '../telegram.js';

export const masterServicesScreen = {
  render() {
    const serviceCards = services
      .filter(s => s.is_active)
      .map((s, i) => `
        <div class="card card-clickable fade-in-up delay-${Math.min(i + 1, 6)}" data-service-id="${s.id}">
          <div class="card-row">
            <div class="card-icon">💅</div>
            <div class="card-body">
              <div class="card-title">${s.title}</div>
              <div class="card-subtitle">${formatDuration(s.duration)} · ${formatPrice(s.price)}</div>
            </div>
            <div class="card-chevron">›</div>
          </div>
        </div>
      `).join('');

    return `
      <div class="page-title fade-in-up">Услуги</div>
      <div id="services-list">
        ${serviceCards}
      </div>
      <button class="btn btn-outline btn-full mt fade-in-up delay-5" id="btn-add-service">
        + Добавить услугу
      </button>
    `;
  },

  onEnter(el) {
    hideMainButton();

    // Клик по услуге → редактирование
    el.querySelectorAll('[data-service-id]').forEach(card => {
      card.addEventListener('click', () => {
        hapticLight();
        navigateTo('service-edit', { serviceId: card.dataset.serviceId });
      });
    });

    // Добавить новую услугу
    el.querySelector('#btn-add-service')?.addEventListener('click', () => {
      hapticLight();
      navigateTo('service-edit', { serviceId: null });
    });
  },
};
