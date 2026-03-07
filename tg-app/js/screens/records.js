/**
 * Экран К6: Мои записи (клиент)
 *
 * Загружает записи клиента из Supabase.
 */

import { formatPrice, formatDate, getEndTime } from '../data.js';
import { navigateTo } from '../router.js';
import { showMainButton, hapticLight, hapticWarning, confirm as tgConfirm } from '../telegram.js';
import { getClientBookings, cancelBooking } from '../api.js';

export const recordsScreen = {
  render() {
    return `
      <div class="page-title fade-in-up">Мои записи</div>
      <div id="records-content">
        <div class="caption text-center" style="padding: 40px 0;">Загрузка записей...</div>
      </div>
    `;
  },

  async onEnter(el) {
    showMainButton('Записаться', () => navigateTo('catalog'));

    const bookings = await getClientBookings().catch(() => []);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = bookings.filter(b => {
      const d = new Date(b.booking_date + 'T00:00:00');
      return d >= today && !['completed', 'cancelled_by_client', 'cancelled_by_master'].includes(b.status);
    });

    const past = bookings.filter(b => {
      const d = new Date(b.booking_date + 'T00:00:00');
      return d < today || b.status === 'completed';
    });

    let html = '';

    if (upcoming.length > 0) {
      html += `<div class="divider-text fade-in-up delay-1">Предстоящие</div>`;
      upcoming.forEach((b, i) => {
        const statusClass = b.status === 'confirmed' ? 'status-confirmed' : 'status-pending';
        const statusText = b.status === 'confirmed' ? '✅ Подтверждена' : '⏳ Ожидает подтверждения';
        const endTime = getEndTime(b.booking_time, b.duration);
        html += `
          <div class="card fade-in-up delay-${Math.min(i + 2, 6)}" data-booking-id="${b.id}">
            <div class="card-title">💅 ${b.service_title}</div>
            <div class="card-subtitle">${formatDate(b.booking_date)} · ${b.booking_time} - ${endTime}</div>
            <div class="status ${statusClass}">${statusText}</div>
            <div class="card-actions">
              <button class="btn btn-destructive btn-sm" data-action="cancel" data-id="${b.id}">Отменить</button>
              <button class="btn btn-outline btn-sm" data-action="reschedule" data-service="${b.service_id}">Перенести</button>
            </div>
          </div>
        `;
      });
    }

    if (past.length > 0) {
      html += `<div class="divider-text fade-in-up delay-3">Прошедшие</div>`;
      past.forEach((b, i) => {
        html += `
          <div class="card fade-in-up delay-${Math.min(i + 4, 6)}">
            <div class="card-title">💅 ${b.service_title}</div>
            <div class="card-subtitle">${formatDate(b.booking_date)} · ${b.booking_time}</div>
            <div class="status status-completed">✓ Завершена</div>
            <div class="card-actions">
              <button class="btn btn-outline btn-sm" data-action="repeat" data-service="${b.service_id}">Повторить запись</button>
            </div>
          </div>
        `;
      });
    }

    if (upcoming.length === 0 && past.length === 0) {
      html += `
        <div class="empty-state fade-in-up delay-1">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-title">У вас пока нет записей</div>
          <div class="empty-state-text">Выберите услугу и запишитесь</div>
        </div>
      `;
    }

    el.querySelector('#records-content').innerHTML = html;

    // Отмена
    el.querySelectorAll('[data-action="cancel"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        hapticWarning();
        const ok = await tgConfirm('Отменить запись?');
        if (ok) {
          try {
            await cancelBooking(btn.dataset.id);
            btn.closest('.card').style.opacity = '0.4';
            btn.closest('.card').style.pointerEvents = 'none';
          } catch (err) {
            console.error(err);
          }
        }
      });
    });

    // Перенести / Повторить
    el.querySelectorAll('[data-action="reschedule"], [data-action="repeat"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        hapticLight();
        navigateTo('booking', { serviceId: btn.dataset.service });
      });
    });
  },
};
