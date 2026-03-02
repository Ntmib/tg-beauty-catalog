/**
 * Экран К1: Профиль мастера + каталог (главный)
 *
 * Первый экран, который видит клиент.
 * Показывает: аватарку, имя, специализацию, портфолио, услуги.
 */

import { master, services, portfolio, formatPrice, formatDuration } from '../data.js';
import { navigateTo } from '../router.js';
import { hapticLight } from '../telegram.js';

export const catalogScreen = {
  render() {
    const serviceCards = services
      .filter(s => s.is_active)
      .map((s, i) => `
        <div class="card card-clickable fade-in-up delay-${Math.min(i + 2, 6)}" data-service-id="${s.id}">
          <div class="card-row">
            <div class="card-icon">💅</div>
            <div class="card-body">
              <div class="card-title">${s.title}</div>
              <div class="card-subtitle">${formatDuration(s.duration)}</div>
            </div>
            <div class="card-right">
              <div class="price">${formatPrice(s.price)}</div>
            </div>
          </div>
        </div>
      `).join('');

    const portfolioItems = portfolio.map((p, i) => `
      <button class="portfolio-item" data-photo-index="${i}" aria-label="Фото ${i + 1}">
        <div class="portfolio-placeholder ${p.placeholder}">${p.emoji}</div>
      </button>
    `).join('');

    return `
      <!-- Шапка профиля -->
      <div class="profile-header fade-in-up">
        <div class="avatar">
          ${master.initials}
        </div>
        <div class="profile-name">${master.name}</div>
        <div class="profile-specialty">${master.specialtyLabels[0]} · ${master.experience}</div>
        <button class="profile-address" id="address-link">📍 ${master.address}</button>

        <div class="trust-line">
          <span>${master.bookings_count} записей</span>
          <span class="trust-dot"></span>
          <span>Ближайшее: завтра, 10:00</span>
        </div>
      </div>

      <!-- Контакты -->
      <div class="contact-row fade-in-up delay-1">
        <button class="contact-btn" id="btn-phone">📞 Позвонить</button>
        <button class="contact-btn" id="btn-telegram">💬 Написать</button>
      </div>

      <!-- Портфолио -->
      <div class="section-title fade-in-up delay-2">Работы</div>
      <div class="portfolio-grid fade-in-up delay-2" id="portfolio-grid">
        ${portfolioItems}
      </div>

      <!-- Услуги -->
      <div class="section-title fade-in-up delay-3">Услуги</div>
      <div id="services-list">
        ${serviceCards}
      </div>

      <!-- Мои записи (ссылка) -->
      <div class="mt text-center">
        <button class="btn btn-link fade-in-up delay-6" id="btn-my-records">📋 Мои записи</button>
      </div>

      <!-- Поделиться с другом -->
      <div class="text-center mt-sm" style="padding-bottom: var(--space-4);">
        <button class="btn btn-outline btn-full fade-in-up delay-6" id="btn-share">
          🔗 Поделиться с другом
        </button>
      </div>
    `;
  },

  onEnter(el) {
    // Клик по услуге → экран К3
    el.querySelectorAll('[data-service-id]').forEach(card => {
      card.addEventListener('click', () => {
        hapticLight();
        const serviceId = card.dataset.serviceId;
        navigateTo('service', { serviceId });
      });
    });

    // Клик по фото → просмотр К2
    el.querySelectorAll('[data-photo-index]').forEach(item => {
      item.addEventListener('click', () => {
        hapticLight();
        const index = parseInt(item.dataset.photoIndex);
        navigateTo('photo', { index });
      });
    });

    // Кнопка "Мои записи"
    el.querySelector('#btn-my-records')?.addEventListener('click', () => {
      hapticLight();
      navigateTo('records');
    });

    // Адрес — можно было бы открыть карту
    el.querySelector('#address-link')?.addEventListener('click', () => {
      hapticLight();
    });

    // Телефон
    el.querySelector('#btn-phone')?.addEventListener('click', () => {
      hapticLight();
      window.open(`tel:${master.phone.replace(/\s/g, '')}`);
    });

    // Telegram
    el.querySelector('#btn-telegram')?.addEventListener('click', () => {
      hapticLight();
      window.open(`https://t.me/${master.telegram_username.replace('@', '')}`);
    });

    // Поделиться с другом
    el.querySelector('#btn-share')?.addEventListener('click', () => {
      hapticLight();
      const botLink = 'https://t.me/Beauty_100master_bot';
      const text = `${master.name} — отличный мастер! Посмотри каталог и запишись:`;
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(botLink)}&text=${encodeURIComponent(text)}`;
      window.open(shareUrl, '_blank');
    });
  },
};
