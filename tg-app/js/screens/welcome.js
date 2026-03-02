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
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 70vh; text-align: center; padding: 20px;">

        <div class="fade-in-up" style="font-size: 56px; margin-bottom: 20px;">👋</div>

        <div class="fade-in-up delay-1" style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">
          Привет, ${name}!
        </div>

        <div class="fade-in-up delay-2" style="font-size: 15px; color: var(--hint); margin-bottom: 32px; line-height: 1.5;">
          Это каталог бьюти-мастера.<br>Вот что здесь можно:
        </div>

        <div class="fade-in-up delay-3" style="text-align: left; width: 100%; max-width: 280px; margin-bottom: 36px;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <div style="font-size: 28px; flex-shrink: 0;">💅</div>
            <div>
              <div style="font-weight: 600; font-size: 15px;">Посмотреть услуги и цены</div>
              <div style="font-size: 13px; color: var(--hint);">Портфолио работ с фото</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <div style="font-size: 28px; flex-shrink: 0;">📅</div>
            <div>
              <div style="font-weight: 600; font-size: 15px;">Записаться онлайн</div>
              <div style="font-size: 13px; color: var(--hint);">Выбрать дату и время за пару тапов</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 28px; flex-shrink: 0;">🔔</div>
            <div>
              <div style="font-weight: 600; font-size: 15px;">Получать напоминания</div>
              <div style="font-size: 13px; color: var(--hint);">Бот напомнит о записи за день</div>
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
