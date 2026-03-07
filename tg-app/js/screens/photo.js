/**
 * Экран К2: Просмотр фото (лайтбокс)
 *
 * Открывается при тапе на фото в портфолио.
 * Показывает фото на весь экран с возможностью закрыть.
 * params: { index: number, photos: Array }
 */

import { goBack } from '../router.js';

export const photoScreen = {
  render(params) {
    const photos = params.photos || [];
    const photo = photos[params.index] || photos[0] || {};
    const total = photos.length;

    const imgHtml = photo.image_url
      ? `<img src="${photo.image_url}" alt="Фото ${params.index + 1}"
             style="width:100%;max-width:400px;aspect-ratio:1;object-fit:cover;border-radius:var(--radius-md);"
             onerror="this.style.display='none'">`
      : `<div style="width:100%;max-width:400px;aspect-ratio:1;border-radius:var(--radius-md);background:var(--tg-theme-secondary-bg-color,#f0f0f0);display:flex;align-items:center;justify-content:center;font-size:64px;">💅</div>`;

    return `
      <div class="screen-centered">
        ${imgHtml}
        <div class="caption mt text-center">
          Фото ${params.index + 1} из ${total}
        </div>
        <button class="btn btn-secondary mt" id="btn-close-photo">Закрыть</button>
      </div>
    `;
  },

  onEnter(el) {
    el.querySelector('#btn-close-photo')?.addEventListener('click', () => {
      goBack();
    });
  },
};
