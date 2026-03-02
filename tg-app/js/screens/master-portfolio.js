/**
 * Экран М3: Портфолио (фото работ мастера)
 *
 * Сетка 3 в ряд с кнопкой удаления на каждом фото.
 * Кнопка "Добавить фото".
 */

import { portfolio } from '../data.js';
import { hapticLight, hapticWarning, hideMainButton, confirm as tgConfirm } from '../telegram.js';

const MAX_PHOTOS = 20;

export const masterPortfolioScreen = {
  render() {
    const photoItems = portfolio.map((p, i) => `
      <div class="portfolio-item" data-photo-id="${p.id}">
        <div class="portfolio-placeholder ${p.placeholder}">${p.emoji}</div>
        <div class="portfolio-delete" data-delete="${p.id}">✕</div>
      </div>
    `).join('');

    return `
      <div class="fade-in-up" style="display: flex; justify-content: space-between; align-items: baseline;">
        <div class="page-title" style="margin-bottom: 0;">Фото работ</div>
        <div class="caption">${portfolio.length} из ${MAX_PHOTOS}</div>
      </div>

      <div class="portfolio-grid mt fade-in-up delay-1" id="portfolio-grid">
        ${photoItems}
        ${portfolio.length < MAX_PHOTOS ? `
          <div class="add-photo-btn" id="btn-add-photo">
            <div class="add-photo-btn-icon">+</div>
            <div>Добавить</div>
          </div>
        ` : ''}
      </div>

      <div class="tip mt fade-in-up delay-2">
        <div class="tip-text">💡 Совет: фото "до и после" работают лучше всего</div>
      </div>
    `;
  },

  onEnter(el) {
    hideMainButton();

    // Удаление фото
    el.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        hapticWarning();
        const ok = await tgConfirm('Удалить фото?');
        if (ok) {
          const item = btn.closest('.portfolio-item');
          item.style.opacity = '0';
          item.style.transform = 'scale(0.8)';
          setTimeout(() => item.remove(), 200);
        }
      });
    });

    // Добавить фото (демо — просто анимация)
    el.querySelector('#btn-add-photo')?.addEventListener('click', () => {
      hapticLight();
      // В продакшене — input type=file + upload
      const grid = el.querySelector('#portfolio-grid');
      const newItem = document.createElement('div');
      newItem.className = 'portfolio-item fade-in';
      const phNum = (portfolio.length % 9) + 1;
      newItem.innerHTML = `<div class="portfolio-placeholder ph-${phNum}">🆕</div>`;
      grid.insertBefore(newItem, el.querySelector('#btn-add-photo'));
    });
  },
};
