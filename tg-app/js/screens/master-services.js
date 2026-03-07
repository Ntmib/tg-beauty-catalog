/**
 * Экран М2: Управление услугами
 *
 * Список услуг мастера из Supabase с возможностью редактировать.
 */

import { formatPrice, formatDuration } from '../data.js';
import { navigateTo } from '../router.js';
import { hapticLight, hideMainButton } from '../telegram.js';
import { getServices, clearCache } from '../api.js';

export const masterServicesScreen = {
  render() {
    return `
      <div class="page-title fade-in-up">Услуги</div>
      <div id="services-list">
        <div class="caption text-center" style="padding: 40px 0;">Загрузка...</div>
      </div>
      <button class="btn btn-outline btn-full mt fade-in-up delay-5" id="btn-add-service">
        + Добавить услугу
      </button>
    `;
  },

  async onEnter(el) {
    hideMainButton();

    // Принудительное обновление при каждом входе
    const services = await getServices(true).catch(() => []);
    const activeServices = services.filter(s => s.is_active);

    const serviceCards = activeServices.map((s, i) => {
      const overLimit = s.is_over_limit ? `<div class="status status-pending mt-sm">🔒 Скрыта (лимит плана)</div>` : '';
      return `
        <div class="card card-clickable fade-in-up delay-${Math.min(i + 1, 6)}" data-service-id="${s.id}">
          <div class="card-row">
            <div class="card-icon">💅</div>
            <div class="card-body">
              <div class="card-title">${s.title}</div>
              <div class="card-subtitle">${formatDuration(s.duration)} · ${formatPrice(s.price)}</div>
            </div>
            <div class="card-chevron">›</div>
          </div>
          ${overLimit}
        </div>
      `;
    }).join('');

    el.querySelector('#services-list').innerHTML = activeServices.length > 0
      ? serviceCards
      : `<div class="empty-state"><div class="empty-state-text">Добавьте первую услугу</div></div>`;

    el.querySelectorAll('[data-service-id]').forEach(card => {
      card.addEventListener('click', () => {
        hapticLight();
        navigateTo('service-edit', { serviceId: card.dataset.serviceId });
      });
    });

    el.querySelector('#btn-add-service')?.addEventListener('click', () => {
      hapticLight();
      navigateTo('service-edit', { serviceId: null });
    });
  },
};
