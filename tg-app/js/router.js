/**
 * SPA-роутер для Mini App
 *
 * Управляет стеком экранов, анимациями переходов,
 * BackButton в Telegram и MainButton.
 */

import { showBackButton, hideBackButton, hideMainButton } from './telegram.js';

// Стек экранов (история навигации)
let screenStack = [];

// Контейнер для экранов
let container = null;

// Карта зарегистрированных экранов: id → { render, onEnter?, onLeave? }
const screens = new Map();

/** Инициализация роутера */
export function initRouter() {
  container = document.getElementById('screen-container');
}

/** Регистрация экрана */
export function registerScreen(id, screenDef) {
  screens.set(id, screenDef);
}

/**
 * Перейти на экран (push)
 * @param {string} screenId - ID экрана
 * @param {object} params - Параметры для передачи экрану
 * @param {boolean} replace - Заменить текущий экран (без добавления в стек)
 */
export function navigateTo(screenId, params = {}, replace = false) {
  const screenDef = screens.get(screenId);
  if (!screenDef) {
    console.error(`Экран "${screenId}" не найден`);
    return;
  }

  // Скрыть MainButton перед переходом (новый экран сам настроит)
  hideMainButton();

  // Анимация ухода текущего экрана
  const currentEl = container.querySelector('.screen.active');
  if (currentEl) {
    currentEl.classList.remove('active');
    currentEl.classList.add('exit-left');
    // Удалить после анимации
    setTimeout(() => {
      currentEl.remove();
    }, 300);
  }

  // Добавить или заменить в стеке
  if (replace && screenStack.length > 0) {
    screenStack[screenStack.length - 1] = { id: screenId, params };
  } else {
    screenStack.push({ id: screenId, params });
  }

  // Рендер нового экрана
  renderScreen(screenDef, params);

  // BackButton: показать если не первый экран
  updateBackButton();
}

/**
 * Вернуться назад (pop)
 */
export function goBack() {
  if (screenStack.length <= 1) return;

  hideMainButton();

  // Убрать текущий экран
  screenStack.pop();

  // Анимация ухода текущего экрана (вправо)
  const currentEl = container.querySelector('.screen.active');
  if (currentEl) {
    currentEl.classList.remove('active');
    currentEl.style.transform = 'translateX(30px)';
    currentEl.style.opacity = '0';
    setTimeout(() => currentEl.remove(), 300);
  }

  // Восстановить предыдущий экран
  const prev = screenStack[screenStack.length - 1];
  const screenDef = screens.get(prev.id);
  if (screenDef) {
    renderScreen(screenDef, prev.params);
  }

  updateBackButton();
}

/**
 * Перейти на экран как корневой (очистить стек)
 */
export function navigateToRoot(screenId, params = {}) {
  hideMainButton();

  // Анимация ухода
  const currentEl = container.querySelector('.screen.active');
  if (currentEl) {
    currentEl.classList.remove('active');
    currentEl.style.opacity = '0';
    setTimeout(() => currentEl.remove(), 300);
  }

  // Очистить стек
  screenStack = [{ id: screenId, params }];

  const screenDef = screens.get(screenId);
  if (screenDef) {
    renderScreen(screenDef, params);
  }

  updateBackButton();
}

/** Текущий экран */
export function currentScreen() {
  if (screenStack.length === 0) return null;
  return screenStack[screenStack.length - 1];
}

// --- Внутренние функции ---

function renderScreen(screenDef, params) {
  // Создаём элемент экрана
  const el = document.createElement('div');
  el.className = 'screen';

  // Рендер HTML
  el.innerHTML = screenDef.render(params);

  // Добавить в контейнер
  container.appendChild(el);

  // Запустить анимацию появления (через requestAnimationFrame)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.classList.add('active');
    });
  });

  // Вызвать onEnter после рендера (инициализация событий и т.д.)
  if (screenDef.onEnter) {
    // Небольшая задержка чтобы DOM успел обновиться
    setTimeout(() => {
      screenDef.onEnter(el, params);
    }, 50);
  }
}

function updateBackButton() {
  if (screenStack.length > 1) {
    showBackButton(() => goBack());
  } else {
    hideBackButton();
  }
}
