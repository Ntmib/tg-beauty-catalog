/**
 * Экран М0.1: Онбординг мастера (3 шага)
 *
 * Шаг 1: Профиль (имя, фото, специализация)
 * Шаг 2: Выбор услуг из шаблона
 * Шаг 3: Расписание
 */

import { specialties, serviceTemplates, formatPrice, formatDuration } from '../data.js';
import { navigateToRoot } from '../router.js';
import { showMainButton, hapticSelection, hapticSuccess } from '../telegram.js';

let currentStep = 1;
let selectedSpecialties = [];
let selectedServices = [];

export const onboardingScreen = {
  render() {
    currentStep = 1;
    selectedSpecialties = [];
    selectedServices = [];
    return renderStep1();
  },

  onEnter(el) {
    setupStep1(el);
  },
};

// --- Шаг 1: Профиль ---
function renderStep1() {
  const specChips = specialties.map(s => `
    <div class="chip" data-spec="${s.id}">${s.emoji} ${s.label}</div>
  `).join('');

  return `
    <div style="text-align: center;" class="fade-in-up">
      <div class="page-title">Создайте свой каталог</div>
      <div class="caption">за 2 минуты</div>
    </div>

    <!-- Аватарка -->
    <div style="text-align: center; margin: 20px 0;" class="fade-in-up delay-1">
      <div class="avatar avatar-lg" style="margin: 0 auto; cursor: pointer;" id="avatar-upload">
        АИ
      </div>
      <div class="caption mt-sm">Тап, чтобы изменить</div>
    </div>

    <!-- Имя -->
    <div class="input-group fade-in-up delay-2">
      <label class="input-label">Имя</label>
      <input type="text" class="input" id="onboard-name" value="Анна Иванова" placeholder="Ваше имя">
    </div>

    <!-- Специализация -->
    <div class="input-group fade-in-up delay-3">
      <label class="input-label">Специализация (выберите одну или несколько)</label>
      <div class="chips" id="spec-chips">
        ${specChips}
      </div>
    </div>

    <!-- Опыт -->
    <div class="input-group fade-in-up delay-4">
      <label class="input-label">Опыт работы (необязательно)</label>
      <input type="text" class="input" id="onboard-experience" placeholder="Например: 5 лет">
    </div>

    <!-- Прогресс -->
    <div class="progress-dots fade-in-up delay-5">
      <div class="progress-dot active"></div>
      <div class="progress-dot"></div>
      <div class="progress-dot"></div>
    </div>

    <!-- Кнопка для браузера -->
    <button class="btn btn-primary mt" id="btn-step1-next">Далее</button>
  `;
}

function setupStep1(el) {
  // Выбор специализации
  el.querySelectorAll('#spec-chips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      hapticSelection();
      chip.classList.toggle('active');
      const specId = chip.dataset.spec;
      if (chip.classList.contains('active')) {
        selectedSpecialties.push(specId);
      } else {
        selectedSpecialties = selectedSpecialties.filter(s => s !== specId);
      }
    });
  });

  const goToStep2 = () => {
    if (selectedSpecialties.length === 0) {
      selectedSpecialties = ['nails']; // дефолт
    }
    currentStep = 2;
    const container = el;
    container.innerHTML = renderStep2();
    setupStep2(container);
  };

  // MainButton
  showMainButton('Далее', goToStep2);

  // Кнопка HTML
  el.querySelector('#btn-step1-next')?.addEventListener('click', goToStep2);
}

// --- Шаг 2: Услуги ---
function renderStep2() {
  // Собираем шаблоны из выбранных специализаций
  let templates = [];
  selectedSpecialties.forEach(spec => {
    if (serviceTemplates[spec]) {
      templates = templates.concat(serviceTemplates[spec]);
    }
  });

  const templateCards = templates.map((t, i) => `
    <div class="service-template" data-index="${i}">
      <div class="service-template-check">✓</div>
      <div class="service-template-body">
        <div class="service-template-title">${t.title}</div>
        <div class="service-template-meta">${formatDuration(t.duration)} · ${formatPrice(t.price)}</div>
      </div>
    </div>
  `).join('');

  return `
    <div class="fade-in-up">
      <div class="page-title">Добавьте первую услугу</div>
      <div class="caption">Остальные — потом. Выберите из шаблона:</div>
    </div>

    <div id="templates-list" class="mt fade-in-up delay-1">
      ${templateCards}
    </div>

    <div class="progress-dots fade-in-up delay-2" style="margin-top: 16px;">
      <div class="progress-dot"></div>
      <div class="progress-dot active"></div>
      <div class="progress-dot"></div>
    </div>

    <button class="btn btn-primary mt" id="btn-step2-next">Далее</button>
  `;
}

function setupStep2(el) {
  // Собираем шаблоны
  let templates = [];
  selectedSpecialties.forEach(spec => {
    if (serviceTemplates[spec]) {
      templates = templates.concat(serviceTemplates[spec]);
    }
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

      // Обновить текст кнопки
      const count = selectedServices.length;
      const text = count > 0 ? `Далее (выбрано: ${count})` : 'Далее';
      showMainButton(text, goToStep3);
    });
  });

  const goToStep3 = () => {
    currentStep = 3;
    el.innerHTML = renderStep3();
    setupStep3(el);
  };

  showMainButton('Далее', goToStep3);
  el.querySelector('#btn-step2-next')?.addEventListener('click', goToStep3);
}

// --- Шаг 3: Расписание ---
function renderStep3() {
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const dayToggles = days.map((d, i) => `
    <div class="day-toggle ${i < 5 ? 'active' : ''}" data-day="${i + 1}">${d}</div>
  `).join('');

  const hourOptions = Array.from({ length: 15 }, (_, i) => i + 7)
    .map(h => `<option value="${h}" ${h === 10 ? 'selected' : ''}>${String(h).padStart(2, '0')}:00</option>`)
    .join('');

  const endHourOptions = Array.from({ length: 15 }, (_, i) => i + 7)
    .map(h => `<option value="${h}" ${h === 19 ? 'selected' : ''}>${String(h).padStart(2, '0')}:00</option>`)
    .join('');

  const breakStartOptions = Array.from({ length: 15 }, (_, i) => i + 7)
    .map(h => `<option value="${h}" ${h === 13 ? 'selected' : ''}>${String(h).padStart(2, '0')}:00</option>`)
    .join('');

  const breakEndOptions = Array.from({ length: 15 }, (_, i) => i + 7)
    .map(h => `<option value="${h}" ${h === 14 ? 'selected' : ''}>${String(h).padStart(2, '0')}:00</option>`)
    .join('');

  return `
    <div class="fade-in-up">
      <div class="page-title">Когда вы работаете?</div>
    </div>

    <div class="section-title fade-in-up delay-1">Рабочие дни</div>
    <div class="day-toggles fade-in-up delay-1" id="day-toggles">
      ${dayToggles}
    </div>

    <div class="section-title fade-in-up delay-2">Часы работы</div>
    <div style="display: flex; gap: 12px; align-items: center;" class="fade-in-up delay-2">
      <div style="flex: 1;">
        <label class="input-label">Начало</label>
        <select class="input" id="start-hour">${hourOptions}</select>
      </div>
      <div style="flex: 1;">
        <label class="input-label">Конец</label>
        <select class="input" id="end-hour">${endHourOptions}</select>
      </div>
    </div>

    <div class="section-title fade-in-up delay-3">Перерыв (необязательно)</div>
    <div style="display: flex; gap: 12px; align-items: center;" class="fade-in-up delay-3">
      <div style="flex: 1;">
        <label class="input-label">С</label>
        <select class="input" id="break-start">${breakStartOptions}</select>
      </div>
      <div style="flex: 1;">
        <label class="input-label">До</label>
        <select class="input" id="break-end">${breakEndOptions}</select>
      </div>
    </div>

    <div class="progress-dots fade-in-up delay-4" style="margin-top: 16px;">
      <div class="progress-dot"></div>
      <div class="progress-dot"></div>
      <div class="progress-dot active"></div>
    </div>

    <button class="btn btn-primary mt" id="btn-finish">Готово! Создать каталог</button>
  `;
}

function setupStep3(el) {
  // Тогглы дней
  el.querySelectorAll('.day-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      hapticSelection();
      toggle.classList.toggle('active');
    });
  });

  const finish = () => {
    hapticSuccess();
    // В продакшене — сохранение в Supabase
    navigateToRoot('dashboard');
  };

  showMainButton('Готово! Создать каталог', finish);
  el.querySelector('#btn-finish')?.addEventListener('click', finish);
}
