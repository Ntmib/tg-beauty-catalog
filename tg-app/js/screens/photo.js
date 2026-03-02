/**
 * Экран К2: Просмотр фото (лайтбокс)
 *
 * Открывается при тапе на фото в портфолио.
 * Показывает фото на весь экран с возможностью закрыть.
 */

import { portfolio } from '../data.js';
import { goBack } from '../router.js';

export const photoScreen = {
  render(params) {
    const photo = portfolio[params.index] || portfolio[0];

    return `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh;">
        <div class="portfolio-placeholder ${photo.placeholder} fade-in"
             style="width: 100%; max-width: 400px; aspect-ratio: 1; border-radius: var(--card-radius); font-size: 64px; display: flex; align-items: center; justify-content: center;">
          ${photo.emoji}
        </div>
        <div class="caption mt" style="text-align: center;">
          Фото ${params.index + 1} из ${portfolio.length}
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
