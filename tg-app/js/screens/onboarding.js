/**
 * Экран М0: Онбординг мастера (4 шага)
 *
 * Шаг 0: Подключение бота (NEW — вызывает bots-connect Edge Function)
 * Шаг 1: Профиль (имя, специализация)
 * Шаг 2: Услуги из шаблона
 * Шаг 3: Расписание
 * Завершение: completeOnboarding() → dashboard
 */

import { specialties, serviceTemplates, formatPrice, formatDuration } from '../data.js';
import { navigateToRoot } from '../router.js';
import { showMainButton, hapticSelection, hapticSuccess } from '../telegram.js';
import { saveMasterProfile, saveService, saveSchedule, completeOnboarding } from '../api.js';
import { callEdgeFunction, getMasterId } from '../auth.js';

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
// Шаг 0: Подключение бота
// ============================================================

function renderStep0() {
  return `
    <div class="text-center fade-in-up">
      <div style="font-size: 48px; margin-bottom: 8px;">🤖</div>
      <div class="page-title">Подключите своего бота</div>
      <div class="caption">Бот нужен для получения записей от клиентов</div>
    </div>

    <div class="card fade-in-up delay-1" style="margin-top: var(--space-5);">
      <div class="card-title">Инструкция:</div>
      <ol style="margin: 12px 0 0; padding-left: 20px; line-height: 1.8; font-size: 14px; color: var(--tg-theme-text-color);">
        <li>Откройте <a href="https://t.me/BotFather" target="_blank" style="color:var(--color-primary)">@BotFather</a> в Telegram</li>
        <li>Отправьте команду <code>/newbot</code></li>
        <li>Введите имя и username бота</li>
        <li>Скопируйте токен и вставьте ниже</li>
      </ol>
    </div>

    <div class="input-group fade-in-up delay-2" style="margin-top: var(--space-5);">
      <label class="input-label" for="bot-token">Токен бота</label>
      <input type="text" class="input" id="bot-token" autocomplete="off"
             placeholder="1234567890:AAF...">
    </div>

    <div id="bot-connect-error" class="caption" style="color:red;display:none;margin-bottom:8px;"></div>

    <button class="btn btn-primary btn-full fade-in-up delay-3" id="btn-connect-bot">
      Подключить бота
    </button>

    <div class="progress-dots fade-in-up delay-4" style="margin-top: var(--space-5);">
      <div class="progress-dot active"></div>
      <div class="progress-dot"></div>
      <div class="progress-dot"></div>
      <div class="progress-dot"></div>
    </div>
  `;
}

function setupStep0(el) {
  const connectBot = async () => {
    const token = el.querySelector('#bot-token').value.trim();
    const errEl = el.querySelector('#bot-connect-error');
    errEl.style.display = 'none';

    if (!token || !token.includes(':')) {
      errEl.textContent = 'Введите корректный токен (формат: 123456:ABC...)';
      errEl.style.display = 'block';
      return;
    }

    const btn = el.querySelector('#btn-connect-bot');
    btn.disabled = true;
    btn.textContent = 'Подключаем бота...';

    try {
      const result = await callEdgeFunction('bots-connect', { bot_token: token });
      onboardingData.botUsername = result.bot_username;
      goToStep1(el);
    } catch (e) {
      console.error('[onboarding] Ошибка подключения бота:', e);
      errEl.textContent = e.message || 'Не удалось подключить бота. Проверьте токен.';
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Подключить бота';
    }
  };

  showMainButton('Подключить', connectBot);
  el.querySelector('#btn-connect-bot')?.addEventListener('click', connectBot);
}

// ============================================================
// Шаг 1: Профиль
// ============================================================

function renderStep1(el) {
  const specChips = specialties.map(s => `
    <button class="chip" data-spec="${s.id}">${s.emoji} ${s.label}</button>
  `).join('');

  el.innerHTML = `
    <div class="text-center fade-in-up">
      <div class="page-title">Ваш профиль</div>
    </div>

    <div class="input-group fade-in-up delay-1">
      <label class="input-label" for="onboard-name">Имя</label>
      <input type="text" class="input" id="onboard-name" name="name" autocomplete="name"
             value="${onboardingData.name || ''}" placeholder="Ваше имя">
    </div>

    <div class="input-group fade-in-up delay-2">
      <label class="input-label">Специализация (выберите одну или несколько)</label>
      <div class="chips" id="spec-chips">${specChips}</div>
    </div>

    <div class="input-group fade-in-up delay-3">
      <label class="input-label" for="onboard-experience">Опыт работы</label>
      <input type="text" class="input" id="onboard-experience" autocomplete="off"
             value="${onboardingData.experience || ''}" placeholder="5 лет">
    </div>

    <div class="input-group fade-in-up delay-4">
      <label class="input-label" for="onboard-city">Город / Адрес</label>
      <input type="text" class="input" id="onboard-city" autocomplete="street-address"
             value="${onboardingData.city || ''}" placeholder="Москва">
    </div>

    <div class="progress-dots fade-in-up delay-5">
      <div class="progress-dot"></div>
      <div class="progress-dot active"></div>
      <div class="progress-dot"></div>
      <div class="progress-dot"></div>
    </div>

    <button class="btn btn-primary mt" id="btn-step1-next">Далее</button>
  `;
}

function goToStep1(el) {
  currentStep = 1;
  renderStep1(el);
  setupStep1(el);
}

function setupStep1(el) {
  el.querySelectorAll('#spec-chips .chip').forEach(chip => {
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

  const goToStep2 = () => {
    if (selectedSpecialties.length === 0) selectedSpecialties = ['nails'];
    onboardingData.name = el.querySelector('#onboard-name').value.trim();
    onboardingData.experience = el.querySelector('#onboard-experience').value.trim();
    onboardingData.city = el.querySelector('#onboard-city').value.trim();
    onboardingData.specialty = [...selectedSpecialties];
    currentStep = 2;
    renderStep2(el);
    setupStep2(el);
  };

  showMainButton('Далее', goToStep2);
  el.querySelector('#btn-step1-next')?.addEventListener('click', goToStep2);
}

// ============================================================
// Шаг 2: Услуги из шаблона
// ============================================================

function renderStep2(el) {
  let templates = [];
  selectedSpecialties.forEach(spec => {
    if (serviceTemplates[spec]) templates = templates.concat(serviceTemplates[spec]);
  });

  const templateCards = templates.map((t, i) => `
    <button class="service-template" data-index="${i}">
      <div class="service-template-check">✓</div>
      <div class="service-template-body">
        <div class="service-template-title">${t.title}</div>
        <div class="service-template-meta">${formatDuration(t.duration)} · ${formatPrice(t.price)}</div>
      </div>
    </button>
  `).join('');

  el.innerHTML = `
    <div class="fade-in-up">
      <div class="page-title">Добавьте первую услугу</div>
      <div class="caption">Выберите из шаблона (остальные добавите позже):</div>
    </div>
    <div id="templates-list" class="mt fade-in-up delay-1">${templateCards}</div>
    <div class="progress-dots fade-in-up delay-2" style="margin-top: 16px;">
      <div class="progress-dot"></div>
      <div class="progress-dot"></div>
      <div class="progress-dot active"></div>
      <div class="progress-dot"></div>
    </div>
    <button class="btn btn-primary mt" id="btn-step2-next">Далее</button>
  `;
}

function setupStep2(el) {
  let templates = [];
  selectedSpecialties.forEach(spec => {
    if (serviceTemplates[spec]) templates = templates.concat(serviceTemplates[spec]);
  });

  selectedServices = [];

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
      const count = selectedServices.length;
      showMainButton(count > 0 ? `Далее (выбрано: ${count})` : 'Далее', goToStep3);
    });
  });

  const goToStep3 = () => {
    currentStep = 3;
    renderStep3(el);
    setupStep3(el);
  };

  showMainButton('Далее', goToStep3);
  el.querySelector('#btn-step2-next')?.addEventListener('click', goToStep3);
}

// ============================================================
// Шаг 3: Расписание
// ============================================================

function renderStep3(el) {
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const dayToggles = days.map((d, i) => `
    <button class="day-toggle ${i < 5 ? 'active' : ''}" data-day="${i + 1}">${d}</button>
  `).join('');

  const hourOptions = (vals, selected) => vals
    .map(h => `<option value="${h}" ${h === selected ? 'selected' : ''}>${String(h).padStart(2, '0')}:00</option>`)
    .join('');
  const hours = Array.from({ length: 15 }, (_, i) => i + 7);

  el.innerHTML = `
    <div class="fade-in-up">
      <div class="page-title">Когда вы работаете?</div>
    </div>

    <div class="section-title fade-in-up delay-1">Рабочие дни</div>
    <div class="day-toggles fade-in-up delay-1" id="day-toggles">${dayToggles}</div>

    <div class="section-title fade-in-up delay-2">Часы работы</div>
    <div class="flex-between gap-3 fade-in-up delay-2">
      <div class="flex-1">
        <label class="input-label" for="start-hour">Начало</label>
        <select class="input" id="start-hour">${hourOptions(hours, 10)}</select>
      </div>
      <div class="flex-1">
        <label class="input-label" for="end-hour">Конец</label>
        <select class="input" id="end-hour">${hourOptions(hours, 19)}</select>
      </div>
    </div>

    <div class="section-title fade-in-up delay-3">Перерыв (необязательно)</div>
    <div class="flex-between gap-3 fade-in-up delay-3">
      <div class="flex-1">
        <label class="input-label" for="break-start">С</label>
        <select class="input" id="break-start">${hourOptions(hours, 13)}</select>
      </div>
      <div class="flex-1">
        <label class="input-label" for="break-end">До</label>
        <select class="input" id="break-end">${hourOptions(hours, 14)}</select>
      </div>
    </div>

    <div class="progress-dots fade-in-up delay-4 mt">
      <div class="progress-dot"></div>
      <div class="progress-dot"></div>
      <div class="progress-dot"></div>
      <div class="progress-dot active"></div>
    </div>

    <div id="finish-error" class="caption" style="color:red;display:none;margin-top:8px;"></div>
    <button class="btn btn-primary mt" id="btn-finish">Готово! Создать каталог</button>
  `;
}

function setupStep3(el) {
  el.querySelectorAll('.day-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      hapticSelection();
      toggle.classList.toggle('active');
    });
  });

  const finish = async () => {
    const work_days = Array.from(el.querySelectorAll('.day-toggle.active'))
      .map(t => parseInt(t.dataset.day));
    if (work_days.length === 0) {
      el.querySelector('#finish-error').textContent = 'Выберите хотя бы один рабочий день';
      el.querySelector('#finish-error').style.display = 'block';
      return;
    }

    const btn = el.querySelector('#btn-finish');
    btn.disabled = true;
    btn.textContent = 'Создаём каталог...';
    el.querySelector('#finish-error').style.display = 'none';

    try {
      // Сохранить профиль
      if (onboardingData.name) {
        await saveMasterProfile({
          name: onboardingData.name,
          specialty: onboardingData.specialty || [],
          experience: onboardingData.experience || null,
          city: onboardingData.city || null,
        });
      }

      // Сохранить выбранные услуги
      for (const svc of selectedServices) {
        await saveService({ title: svc.title, price: svc.price, duration: svc.duration });
      }

      // Сохранить расписание
      await saveSchedule({
        work_days,
        start_hour: parseInt(el.querySelector('#start-hour').value),
        end_hour: parseInt(el.querySelector('#end-hour').value),
        break_start: parseInt(el.querySelector('#break-start').value),
        break_end: parseInt(el.querySelector('#break-end').value),
      });

      // Завершить онбординг
      await completeOnboarding();

      hapticSuccess();
      navigateToRoot('dashboard');
    } catch (e) {
      console.error('[onboarding] Ошибка завершения:', e);
      // Показываем полный текст ошибки для диагностики
      const errText = (e.message || JSON.stringify(e) || 'Неизвестная ошибка') + ' | code:' + (e.code || '-');
      el.querySelector('#finish-error').textContent = errText;
      el.querySelector('#finish-error').style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Готово! Создать каталог';
    }
  };

  showMainButton('Создать каталог', finish);
  el.querySelector('#btn-finish')?.addEventListener('click', finish);
}
