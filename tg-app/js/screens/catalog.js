/**
 * Экран К1: Профиль мастера + каталог
 *
 * Загружает данные из Supabase: профиль, услуги, портфолио.
 * RLS автоматически фильтрует по master_id из JWT.
 */

import { formatPrice, formatDuration } from '../data.js';
import { navigateTo } from '../router.js';
import { hapticLight } from '../telegram.js';
import { getMasterProfile, getServices, getPortfolio } from '../api.js';

export const catalogScreen = {
  render() {
    // Скелетон загрузки
    return `
      <div class="profile-header fade-in-up">
        <div class="avatar" id="master-avatar">...</div>
        <div class="profile-name" id="master-name">Загрузка...</div>
        <div class="profile-specialty" id="master-specialty"></div>
        <div class="trust-line" id="trust-line"></div>
      </div>
      <div class="contact-row fade-in-up delay-1" id="contact-row" style="display:none"></div>
      <div id="portfolio-section"></div>
      <div class="section-title fade-in-up delay-3">Услуги</div>
      <div id="services-list">
        <div class="caption text-center" style="padding: 24px 0;">Загрузка услуг...</div>
      </div>
      <div class="mt text-center">
        <button class="btn btn-link fade-in-up delay-6" id="btn-my-records">📋 Мои записи</button>
      </div>
      <div class="text-center mt-sm" style="padding-bottom: var(--space-4);">
        <button class="btn btn-outline btn-full fade-in-up delay-6" id="btn-share">
          🔗 Поделиться с другом
        </button>
      </div>
    `;
  },

  async onEnter(el) {
    // Загрузить данные параллельно
    const [profile, services, portfolio] = await Promise.all([
      getMasterProfile().catch(() => null),
      getServices().catch(() => []),
      getPortfolio().catch(() => []),
    ]);

    // Профиль мастера
    if (profile) {
      const masterData = profile.masters || {};
      const name = profile.name || `${masterData.first_name || ''} ${masterData.last_name || ''}`.trim() || 'Мастер';
      const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
      const specialtyLabels = getSpecialtyLabels(profile.specialty || []);
      const experienceText = profile.experience ? ` · ${profile.experience}` : '';
      const botUsername = masterData.bot_username;

      el.querySelector('#master-avatar').textContent = initials;
      el.querySelector('#master-name').textContent = name;
      el.querySelector('#master-specialty').textContent = `${specialtyLabels}${experienceText}`;

      if (profile.city) {
        el.querySelector('.trust-line')?.insertAdjacentHTML('afterbegin',
          `<button class="profile-address" id="address-link">📍 ${profile.city}</button>`
        );
      }

      // Контакты
      const contactRow = el.querySelector('#contact-row');
      if (contactRow) {
        contactRow.style.display = '';
        if (botUsername) {
          contactRow.innerHTML = `
            <button class="contact-btn" id="btn-telegram">💬 Написать мастеру</button>
          `;
        }
      }

      // Кнопка поделиться
      el.querySelector('#btn-share')?.addEventListener('click', () => {
        hapticLight();
        const link = botUsername ? `https://t.me/${botUsername}` : 'https://t.me/Beauty_100master_bot';
        const text = `${name} — отличный мастер! Посмотри каталог и запишись:`;
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
        window.open(shareUrl, '_blank');
      });

      el.querySelector('#btn-telegram')?.addEventListener('click', () => {
        hapticLight();
        if (botUsername) window.open(`https://t.me/${botUsername}`, '_blank');
      });
    }

    // Портфолио
    const portfolioSection = el.querySelector('#portfolio-section');
    if (portfolio.length > 0) {
      const items = portfolio.map((p, i) => `
        <button class="portfolio-item" data-photo-index="${i}" data-photo-url="${p.image_url}" aria-label="Фото ${i + 1}">
          <img src="${p.image_url}" alt="Работа ${i + 1}" loading="lazy"
               style="width:100%;height:100%;object-fit:cover;border-radius:8px;"
               onerror="this.style.display='none';this.parentNode.innerHTML='💅'">
        </button>
      `).join('');

      portfolioSection.innerHTML = `
        <div class="section-title fade-in-up delay-2">Работы</div>
        <div class="portfolio-grid fade-in-up delay-2" id="portfolio-grid">${items}</div>
      `;

      el.querySelectorAll('[data-photo-index]').forEach(item => {
        item.addEventListener('click', () => {
          hapticLight();
          navigateTo('photo', { index: parseInt(item.dataset.photoIndex), photos: portfolio });
        });
      });
    }

    // Услуги
    const servicesList = el.querySelector('#services-list');
    const activeServices = services.filter(s => s.is_active && !s.is_over_limit);

    if (activeServices.length > 0) {
      servicesList.innerHTML = activeServices.map((s, i) => `
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

      el.querySelectorAll('[data-service-id]').forEach(card => {
        card.addEventListener('click', () => {
          hapticLight();
          navigateTo('service', { serviceId: card.dataset.serviceId });
        });
      });
    } else {
      servicesList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-text">Мастер ещё не добавил услуги</div>
        </div>
      `;
    }

    // Кнопки внизу
    el.querySelector('#btn-my-records')?.addEventListener('click', () => {
      hapticLight();
      navigateTo('records');
    });
  },
};

const SPECIALTY_LABELS = {
  nails: 'Ногти', brows: 'Брови', lashes: 'Ресницы',
  hair: 'Волосы', face: 'Лицо', body: 'Тело',
};

function getSpecialtyLabels(arr) {
  if (!arr || arr.length === 0) return 'Бьюти-мастер';
  return arr.map(s => SPECIALTY_LABELS[s] || s).join(', ');
}
