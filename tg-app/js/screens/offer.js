/**
 * Модалка-оффер: скидка 15% при первом открытии
 *
 * Показывается один раз — запоминаем в localStorage.
 * Кнопка ведёт на бота, «Пропустить» закрывает.
 */

const STORAGE_KEY = 'offer_shown';

// Юзернейм бота (без @)
const BOT_USERNAME = 'Beauty_100master_bot';

/**
 * Показать оффер, если ещё не показывали
 * @returns {Promise<void>} — резолвится когда пользователь закрыл модалку
 */
export function showOfferIfNeeded() {
  return new Promise((resolve) => {
    // Уже показывали — пропускаем
    if (localStorage.getItem(STORAGE_KEY)) {
      resolve();
      return;
    }

    // Создаём оверлей
    const overlay = document.createElement('div');
    overlay.className = 'offer-overlay';
    overlay.innerHTML = `
      <div class="offer-card">
        <div class="offer-emoji">🎁</div>
        <div class="offer-title">Скидка 15% на первую запись</div>
        <div class="offer-subtitle">Подпишитесь на бота — получите промокод в личное сообщение</div>

        <div class="offer-bullets">
          <div class="offer-bullet">• Напомним о записи за день</div>
          <div class="offer-bullet">• Первыми узнаёте о свободных окошках</div>
          <div class="offer-bullet">• Эксклюзивные акции для подписчиков</div>
        </div>

        <a class="offer-btn" href="https://t.me/${BOT_USERNAME}?start=from_app" target="_blank" id="offer-accept">
          Получить скидку 15%
        </a>
        <button class="offer-skip" id="offer-skip">Пропустить</button>
      </div>
    `;

    document.body.appendChild(overlay);

    // Анимация появления (через RAF чтобы transition сработал)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.add('visible');
      });
    });

    // Закрытие модалки
    const close = () => {
      localStorage.setItem(STORAGE_KEY, '1');
      overlay.classList.remove('visible');
      setTimeout(() => {
        overlay.remove();
        resolve();
      }, 300);
    };

    overlay.querySelector('#offer-accept').addEventListener('click', close);
    overlay.querySelector('#offer-skip').addEventListener('click', close);

    // Закрытие по тапу на оверлей (мимо карточки)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
  });
}
