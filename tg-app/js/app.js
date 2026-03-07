/**
 * Главный модуль приложения
 *
 * Порядок инициализации:
 * 1. Telegram SDK
 * 2. Аутентификация (auth-telegram Edge Function)
 * 3. Определение роли (master / client)
 * 4. Регистрация экранов + роутер
 * 5. Открытие начального экрана
 */

import { initTelegram, getStartParam } from './telegram.js';
import { initRouter, registerScreen, navigateToRoot } from './router.js';
import { authenticate, getRole } from './auth.js';
import { showOfferIfNeeded } from './screens/offer.js';

// Экраны
import { catalogScreen } from './screens/catalog.js';
import { serviceScreen } from './screens/service.js';
import { bookingScreen } from './screens/booking.js';
import { successScreen } from './screens/success.js';
import { recordsScreen } from './screens/records.js';
import { photoScreen } from './screens/photo.js';
import { dashboardScreen } from './screens/dashboard.js';
import { onboardingScreen } from './screens/onboarding.js';
import { masterServicesScreen } from './screens/master-services.js';
import { masterPortfolioScreen } from './screens/master-portfolio.js';
import { masterScheduleScreen } from './screens/master-schedule.js';
import { masterBookingsScreen } from './screens/master-bookings.js';
import { masterProfileScreen } from './screens/master-profile.js';
import { serviceEditScreen } from './screens/service-edit.js';
import { welcomeScreen, shouldShowWelcome } from './screens/welcome.js';

/** Запуск приложения */
async function init() {
  // 1. Telegram SDK
  initTelegram();

  // 2. Показать загрузку пока идёт авторизация
  showLoading();

  // 3. Аутентификация
  const session = await authenticate();

  // 4. Скрыть загрузку
  hideLoading();

  // Если авторизация не удалась — показать ошибку
  if (!session) {
    showError();
    return;
  }

  // 5. Роутер + регистрация экранов
  initRouter();
  registerScreen('catalog', catalogScreen);
  registerScreen('service', serviceScreen);
  registerScreen('booking', bookingScreen);
  registerScreen('success', successScreen);
  registerScreen('records', recordsScreen);
  registerScreen('photo', photoScreen);
  registerScreen('dashboard', dashboardScreen);
  registerScreen('onboarding', onboardingScreen);
  registerScreen('master-services', masterServicesScreen);
  registerScreen('master-portfolio', masterPortfolioScreen);
  registerScreen('master-schedule', masterScheduleScreen);
  registerScreen('master-bookings', masterBookingsScreen);
  registerScreen('master-profile', masterProfileScreen);
  registerScreen('service-edit', serviceEditScreen);
  registerScreen('welcome', welcomeScreen);

  // Показать/скрыть переключатель режимов (только для debug в браузере)
  if (session.debug) {
    setupDebugModeSwitcher();
  }

  // 6. Начальный экран
  await openStartScreen();
}

/** Определить начальный экран по роли */
async function openStartScreen() {
  const role = getRole();

  if (role === 'master') {
    const { getMasterRow } = await import('./api.js');
    try {
      const masterData = await getMasterRow();
      if (!masterData.onboarding_done) {
        navigateToRoot('onboarding');
      } else {
        navigateToRoot('dashboard');
      }
    } catch (e) {
      console.error('[app] Ошибка загрузки мастера:', e);
      navigateToRoot('onboarding');
    }
  } else {
    // Клиент
    if (shouldShowWelcome()) {
      navigateToRoot('welcome');
    } else {
      await showOfferIfNeeded();
      navigateToRoot('catalog');
    }
  }
}

// ============================================================
// Утилиты загрузки
// ============================================================

function showLoading() {
  const el = document.getElementById('loading-overlay');
  if (el) el.style.display = 'flex';
}

function hideLoading() {
  const el = document.getElementById('loading-overlay');
  if (!el) return;
  el.style.opacity = '0';
  setTimeout(() => { el.style.display = 'none'; el.style.opacity = '1'; }, 300);
}

function showError() {
  const container = document.getElementById('screen-container');
  if (container) {
    container.innerHTML = `
      <div class="empty-state" style="padding-top: 40vh;">
        <div class="empty-state-icon">❌</div>
        <div class="empty-state-title">Ошибка авторизации</div>
        <div class="empty-state-text">Перезапустите приложение через Telegram</div>
      </div>
    `;
  }
}

// ============================================================
// Debug: переключатель режимов (только браузер)
// ============================================================

function setupDebugModeSwitcher() {
  const switcher = document.getElementById('mode-switcher');
  if (!switcher) return;

  switcher.style.display = 'flex';

  switcher.querySelector('#mode-client')?.addEventListener('click', () => {
    navigateToRoot('catalog');
  });

  switcher.querySelector('#mode-master')?.addEventListener('click', async () => {
    navigateToRoot('dashboard');
  });
}

/** Получить режим (для совместимости) */
export function getMode() {
  return getRole();
}

document.addEventListener('DOMContentLoaded', init);
