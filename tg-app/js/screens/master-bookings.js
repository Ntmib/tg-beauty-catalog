/**
 * Экран М5: Записи (список для мастера)
 *
 * Показывает все записи с фильтрами:
 * Новые (pending), Все, Прошлые.
 */

import { bookings, formatDate } from '../data.js';
import { hapticLight, hapticSuccess, hapticWarning, hideMainButton, confirm as tgConfirm } from '../telegram.js';

export const masterBookingsScreen = {
  render() {
    const pendingCount = bookings.filter(b => b.status === 'pending').length;

    return `
      <div class="page-title fade-in-up">Записи</div>

      <!-- Табы-фильтры -->
      <div class="tabs fade-in-up delay-1" id="booking-tabs">
        <button class="tab active" data-filter="new">Новые (${pendingCount})</button>
        <button class="tab" data-filter="all">Все</button>
        <button class="tab" data-filter="past">Прошлые</button>
      </div>

      <div id="bookings-content" class="fade-in-up delay-2" aria-live="polite">
        ${renderBookingsList('new')}
      </div>
    `;
  },

  onEnter(el) {
    hideMainButton();

    // Переключение табов
    el.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        hapticLight();
        el.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const filter = tab.dataset.filter;
        el.querySelector('#bookings-content').innerHTML = renderBookingsList(filter);
        setupBookingActions(el);
      });
    });

    setupBookingActions(el);
  },
};

function renderBookingsList(filter) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let filtered;
  if (filter === 'new') {
    filtered = bookings.filter(b => b.status === 'pending');
  } else if (filter === 'past') {
    filtered = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled_by_client');
  } else {
    filtered = [...bookings];
  }

  // Сортировка по дате
  filtered.sort((a, b) => a.booking_date.localeCompare(b.booking_date) || a.booking_time.localeCompare(b.booking_time));

  if (filtered.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <div class="empty-state-text">Нет записей</div>
      </div>
    `;
  }

  // Группировка по дате
  const grouped = {};
  filtered.forEach(b => {
    if (!grouped[b.booking_date]) grouped[b.booking_date] = [];
    grouped[b.booking_date].push(b);
  });

  let html = '';
  Object.entries(grouped).forEach(([date, items]) => {
    html += `<div class="divider-text">${getDateLabel(date)}</div>`;
    items.forEach(b => {
      const statusIcon = b.status === 'confirmed' ? '✅' :
        b.status === 'pending' ? '⏳' :
          b.status === 'completed' ? '✓' : '✗';
      const statusClass = `status-${b.status === 'cancelled_by_client' ? 'cancelled' : b.status}`;

      html += `
        <div class="card" data-booking-id="${b.id}">
          <div class="card-row">
            <div>
              <div class="card-title">${statusIcon} ${b.booking_time} · ${b.client_name}</div>
              <div class="card-subtitle">${b.service_title}</div>
            </div>
          </div>
          ${b.status === 'pending' ? `
            <div class="card-actions">
              <button class="btn btn-sm btn-primary flex-1" data-action="confirm" data-id="${b.id}">✓ Подтвердить</button>
              <button class="btn btn-sm btn-destructive" data-action="decline" data-id="${b.id}">Нет</button>
            </div>
          ` : ''}
        </div>
      `;
    });
  });

  return html;
}

function setupBookingActions(el) {
  el.querySelectorAll('[data-action="confirm"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      hapticSuccess();
      const card = btn.closest('.card');
      card.querySelector('.card-actions').innerHTML = '<div class="status status-confirmed mt-sm">✅ Подтверждена</div>';
    });
  });

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
}

function getDateLabel(dateStr) {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = new Date(dateStr + 'T00:00:00');

  if (date.toDateString() === today.toDateString()) return `Сегодня, ${date.getDate()} ${getMonth(date)}`;
  if (date.toDateString() === tomorrow.toDateString()) return `Завтра, ${date.getDate()} ${getMonth(date)}`;
  return formatDate(dateStr);
}

function getMonth(date) {
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  return months[date.getMonth()];
}
