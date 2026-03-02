/**
 * Обёртка над Telegram WebApp SDK
 *
 * Предоставляет единый интерфейс для работы с Telegram API.
 * В браузере (без Telegram) — безопасные заглушки.
 */

// Ссылка на WebApp объект
const tg = window.Telegram?.WebApp;

/** Инициализация Mini App */
export function initTelegram() {
  if (!tg) {
    console.warn('Telegram WebApp SDK не найден — работаем в режиме браузера');
    return;
  }

  // Развернуть на полный экран
  tg.expand();

  // Отключить вертикальные свайпы (чтобы скролл не закрывал Mini App)
  if (tg.disableVerticalSwipes) {
    tg.disableVerticalSwipes();
  }

  // Сообщить Telegram что приложение готово
  tg.ready();
}

/** Получить данные пользователя из initData */
export function getUser() {
  if (!tg?.initDataUnsafe?.user) {
    // Фоллбэк для браузера
    return {
      id: 999888777,
      first_name: 'Тест',
      last_name: 'Пользователь',
      username: 'test_user',
    };
  }
  return tg.initDataUnsafe.user;
}

/** Получить start_param из initData */
export function getStartParam() {
  return tg?.initDataUnsafe?.start_param || null;
}

// --- MainButton ---

/** Показать MainButton с текстом */
export function showMainButton(text, callback) {
  if (!tg) {
    // Для браузера — не показываем (или можно добавить фолбэк)
    return;
  }
  tg.MainButton.setText(text);
  tg.MainButton.show();
  tg.MainButton.enable();
  // Убираем старые обработчики и ставим новый
  tg.MainButton.offClick(_mainButtonCallback);
  _mainButtonCallback = callback;
  tg.MainButton.onClick(callback);
}

let _mainButtonCallback = () => {};

/** Скрыть MainButton */
export function hideMainButton() {
  if (!tg) return;
  tg.MainButton.hide();
  tg.MainButton.offClick(_mainButtonCallback);
}

/** Отключить MainButton (сделать неактивной) */
export function disableMainButton() {
  if (!tg) return;
  tg.MainButton.disable();
}

/** Включить MainButton */
export function enableMainButton() {
  if (!tg) return;
  tg.MainButton.enable();
}

/** Показать прогресс на MainButton */
export function showMainButtonProgress() {
  if (!tg) return;
  tg.MainButton.showProgress(false);
}

/** Скрыть прогресс на MainButton */
export function hideMainButtonProgress() {
  if (!tg) return;
  tg.MainButton.hideProgress();
}

// --- BackButton ---

let _backButtonCallback = () => {};

/** Показать BackButton с обработчиком */
export function showBackButton(callback) {
  if (!tg) return;
  tg.BackButton.show();
  tg.BackButton.offClick(_backButtonCallback);
  _backButtonCallback = callback;
  tg.BackButton.onClick(callback);
}

/** Скрыть BackButton */
export function hideBackButton() {
  if (!tg) return;
  tg.BackButton.hide();
  tg.BackButton.offClick(_backButtonCallback);
}

// --- HapticFeedback ---

/** Лёгкая вибрация (выбор элемента) */
export function hapticLight() {
  tg?.HapticFeedback?.impactOccurred?.('light');
}

/** Средняя вибрация (действие) */
export function hapticMedium() {
  tg?.HapticFeedback?.impactOccurred?.('medium');
}

/** Вибрация при изменении выбора */
export function hapticSelection() {
  tg?.HapticFeedback?.selectionChanged?.();
}

/** Уведомление об успехе */
export function hapticSuccess() {
  tg?.HapticFeedback?.notificationOccurred?.('success');
}

/** Уведомление об ошибке */
export function hapticError() {
  tg?.HapticFeedback?.notificationOccurred?.('error');
}

/** Уведомление-предупреждение */
export function hapticWarning() {
  tg?.HapticFeedback?.notificationOccurred?.('warning');
}

// --- Диалоги ---

/** Нативное подтверждение (showConfirm) */
export function confirm(message) {
  return new Promise((resolve) => {
    if (tg?.showConfirm) {
      tg.showConfirm(message, resolve);
    } else {
      resolve(window.confirm(message));
    }
  });
}

/** Нативное уведомление (showAlert) */
export function alert(message) {
  return new Promise((resolve) => {
    if (tg?.showAlert) {
      tg.showAlert(message, resolve);
    } else {
      window.alert(message);
      resolve();
    }
  });
}

// --- Другое ---

/** Закрыть Mini App */
export function close() {
  if (tg) {
    tg.close();
  }
}

/** Включить подтверждение закрытия */
export function enableClosingConfirmation() {
  if (tg?.enableClosingConfirmation) {
    tg.enableClosingConfirmation();
  }
}

/** Отключить подтверждение закрытия */
export function disableClosingConfirmation() {
  if (tg?.disableClosingConfirmation) {
    tg.disableClosingConfirmation();
  }
}

/** Запросить разрешение на отправку сообщений */
export function requestWriteAccess() {
  return new Promise((resolve) => {
    if (tg?.requestWriteAccess) {
      tg.requestWriteAccess(resolve);
    } else {
      resolve(true);
    }
  });
}

/** Проверка — внутри Telegram или в браузере */
export function isInTelegram() {
  return !!tg?.initData;
}
