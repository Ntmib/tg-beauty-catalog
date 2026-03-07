/**
 * Экран М5: Записи мастера
 *
 * Загружает записи из Supabase с возможностью подтвердить/отклонить.
 */

import { formatDate } from '../data.js';
import { hapticLight, hapticSuccess, hapticWarning, hideMainButton, confirm as tgConfirm } from '../telegram.js';
import { getMasterBookings, updateBookingStatus } from '../api.js';

export const masterBookingsScreen = {
  render() {
    return `
      <div class="page-title fade-in-up">Записи</div>
      <div class="tabs fade-in-up delay-1" id="booking-tabs">
        <button class="tab active" data-filter="new">Новые</button>
        <button class="tab" data-filter="all">Все</button>
        <button class="tab" data-filter="past">Прошлые</button>
      </div>
      <div id="bookings-content" class="fade-in-up delay-2" aria-live="polite">
        <div class="caption text-center" style="padding: 40px 0;">Загрузка записей...</div>
      </div>
    `;
  },

  async onEnter(el) {
    hideMainButton();

    let allBookings = await getMasterBookings().catch(() => []);

    const render = (filter) => {
      el.querySelector('#bookings-content').innerHTML = renderList(allBookings, filter);
      setupActions(el, allBookings, render);
    };

    // Обновить счётчик табов
    const pendingCount = allBookings.filter(b => b.status === 'pending').length;
    el.querySelector('[data-filter="new"]').textContent = `Новые (${pendingCount})`;

    render('new');

    el.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        hapticLight();
        el.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        render(tab.dataset.filter);
      });
    });
  },
};

function renderList(bookings, filter) {
  let filtered;
  if (filter === 'new') {
    filtered = bookings.filter(b => b.status === 'pending');
  } else if (filter === 'past') {
    filtered = bookings.filter(b => ['completed', 'cancelled_by_client', 'cancelled_by_master'].includes(b.status));
  } else {
    filtered = [...bookings];
  }

  filtered.sort((a, b) => a.booking_date.localeCompare(b.booking_date) || a.booking_time.localeCompare(b.booking_time));

  if (filtered.length === 0) {
    return `<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">Нет записей</div></div>`;
  }

  const grouped = {};
  filtered.forEach(b => {
    if (!grouped[b.booking_date]) grouped[b.booking_date] = [];
    grouped[b.booking_date].push(b);
  });

  let html = '';
  Object.entries(grouped).forEach(([date, items]) => {
    html += `<div class="divider-text">${getDateLabel(date)}</div>`;
    items.forEach(b => {
      const statusIcon = b.status === 'confirmed' ? '✅' : b.status === 'pending' ? '⏳' : b.status === 'completed' ? '✓' : '✗';
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

function setupActions(el, allBookings, rerender) {
  el.querySelectorAll('[data-action="confirm"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      hapticSuccess();
      await updateBookingStatus(btn.dataset.id, 'confirmed').catch(console.error);
      const booking = allBookings.find(b => b.id === btn.dataset.id);
      if (booking) booking.status = 'confirmed';
      const tab = el.querySelector('.tab.active')?.dataset.filter || 'new';
      rerender(tab);
    });
  });

  el.querySelectorAll('[data-action="decline"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      hapticWarning();
      const ok = await tgConfirm('Отклонить запись?');
      if (ok) {
        await updateBookingStatus(btn.dataset.id, 'cancelled_by_master').catch(console.error);
        const booking = allBookings.find(b => b.id === btn.dataset.id);
        if (booking) booking.status = 'cancelled_by_master';
        const tab = el.querySelector('.tab.active')?.dataset.filter || 'new';
        rerender(tab);
      }
    });
  });
}

function getDateLabel(dateStr) {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = new Date(dateStr + 'T00:00:00');
  const months = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
  if (date.toDateString() === today.toDateString()) return `Сегодня, ${date.getDate()} ${months[date.getMonth()]}`;
  if (date.toDateString() === tomorrow.toDateString()) return `Завтра, ${date.getDate()} ${months[date.getMonth()]}`;
  return formatDate(dateStr);
}
