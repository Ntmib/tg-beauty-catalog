/**
 * Экран К3: Детали услуги
 *
 * Загружает услугу из кеша (после catalog) или из базы.
 */

import { formatPrice, formatDuration } from '../data.js';
import { navigateTo, goBack } from '../router.js';
import { showMainButton, hapticLight } from '../telegram.js';
import { getServiceById, getMasterProfile, getPortfolio } from '../api.js';

export const serviceScreen = {
  render(params) {
    return `
      <div class="fade-in-up mb-sm">
        <button class="btn btn-link" id="btn-back" style="padding: 0; min-height: auto;">← Назад</button>
      </div>
      <div id="service-content">
        <div class="caption text-center" style="padding: 40px 0;">Загрузка...</div>
      </div>
      <button class="btn btn-primary mt-lg fade-in-up delay-5" id="btn-book-service" style="display:none;">
        Записаться
      </button>
    `;
  },

  async onEnter(el, params) {
    const [service, portfolio] = await Promise.all([
      getServiceById(params.serviceId).catch(() => null),
      getPortfolio().catch(() => []),
    ]);

    if (!service) {
      el.querySelector('#service-content').innerHTML = `
        <div class="empty-state"><div class="empty-state-title">Услуга не найдена</div></div>
      `;
      return;
    }

    const profile = await getMasterProfile().catch(() => null);
    const masterData = profile?.masters || {};
    const masterName = profile?.name || `${masterData.first_name || ''} ${masterData.last_name || ''}`.trim() || 'Мастер';
    const specialtyLabels = getSpecialtyLabels(profile?.specialty || []);
    const experience = profile?.experience || '';
    const initials = masterName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    const photoHtml = portfolio.slice(0, 4).map(p => `
      <div class="scroll-photo">
        <img src="${p.image_url}" alt="Работа" loading="lazy"
             style="width:100%;height:100%;object-fit:cover;border-radius:8px;"
             onerror="this.style.display='none';this.parentNode.innerHTML='💅'">
      </div>
    `).join('') || '';

    el.querySelector('#service-content').innerHTML = `
      <div class="page-title fade-in-up">${service.title}</div>

      ${photoHtml ? `
        <div class="horizontal-scroll mb fade-in-up delay-1">${photoHtml}</div>
      ` : ''}

      <div class="card fade-in-up delay-2">
        <div class="flex-between">
          <div>
            <div class="price-lg">${formatPrice(service.price)}</div>
            <div class="caption mt-sm">${formatDuration(service.duration)}</div>
          </div>
          <div class="card-icon" style="width: 56px; height: 56px; font-size: 28px;">💅</div>
        </div>
      </div>

      ${service.description ? `
        <div class="section-title fade-in-up delay-3">Описание</div>
        <div class="body-text fade-in-up delay-3">${service.description}</div>
      ` : ''}

      <div class="section-title fade-in-up delay-4">Мастер</div>
      <div class="card fade-in-up delay-4">
        <div class="card-row">
          <div class="avatar avatar-sm">${initials}</div>
          <div class="card-body">
            <div class="card-title">${masterName}</div>
            <div class="card-subtitle">${specialtyLabels}${experience ? ` · ${experience}` : ''}</div>
          </div>
        </div>
      </div>
    `;

    // Кнопка Записаться
    const bookBtn = el.querySelector('#btn-book-service');
    bookBtn.style.display = 'block';
    const doBook = () => {
      hapticLight();
      navigateTo('booking', { serviceId: service.id });
    };
    showMainButton('Записаться', doBook);
    bookBtn.addEventListener('click', doBook);

    el.querySelector('#btn-back')?.addEventListener('click', () => {
      hapticLight();
      goBack();
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
