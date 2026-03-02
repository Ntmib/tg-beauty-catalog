/**
 * Главный модуль приложения
 *
 * Инициализация Telegram SDK, регистрация экранов,
 * переключение режимов мастер/клиент, запуск роутера.
 */

import { initTelegram, getUser, getStartParam } from './telegram.js';
import { initRouter, registerScreen, navigateToRoot } from './router.js';
import { master } from './data.js';
import { showOfferIfNeeded } from './screens/offer.js';

// Импорт всех экранов
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

// Текущий режим: 'client' или 'master'
let currentMode = 'client';

/** Запуск приложения */
async function init() {
  // 1. Инициализация Telegram SDK
  initTelegram();

  // 2. Инициализация роутера
  initRouter();

  // 3. Регистрация всех экранов
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

  // 4. Определение режима
  detectMode();

  // 5. Настройка переключателя режимов (демо)
  setupModeSwitcher();

  // 6. Оффер для клиентов (один раз при первом открытии)
  if (currentMode === 'client') {
    await showOfferIfNeeded();
  }

  // 7. Открыть начальный экран
  openStartScreen();
}

/**
 * Определение режима: мастер или клиент
 *
 * В продакшене: сравниваем initData.user.id с masters.telegram_id
 * Сейчас: по умолчанию клиент, переключается вручную
 */
function detectMode() {
  const user = getUser();
  const startParam = getStartParam();

  // Если start_param начинается с 'admin' — мастер
  if (startParam === 'admin') {
    currentMode = 'master';
  }

  // Если user.id совпадает с мастером — мастер
  if (user.id === master.telegram_id) {
    currentMode = 'master';
  }
}

/** Открыть стартовый экран в зависимости от режима */
function openStartScreen() {
  if (currentMode === 'master') {
    if (!master.onboarding_done) {
      navigateToRoot('onboarding');
    } else {
      navigateToRoot('dashboard');
    }
  } else {
    // Первый раз — приветствие, потом каталог
    if (shouldShowWelcome()) {
      navigateToRoot('welcome');
    } else {
      navigateToRoot('catalog');
    }
  }
}

/** Настройка переключателя режимов (для демо) */
function setupModeSwitcher() {
  const clientBtn = document.getElementById('mode-client');
  const masterBtn = document.getElementById('mode-master');

  if (!clientBtn || !masterBtn) return;

  // Обновить активное состояние
  function updateButtons() {
    clientBtn.classList.toggle('active', currentMode === 'client');
    masterBtn.classList.toggle('active', currentMode === 'master');
  }

  updateButtons();

  clientBtn.addEventListener('click', () => {
    if (currentMode === 'client') return;
    currentMode = 'client';
    updateButtons();
    navigateToRoot('catalog');
  });

  masterBtn.addEventListener('click', () => {
    if (currentMode === 'master') return;
    currentMode = 'master';
    updateButtons();
    if (!master.onboarding_done) {
      navigateToRoot('onboarding');
    } else {
      navigateToRoot('dashboard');
    }
  });
}

/** Получить текущий режим */
export function getMode() {
  return currentMode;
}

// Запуск при загрузке DOM
document.addEventListener('DOMContentLoaded', init);
