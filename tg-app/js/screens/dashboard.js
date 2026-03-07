/**
 * Экран М1: Дашборд мастера
 *
 * Загружает данные из Supabase: записи, профиль, услуги, портфолио.
 */

import { formatDate } from '../data.js';
import { navigateTo } from '../router.js';
import { hapticLight, hapticSuccess, hapticWarning, hideMainButton, confirm as tgConfirm } from '../telegram.js';
import { getMasterRow, getMasterProfile, getServices, getPortfolio, getMasterBookings, updateBookingStatus } from '../api.js';

export const dashboardScreen = {
  render() {
    return `
      <div class="fade-in-up">
        <div class="page-title" id="dash-greeting">Дашборд</div>
      </div>
      <div id="dash-content">
        <div class="caption text-center" style="padding: 40px 0;">Загрузка...</div>
      </div>
    `;
  },

  async onEnter(el) {
    hideMainButton();

    const [masterRow, profile, services, portfolio, bookings] = await Promise.all([
      getMasterRow().catch(() => null),
      getMasterProfile().catch(() => null),
      getServices().catch(() => []),
      getPortfolio().catch(() => []),
      getMasterBookings().catch(() => []),
    ]);

    const name = profile?.name || masterRow?.first_name || 'Мастер';
    const firstName = name.split(' ')[0];
    const botUsername = masterRow?.bot_username || '';

    el.querySelector('#dash-greeting').textContent = `Привет, ${firstName}!`;

    const upcomingBookings = bookings
      .filter(b => b.status === 'pending' || b.status === 'confirmed')
      .sort((a, b) => a.booking_date.localeCompare(b.booking_date) || a.booking_time.localeCompare(b.booking_time))
      .slice(0, 3);

    const bookingCards = upcomingBookings.map((b, i) => {
      const isPending = b.status === 'pending';
      const dateLabel = getDateLabel(b.booking_date);
      return `
        <div class="card fade-in-up delay-${Math.min(i + 2, 6)}">
          <div class="card-row">
            <div>
              <div class="card-title">${dateLabel}, ${b.booking_time}</div>
              <div class="card-subtitle">${b.client_name} · ${b.service_title}</div>
            </div>
          </div>
          ${isPending ? `
            <div class="card-actions">
              <button class="btn btn-sm btn-primary flex-1" data-action="confirm" data-id="${b.id}">✓ Подтвердить</button>
              <button class="btn btn-sm btn-destructive" data-action="decline" data-id="${b.id}">✗</button>
            </div>
          ` : `
            <div class="status status-confirmed mt-sm">✅ Подтверждена</div>
          `}
        </div>
      `;
    }).join('');

    const activeServicesCount = services.filter(s => s.is_active).length;
    const photoCount = portfolio.length;
    const schedule = profile?.masters ? null : null; // расписание в отдельном запросе если нужно
    const workDaysText = 'Пн-Пт'; // упрощённо, точное расписание в экране schedule

    el.querySelector('#dash-content').innerHTML = `
      <!-- Ссылка на бота -->
      <div class="info-block fade-in-up delay-1">
        <div class="info-block-label">🔗 Ваша ссылка:</div>
        <div class="info-block-value" id="bot-link">${botUsername ? `t.me/${botUsername}` : 'Бот не подключён'}</div>
        ${botUsername ? `<button class="btn btn-sm btn-secondary mt-sm" id="btn-copy-link">Скопировать</button>` : ''}
      </div>

      <!-- Ближайшие записи -->
      ${upcomingBookings.length > 0 ? `
        <div class="section-title fade-in-up delay-2">Ближайшие записи</div>
        ${bookingCards}
        <button class="btn btn-link btn-full fade-in-up delay-4" id="btn-all-bookings">Все записи →</button>
      ` : `
        <div class="card fade-in-up delay-2 text-center">
          <div class="caption">Пока записей нет</div>
        </div>
      `}

      <!-- Быстрые действия -->
      <div class="section-title fade-in-up delay-3">Быстрые действия</div>
      <div class="grid-2x2 fade-in-up delay-3">
        <button class="grid-tile" data-goto="master-services">
          <div class="grid-tile-icon">📋</div>
          <div class="grid-tile-title">Услуги</div>
          <div class="grid-tile-subtitle">${activeServicesCount} услуг</div>
        </button>
        <button class="grid-tile" data-goto="master-portfolio">
          <div class="grid-tile-icon">📷</div>
          <div class="grid-tile-title">Фото</div>
          <div class="grid-tile-subtitle">${photoCount} фото</div>
        </button>
        <button class="grid-tile" data-goto="master-schedule">
          <div class="grid-tile-icon">🕐</div>
          <div class="grid-tile-title">График</div>
          <div class="grid-tile-subtitle">${workDaysText}</div>
        </button>
        <button class="grid-tile" data-goto="master-profile">
          <div class="grid-tile-icon">👤</div>
          <div class="grid-tile-title">Профиль</div>
          <div class="grid-tile-subtitle">Изменить</div>
        </button>
      </div>

      <button class="btn btn-secondary btn-full mt fade-in-up delay-4" id="btn-preview">
        👁 Посмотреть как клиент
      </button>

      ${photoCount === 0 ? `
        <div class="tip mt fade-in-up delay-5">
          <div class="tip-icon">📷</div>
          <div class="tip-text">Добавьте фото работ — клиенты записываются на 40% чаще с портфолио</div>
        </div>
      ` : ''}
    `;

    // Копировать ссылку
    el.querySelector('#btn-copy-link')?.addEventListener('click', () => {
      hapticSuccess();
      navigator.clipboard?.writeText(`https://t.me/${botUsername}`).catch(() => {});
      const btn = el.querySelector('#btn-copy-link');
      btn.textContent = '✓ Скопировано!';
      setTimeout(() => { btn.textContent = 'Скопировать'; }, 2000);
    });

    // Навигация плитки
    el.querySelectorAll('[data-goto]').forEach(tile => {
      tile.addEventListener('click', () => {
        hapticLight();
        navigateTo(tile.dataset.goto);
      });
    });

    // Все записи
    el.querySelector('#btn-all-bookings')?.addEventListener('click', () => {
      hapticLight();
      navigateTo('master-bookings');
    });

    // Предпросмотр
    el.querySelector('#btn-preview')?.addEventListener('click', () => {
      hapticLight();
      navigateTo('catalog');
    });

    // Подтвердить запись
    el.querySelectorAll('[data-action="confirm"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        hapticSuccess();
        await updateBookingStatus(btn.dataset.id, 'confirmed').catch(console.error);
        const card = btn.closest('.card');
        card.querySelector('.card-actions').innerHTML = '<div class="status status-confirmed">✅ Подтверждена</div>';
      });
    });

    // Отклонить запись
    el.querySelectorAll('[data-action="decline"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        hapticWarning();
        const ok = await tgConfirm('Отклонить запись?');
        if (ok) {
          await updateBookingStatus(btn.dataset.id, 'cancelled_by_master').catch(console.error);
          btn.closest('.card').style.opacity = '0.4';
          btn.closest('.card').style.pointerEvents = 'none';
        }
      });
    });
  },
};

function getDateLabel(dateStr) {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = new Date(dateStr + 'T00:00:00');
  if (date.toDateString() === today.toDateString()) return 'Сегодня';
  if (date.toDateString() === tomorrow.toDateString()) return 'Завтра';
  return formatDate(dateStr);
}
