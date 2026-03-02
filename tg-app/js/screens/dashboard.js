/**
 * Экран М1: Дашборд мастера
 *
 * Главный экран мастера: ссылка на бота, ближайшие записи,
 * быстрые действия (услуги, фото, график, профиль).
 */

import { master, services, portfolio, bookings, formatDate } from '../data.js';
import { navigateTo } from '../router.js';
import { hapticLight, hapticSuccess, hapticWarning, hideMainButton, confirm as tgConfirm } from '../telegram.js';

export const dashboardScreen = {
  render() {
    // Ближайшие записи (pending и confirmed на ближайшие дни)
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

    // Рабочие дни — текст
    const daysMap = { 1: 'Пн', 2: 'Вт', 3: 'Ср', 4: 'Чт', 5: 'Пт', 6: 'Сб', 7: 'Вс' };
    const workDaysText = master.schedule.work_days.map(d => daysMap[d]).join('-');

    return `
      <div class="fade-in-up">
        <div class="page-title">Привет, ${master.name.split(' ')[0]}!</div>
      </div>

      <!-- Ссылка на бота -->
      <div class="info-block fade-in-up delay-1">
        <div class="info-block-label">🔗 Ваша ссылка:</div>
        <div class="info-block-value" id="bot-link">t.me/${master.bot_username}</div>
        <button class="btn btn-sm btn-secondary mt-sm" id="btn-copy-link">Скопировать</button>
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

      <!-- Быстрые действия (сетка 2x2) -->
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

      <!-- Предпросмотр -->
      <button class="btn btn-secondary btn-full mt fade-in-up delay-4" id="btn-preview">
        👁 Посмотреть как клиент
      </button>

      <!-- Подсказка -->
      ${photoCount === 0 ? `
        <div class="tip mt fade-in-up delay-5" id="tip-photo">
          <button class="tip-dismiss" id="dismiss-tip" aria-label="Закрыть подсказку">✕</button>
          <div class="tip-icon">📷</div>
          <div class="tip-text">Добавьте фото работ — клиенты записываются на 40% чаще с портфолио</div>
        </div>
      ` : ''}
    `;
  },

  onEnter(el) {
    hideMainButton();

    // Копировать ссылку
    el.querySelector('#btn-copy-link')?.addEventListener('click', () => {
      hapticSuccess();
      const link = `https://t.me/${master.bot_username}`;
      navigator.clipboard?.writeText(link).catch(() => {});
      const btn = el.querySelector('#btn-copy-link');
      btn.textContent = '✓ Скопировано!';
      setTimeout(() => { btn.textContent = 'Скопировать'; }, 2000);
    });

    // Навигация по плиткам
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

    // Предпросмотр как клиент
    el.querySelector('#btn-preview')?.addEventListener('click', () => {
      hapticLight();
      navigateTo('catalog');
    });

    // Подтвердить запись
    el.querySelectorAll('[data-action="confirm"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        hapticSuccess();
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
          btn.closest('.card').style.opacity = '0.4';
          btn.closest('.card').style.pointerEvents = 'none';
        }
      });
    });

    // Закрыть подсказку
    el.querySelector('#dismiss-tip')?.addEventListener('click', () => {
      el.querySelector('#tip-photo').remove();
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
