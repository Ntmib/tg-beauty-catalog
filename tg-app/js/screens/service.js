/**
 * Экран К3: Детали услуги
 *
 * Показывает полное описание, цену, длительность.
 * MainButton "Записаться" → переход на К4.
 */

import { master, services, portfolio, formatPrice, formatDuration } from '../data.js';
import { navigateTo, goBack } from '../router.js';
import { showMainButton, hapticLight } from '../telegram.js';

export const serviceScreen = {
  render(params) {
    const service = services.find(s => s.id === params.serviceId);
    if (!service) return '<div class="empty-state"><div class="empty-state-title">Услуга не найдена</div></div>';

    return `
      <!-- Кнопка назад (для браузера) -->
      <div class="fade-in-up mb-sm">
        <button class="btn btn-link" id="btn-back" style="padding: 0; min-height: auto;">
          ← Назад
        </button>
      </div>

      <div class="page-title fade-in-up">${service.title}</div>

      <!-- Фото работ (горизонтальный скролл) -->
      <div class="horizontal-scroll mb fade-in-up delay-1">
        ${portfolio.slice(0, 4).map(p => `
          <div class="scroll-photo">
            <div class="portfolio-placeholder ${p.placeholder}" style="font-size: 24px;">${p.emoji}</div>
          </div>
        `).join('')}
      </div>

      <!-- Цена и длительность -->
      <div class="card fade-in-up delay-2">
        <div class="flex-between">
          <div>
            <div class="price-lg">${formatPrice(service.price)}</div>
            <div class="caption mt-sm">${formatDuration(service.duration)}</div>
          </div>
          <div class="card-icon" style="width: 56px; height: 56px; font-size: 28px;">💅</div>
        </div>
      </div>

      <!-- Описание -->
      <div class="section-title fade-in-up delay-3">Описание</div>
      <div class="body-text fade-in-up delay-3">${service.description}</div>

      <!-- Мастер -->
      <div class="section-title fade-in-up delay-4">Мастер</div>
      <div class="card fade-in-up delay-4">
        <div class="card-row">
          <div class="avatar avatar-sm">${master.initials}</div>
          <div class="card-body">
            <div class="card-title">${master.name}</div>
            <div class="card-subtitle">${master.specialtyLabels[0]} · ${master.experience}</div>
          </div>
        </div>
      </div>

      <!-- Кнопка записаться (для браузерного режима) -->
      <button class="btn btn-primary mt-lg fade-in-up delay-5" id="btn-book-service">
        Записаться
      </button>
    `;
  },

  onEnter(el, params) {
    const service = services.find(s => s.id === params.serviceId);
    if (!service) return;

    // MainButton "Записаться" (для Telegram)
    showMainButton('Записаться', () => {
      navigateTo('booking', { serviceId: service.id });
    });

    // Кнопка назад (для браузера)
    el.querySelector('#btn-back')?.addEventListener('click', () => {
      hapticLight();
      goBack();
    });

    // Кнопка в HTML (для браузера)
    el.querySelector('#btn-book-service')?.addEventListener('click', () => {
      hapticLight();
      navigateTo('booking', { serviceId: service.id });
    });
  },
};
