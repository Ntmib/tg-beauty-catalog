/**
 * Экран приветствия (онбординг клиента)
 *
 * Показывается один раз при первом открытии.
 * Обращение по имени из Telegram, описание возможностей.
 */

import { getUser } from '../telegram.js';
import { navigateToRoot } from '../router.js';

const STORAGE_KEY = 'welcome_shown';

export const welcomeScreen = {
  render() {
    const user = getUser();
    const name = user.first_name || 'друг';

    return `
      <div class="screen-centered">

        <div class="hero-emoji fade-in-up">👋</div>

        <div class="hero-title fade-in-up delay-1">
          Привет, ${name}!
        </div>

        <div class="caption fade-in-up delay-2" style="margin-bottom: var(--space-8); line-height: 1.5;">
          Это каталог бьюти-мастера.<br>Вот что здесь можно:
        </div>

        <div class="fade-in-up delay-3" style="text-align: left; width: 100%; max-width: 280px; margin-bottom: var(--space-10);">
          <div class="card-row" style="margin-bottom: var(--space-4);">
            <div class="card-icon">💅</div>
            <div class="card-body">
              <div class="card-title">Посмотреть услуги и цены</div>
              <div class="card-subtitle">Портфолио работ с фото</div>
            </div>
          </div>
          <div class="card-row" style="margin-bottom: var(--space-4);">
            <div class="card-icon">📅</div>
            <div class="card-body">
              <div class="card-title">Записаться онлайн</div>
              <div class="card-subtitle">Выбрать дату и время за пару тапов</div>
            </div>
          </div>
          <div class="card-row">
            <div class="card-icon">🔔</div>
            <div class="card-body">
              <div class="card-title">Получать напоминания</div>
              <div class="card-subtitle">Бот напомнит о записи за день</div>
            </div>
          </div>
        </div>

        <button class="btn btn-primary btn-full fade-in-up delay-4" id="btn-welcome-start"
                style="max-width: 280px;">
          Начать
        </button>
      </div>
    `;
  },

  onEnter(el) {
    el.querySelector('#btn-welcome-start')?.addEventListener('click', () => {
      // Запоминаем что приветствие показано
      localStorage.setItem(STORAGE_KEY, '1');
      navigateToRoot('catalog');
    });
  },
};

/** Проверить, нужно ли показывать приветствие */
export function shouldShowWelcome() {
  return !localStorage.getItem(STORAGE_KEY);
}
