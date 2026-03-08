/**
 * Экран М0: Онбординг мастера
 *
 * Шаг 0: Питч — зачем это нужно (простым языком)
 * Шаг 1: Профиль (имя + специализация)
 * Шаг 2: Выбор услуг из шаблона
 * Финал: Превью каталога + необязательное подключение своего бота
 *
 * Расписание сохраняется автоматически по умолчанию (Пн-Пт, 10:00–19:00).
 * Бот можно подключить потом — это не блокирует выход на дашборд.
 */

import { specialties, serviceTemplates, formatPrice, formatDuration } from '../data.js';
import { navigateToRoot } from '../router.js';
import { showMainButton, hideMainButton, hapticSelection, hapticSuccess } from '../telegram.js';
import { saveMasterProfile, saveService, saveSchedule, completeOnboarding, getMasterRow } from '../api.js';
import { callEdgeFunction } from '../auth.js';

let currentStep = 0;
let selectedSpecialties = [];
let selectedServices = [];
let onboardingData = {};

export const onboardingScreen = {
  render() {
    currentStep = 0;
    selectedSpecialties = [];
    selectedServices = [];
    onboardingData = {};
    return renderStep0();
  },

  onEnter(el) {
    setupStep0(el);
  },
};

// ============================================================
// Шаг 0: Питч
// ============================================================

function renderStep0() {
  return `
    <div class="text-center fade-in-up" style="padding: 8px 0 16px;">
      <div style="font-size: 56px; margin-bottom: 12px;">💅</div>
      <div class="page-title" style="font-size: 22px; line-height: 1.3;">
        Давайте откроем ваш салон!
      </div>
      <div class="caption" style="margin-top: 8px; font-size: 15px; line-height: 1.5;">
        Личный салон красоты в Telegram — за 3 минуты.
        Клиенты записываются сами, пока вы работаете.
      </div>
    </div>

    <div class="card fade-in-up delay-1" style="margin-top: var(--space-4);">
      <div style="display: flex; flex-direction: column; gap: 14px;">

        <div style="display: flex; align-items: flex-start; gap: 12px;">
          <div style="font-size: 24px; flex-shrink: 0;">😤</div>
          <div>
            <div style="font-weight: 600; font-size: 14px;">Ресепшен вместо переписок</div>
            <div class="caption" style="margin-top: 2px;">
              Клиент сам выбирает время и записывается — как в настоящем салоне.
              Больше никаких «когда свободно?» в ЛС.
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: flex-start; gap: 12px;">
          <div style="font-size: 24px; flex-shrink: 0;">👻</div>
          <div>
            <div style="font-weight: 600; font-size: 14px;">Администратор напомнит о визите</div>
            <div class="caption" style="margin-top: 2px;">
              Бот-администратор напоминает клиенту о записи за день.
              Клиенты стали приходить намного чаще.
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: flex-start; gap: 12px;">
          <div style="font-size: 24px; flex-shrink: 0;">📲</div>
          <div>
            <div style="font-weight: 600; font-size: 14px;">Салон по адресу t.me/ваш_бот</div>
            <div class="caption" style="margin-top: 2px;">
              Не нужен сайт и Instagram.
              Клиент заходит в ваш салон там, где уже сидит — в Telegram.
            </div>
          </div>
        </div>

      </div>
    </div>

    <button class="btn btn-primary btn-full fade-in-up delay-2" id="btn-pitch-next"
            style="margin-top: var(--space-5);">
      Открыть салон →
    </button>

    <div class="caption text-center fade-in-up delay-3" style="margin-top: 10px; opacity: 0.6;">
      Бесплатно · Без комиссий · Открытие за 3 минуты
    </div>
  `;
}

function setupStep0(el) {
  hideMainButton();
  el.querySelector('#btn-pitch-next')?.addEventListener('click', () => {
    hapticSelection();
    goToStep1(el);
  });
}

// ============================================================
// Шаг 1: Профиль
// ============================================================

function renderStep1() {
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const defaultName = [tgUser?.first_name, tgUser?.last_name].filter(Boolean).join(' ') || '';

  const specChips = specialties.map(s => `
    <button class="chip" data-spec="${s.id}">${s.emoji} ${s.label}</button>
  `).join('');

  return `
    <div class="fade-in-up">
      <div class="page-title">Повесьте вывеску</div>
      <div class="caption" style="margin-top: 4px;">Имя и специализация — первое, что увидят клиенты в вашем салоне</div>
    </div>

    <div class="input-group fade-in-up delay-1" style="margin-top: var(--space-4);">
      <label class="input-label" for="onboard-name">Как тебя зовут?</label>
      <input type="text" class="input" id="onboard-name" autocomplete="name"
             value="${defaultName}" placeholder="Например: Анна">
      <div id="name-error" class="caption" style="color: red; display: none; margin-top: 4px;">
        Напиши своё имя — клиенты должны знать, к кому записываются
      </div>
    </div>

    <div class="input-group fade-in-up delay-2">
      <label class="input-label">
        Чем занимаешься?
        <span style="opacity: 0.5; font-weight: 400;">(выбери одно или несколько)</span>
      </label>
      <div class="chips" id="spec-chips">
        ${specChips}
        <button class="chip" id="chip-other" data-spec="other">✏️ Другое</button>
      </div>
      <div id="other-spec-wrap" style="display: none; margin-top: 10px;">
        <input type="text" class="input" id="other-spec-input" autocomplete="off"
               placeholder="Например: перманентный макияж, депиляция...">
        <div class="caption" style="margin-top: 6px; opacity: 0.6;">
          Напиши свою специализацию — именно так увидят клиенты
        </div>
      </div>
    </div>

    <div class="caption text-center fade-in-up delay-3" style="margin-top: 16px; opacity: 0.5;">
      Шаг 1 из 3
    </div>

    <button class="btn btn-primary btn-full mt fade-in-up delay-3" id="btn-step1-next">Далее</button>
  `;
}

function goToStep1(el) {
  currentStep = 1;
  el.innerHTML = renderStep1();
  setupStep1(el);
}

function setupStep1(el) {
  // Обычные чипы специализаций
  el.querySelectorAll('#spec-chips .chip:not(#chip-other)').forEach(chip => {
    chip.addEventListener('click', () => {
      hapticSelection();
      chip.classList.toggle('active');
      const specId = chip.dataset.spec;
      if (chip.classList.contains('active')) {
        if (!selectedSpecialties.includes(specId)) selectedSpecialties.push(specId);
      } else {
        selectedSpecialties = selectedSpecialties.filter(s => s !== specId);
      }
    });
  });

  // Чип «Другое» — показывает поле ввода
  const chipOther = el.querySelector('#chip-other');
  const otherWrap = el.querySelector('#other-spec-wrap');
  chipOther?.addEventListener('click', () => {
    hapticSelection();
    const isActive = chipOther.classList.toggle('active');
    otherWrap.style.display = isActive ? 'block' : 'none';
    if (isActive) {
      el.querySelector('#other-spec-input')?.focus();
    } else {
      // Убираем кастомную специализацию если скрыли поле
      selectedSpecialties = selectedSpecialties.filter(s => !s.startsWith('custom:'));
    }
  });

  hideMainButton();

  const next = () => {
    const nameInput = el.querySelector('#onboard-name');
    const name = nameInput.value.trim();

    if (!name) {
      el.querySelector('#name-error').style.display = 'block';
      nameInput.style.borderColor = 'red';
      nameInput.focus();
      return;
    }

    el.querySelector('#name-error').style.display = 'none';
    nameInput.style.borderColor = '';

    // Если выбрано «Другое» — добавляем кастомную специализацию из поля ввода
    const chipOther = el.querySelector('#chip-other');
    if (chipOther?.classList.contains('active')) {
      const customVal = el.querySelector('#other-spec-input')?.value.trim();
      if (customVal) {
        if (!selectedSpecialties.includes(`custom:${customVal}`)) {
          selectedSpecialties.push(`custom:${customVal}`);
        }
      }
    }

    if (selectedSpecialties.length === 0) selectedSpecialties = ['nails'];

    onboardingData.name = name;
    onboardingData.specialty = [...selectedSpecialties];
    goToStep2(el);
  };

  el.querySelector('#btn-step1-next')?.addEventListener('click', next);
}

// ============================================================
// Шаг 2: Выбор услуг
// ============================================================

function renderStep2() {
  let templates = [];
  selectedSpecialties.forEach(spec => {
    // Пропускаем кастомные специализации (custom:...) — для них нет шаблонов
    if (!spec.startsWith('custom:') && serviceTemplates[spec]) {
      templates = templates.concat(serviceTemplates[spec]);
    }
  });

  const cards = templates.map((t, i) => `
    <button class="service-template" data-index="${i}">
      <div class="service-template-check">✓</div>
      <div class="service-template-body">
        <div class="service-template-title">${t.title}</div>
        <div class="service-template-meta">${formatDuration(t.duration)} · ${formatPrice(t.price)}</div>
      </div>
    </button>
  `).join('');

  return `
    <div class="fade-in-up">
      <div class="page-title">Оформите витрину</div>
      <div class="caption" style="margin-top: 4px;">
        Выберите услуги для витрины. Остальные добавите потом — это займёт минуту.
      </div>
    </div>

    <div id="templates-list" class="mt fade-in-up delay-1">${cards}</div>

    <div class="caption text-center fade-in-up delay-2" style="margin-top: 16px; opacity: 0.5;">
      Шаг 2 из 3
    </div>

    <button class="btn btn-primary btn-full mt fade-in-up delay-2" id="btn-step2-next">
      Готово — открыть салон
    </button>
  `;
}

function goToStep2(el) {
  currentStep = 2;
  el.innerHTML = renderStep2();
  setupStep2(el);
}

function setupStep2(el) {
  let templates = [];
  selectedSpecialties.forEach(spec => {
    // Пропускаем кастомные специализации (custom:...) — для них нет шаблонов
    if (!spec.startsWith('custom:') && serviceTemplates[spec]) {
      templates = templates.concat(serviceTemplates[spec]);
    }
  });

  selectedServices = [];

  const updateBtn = () => {
    const btn = el.querySelector('#btn-step2-next');
    const count = selectedServices.length;
    btn.textContent = count > 0
      ? `Готово — открыть салон (выбрано: ${count})`
      : 'Готово — открыть салон';
  };

  el.querySelectorAll('.service-template').forEach(item => {
    item.addEventListener('click', () => {
      hapticSelection();
      item.classList.toggle('selected');
      const idx = parseInt(item.dataset.index);
      if (item.classList.contains('selected')) {
        selectedServices.push(templates[idx]);
      } else {
        selectedServices = selectedServices.filter(s => s.title !== templates[idx].title);
      }
      updateBtn();
    });
  });

  hideMainButton();

  el.querySelector('#btn-step2-next')?.addEventListener('click', () => goToFinish(el));
}

// ============================================================
// Финал: Сохранение + Превью + Подключение бота
// ============================================================

async function goToFinish(el) {
  currentStep = 3;
  el.innerHTML = renderSaving();

  try {
    // Сохранить профиль
    await saveMasterProfile({
      name: onboardingData.name,
      specialty: onboardingData.specialty || [],
      experience: null,
      city: null,
    });

    // Сохранить выбранные услуги
    for (const svc of selectedServices) {
      await saveService({ title: svc.title, price: svc.price, duration: svc.duration });
    }

    // Расписание по умолчанию — Пн-Пт, 10:00–19:00 (можно изменить в настройках)
    await saveSchedule({
      work_days: [1, 2, 3, 4, 5],
      start_hour: 10,
      end_hour: 19,
      break_start: 13,
      break_end: 14,
    });

    // Завершить онбординг
    await completeOnboarding();

    hapticSuccess();
    el.innerHTML = renderPreview();
    setupPreview(el);

  } catch (e) {
    console.error('[onboarding] Ошибка при сохранении:', e);
    el.innerHTML = renderSavingError(e.message);
    el.querySelector('#btn-retry')?.addEventListener('click', () => goToFinish(el));
  }
}

function renderSaving() {
  return `
    <div class="text-center fade-in-up" style="padding: 80px 0;">
      <div style="font-size: 48px; margin-bottom: 16px;">⏳</div>
      <div class="page-title">Открываем ваш салон...</div>
      <div class="caption" style="margin-top: 8px;">Секунду!</div>
    </div>
  `;
}

function renderSavingError(msg) {
  return `
    <div class="text-center fade-in-up" style="padding: 40px 0;">
      <div style="font-size: 48px; margin-bottom: 16px;">😕</div>
      <div class="page-title">Что-то пошло не так</div>
      <div class="caption" style="margin-top: 8px; color: red;">${msg || 'Попробуй ещё раз'}</div>
      <button class="btn btn-primary btn-full mt" id="btn-retry">Попробовать снова</button>
    </div>
  `;
}

function renderPreview() {
  const specLabels = (onboardingData.specialty || []).map(id => {
    if (id.startsWith('custom:')) return `✏️ ${id.replace('custom:', '')}`;
    const s = specialties.find(x => x.id === id);
    return s ? `${s.emoji} ${s.label}` : '';
  }).filter(Boolean).join(', ') || '';

  const count = selectedServices.length;
  const serviceText = count > 0
    ? `${count} ${count === 1 ? 'услуга' : count < 5 ? 'услуги' : 'услуг'}`
    : 'услуги добавлены';

  return `
    <div class="text-center fade-in-up">
      <div style="font-size: 48px; margin-bottom: 8px;">🎉</div>
      <div class="page-title">Салон открыт!</div>
      <div class="caption" style="margin-top: 4px;">Вот как выглядит ваш салон для клиентов:</div>
    </div>

    <!-- Превью карточки мастера -->
    <div class="card fade-in-up delay-1" style="margin-top: var(--space-4); border: 2px solid var(--color-primary);">
      <div class="card-row">
        <div style="
          width: 48px; height: 48px; border-radius: 50%;
          background: linear-gradient(135deg, var(--color-primary), var(--color-accent, #c45e72));
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; flex-shrink: 0;
        ">💅</div>
        <div class="card-body">
          <div class="card-title">${onboardingData.name || 'Мастер'}</div>
          <div class="card-subtitle">${specLabels}</div>
        </div>
      </div>
      <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--tg-theme-hint-color, #e0e0e0);">
        <div class="caption">📋 ${serviceText} · ⏰ Пн–Пт, 10:00–19:00</div>
      </div>
    </div>

    <!-- Что даёт бот -->
    <div class="card fade-in-up delay-2" style="margin-top: var(--space-3);">
      <div style="font-weight: 600; font-size: 14px; margin-bottom: 8px;">Подключите администратора — и салон заработает на полную:</div>
      <div style="display: flex; flex-direction: column; gap: 6px; font-size: 14px; line-height: 1.4;">
        <div>🔔 Администратор напомнит клиенту о визите</div>
        <div>📣 Рассылка акций всем клиентам салона</div>
        <div>🔗 Личная ссылка-адрес вашего салона</div>
      </div>
    </div>

    <!-- Блок подключения бота -->
    <div class="card fade-in-up delay-3" style="margin-top: var(--space-3);">
      <div style="font-size: 28px; text-align: center; margin-bottom: 8px;">🤖</div>
      <div style="font-weight: 600; font-size: 15px; text-align: center; margin-bottom: 6px;">
        Подключите администратора
      </div>
      <div class="caption text-center" style="margin-bottom: 14px; line-height: 1.5;">
        Создайте бота через @BotFather — это вывеска и администратор вашего салона.
      </div>

      <div class="input-group" style="margin-bottom: 8px;">
        <label class="input-label" for="bot-token">Токен бота <span style="opacity:0.5; font-weight:400;">(как получить — инструкция ниже)</span></label>
        <input type="text" class="input" id="bot-token" autocomplete="off"
               placeholder="1234567890:AAF...">
      </div>

      <div id="bot-connect-error" class="caption" style="color: red; display: none; margin-bottom: 8px;"></div>

      <button class="btn btn-primary btn-full" id="btn-connect-bot">Подключить бота</button>

      <details style="margin-top: 14px;">
        <summary class="caption" style="cursor: pointer; color: var(--color-primary); user-select: none;">
          Как создать бота? (открыть инструкцию)
        </summary>
        <ol style="margin: 10px 0 0; padding-left: 20px; line-height: 2; font-size: 13px; color: var(--tg-theme-text-color);">
          <li>Открой <a href="https://t.me/BotFather" target="_blank" style="color: var(--color-primary);">@BotFather</a> в Telegram</li>
          <li>Нажми «Старт» или отправь <code>/newbot</code></li>
          <li>BotFather спросит имя бота — напиши любое (например: «Маникюр Анны»)</li>
          <li>Потом спросит username — он должен заканчиваться на <code>_bot</code> (например: <code>anna_nail_bot</code>)</li>
          <li>BotFather пришлёт токен — скопируй его и вставь в поле выше</li>
        </ol>
      </details>
    </div>

    <button class="btn btn-outline btn-full fade-in-up delay-3" id="btn-skip-bot"
            style="margin-top: var(--space-3);">
      Подключу позже — войти в салон
    </button>

    <div class="caption text-center fade-in-up delay-4" style="margin-top: 10px; opacity: 0.6;">
      Администратора можно подключить позже в настройках салона
    </div>
  `;
}

function setupPreview(el) {
  hideMainButton();

  // Пропустить подключение бота
  el.querySelector('#btn-skip-bot')?.addEventListener('click', () => {
    hapticSelection();
    navigateToRoot('dashboard');
  });

  // Подключить бота
  const connectBot = async () => {
    const token = el.querySelector('#bot-token').value.trim();
    const errEl = el.querySelector('#bot-connect-error');
    errEl.style.display = 'none';

    if (!token || !token.includes(':')) {
      errEl.textContent = 'Вставь токен в поле выше. Он выглядит примерно так: 1234567890:AAF...';
      errEl.style.display = 'block';
      return;
    }

    const btn = el.querySelector('#btn-connect-bot');
    btn.disabled = true;
    btn.textContent = 'Подключаем...';

    try {
      await callEdgeFunction('bots-connect', { bot_token: token });
      hapticSuccess();
      navigateToRoot('dashboard');
    } catch (e) {
      console.error('[onboarding] Ошибка подключения бота:', e);
      errEl.textContent = e.message || 'Не получилось подключить. Проверь токен и попробуй снова.';
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Подключить бота';
    }
  };

  el.querySelector('#btn-connect-bot')?.addEventListener('click', connectBot);
}
