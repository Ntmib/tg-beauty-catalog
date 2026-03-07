/**
 * Экран М3: Портфолио мастера
 *
 * Загрузка фото из Supabase Storage + управление галереей.
 */

import { hapticLight, hapticWarning, hideMainButton, confirm as tgConfirm } from '../telegram.js';
import { getPortfolio, uploadPhoto, deletePhoto, clearCache } from '../api.js';

export const masterPortfolioScreen = {
  render() {
    return `
      <div class="fade-in-up" style="display: flex; justify-content: space-between; align-items: baseline;">
        <div class="page-title" style="margin-bottom: 0;">Фото работ</div>
        <div class="caption" id="photo-count">Загрузка...</div>
      </div>
      <div class="portfolio-grid mt fade-in-up delay-1" id="portfolio-grid">
        <div class="caption text-center" style="padding: 40px 0; grid-column: 1/-1;">Загрузка...</div>
      </div>
      <div class="tip mt fade-in-up delay-2">
        <div class="tip-text">💡 Совет: фото "до и после" работают лучше всего</div>
      </div>
      <!-- Скрытый input для выбора файла -->
      <input type="file" id="photo-file-input" accept="image/*" style="display:none;" multiple>
    `;
  },

  async onEnter(el) {
    hideMainButton();

    const MAX_PHOTOS = 20;
    let portfolio = await getPortfolio(true).catch(() => []);

    const renderGrid = () => {
      const photoCount = portfolio.length;
      el.querySelector('#photo-count').textContent = `${photoCount} из ${MAX_PHOTOS}`;

      const items = portfolio.map(p => `
        <div class="portfolio-item" data-photo-id="${p.id}" data-photo-url="${p.image_url}">
          <img src="${p.image_url}" alt="Работа"
               style="width:100%;height:100%;object-fit:cover;border-radius:8px;"
               onerror="this.parentNode.style.background='#f0f0f0'">
          <button class="portfolio-delete" data-delete="${p.id}" aria-label="Удалить фото">✕</button>
        </div>
      `).join('');

      const addBtn = photoCount < MAX_PHOTOS ? `
        <button class="add-photo-btn" id="btn-add-photo">
          <div class="add-photo-btn-icon">+</div>
          <div>Добавить</div>
        </button>
      ` : '';

      el.querySelector('#portfolio-grid').innerHTML = items + addBtn;
      setupGridActions();
    };

    const setupGridActions = () => {
      // Удаление
      el.querySelectorAll('[data-delete]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          hapticWarning();
          const ok = await tgConfirm('Удалить фото?');
          if (ok) {
            const id = btn.dataset.delete;
            const item = btn.closest('.portfolio-item');
            const url = item.dataset.photoUrl;
            try {
              await deletePhoto(id, url);
              portfolio = portfolio.filter(p => p.id !== id);
              clearCache();
              renderGrid();
            } catch (e) {
              console.error('[master-portfolio] Ошибка удаления:', e);
            }
          }
        });
      });

      // Добавить фото
      el.querySelector('#btn-add-photo')?.addEventListener('click', () => {
        hapticLight();
        el.querySelector('#photo-file-input').click();
      });
    };

    // Обработка выбора файла
    el.querySelector('#photo-file-input')?.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      const addBtn = el.querySelector('#btn-add-photo');
      if (addBtn) { addBtn.textContent = 'Загрузка...'; addBtn.disabled = true; }

      for (const file of files) {
        if (portfolio.length >= MAX_PHOTOS) break;
        try {
          const uploaded = await uploadPhoto(file);
          portfolio.push(uploaded);
          clearCache();
        } catch (err) {
          console.error('[master-portfolio] Ошибка загрузки:', err);
        }
      }

      e.target.value = '';
      renderGrid();
    });

    renderGrid();
  },
};
