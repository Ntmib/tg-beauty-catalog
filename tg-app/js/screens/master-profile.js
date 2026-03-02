/**
 * Экран М6: Профиль мастера (редактирование)
 *
 * Имя, специализация, адрес, телефон, Telegram, опыт.
 */

import { master, specialties } from '../data.js';
import { goBack } from '../router.js';
import { showMainButton, hapticSelection, hapticSuccess } from '../telegram.js';

export const masterProfileScreen = {
  render() {
    const specChips = specialties.map(s => {
      const isActive = master.specialty.includes(s.id);
      return `<button class="chip ${isActive ? 'active' : ''}" data-spec="${s.id}">${s.emoji} ${s.label}</button>`;
    }).join('');

    return `
      <!-- Аватарка -->
      <div class="avatar-section fade-in-up">
        <div class="avatar avatar-lg" id="avatar-edit">
          ${master.initials}
        </div>
        <div class="caption mt-sm">Тап, чтобы изменить</div>
      </div>

      <div class="input-group fade-in-up delay-1">
        <label class="input-label" for="profile-name">Имя</label>
        <input type="text" class="input" id="profile-name" name="name" autocomplete="name" value="${master.name}">
      </div>

      <div class="input-group fade-in-up delay-2">
        <label class="input-label">Специализация</label>
        <div class="chips" id="profile-specs">
          ${specChips}
        </div>
      </div>

      <div class="input-group fade-in-up delay-3">
        <label class="input-label" for="profile-address">Адрес</label>
        <input type="text" class="input" id="profile-address" name="address" autocomplete="street-address" value="${master.address || ''}"
               placeholder="ул. Тверская, 15">
      </div>

      <div class="input-group fade-in-up delay-4">
        <label class="input-label" for="profile-phone">Телефон</label>
        <input type="tel" class="input" id="profile-phone" name="phone" autocomplete="tel" value="${master.phone || ''}"
               placeholder="+7 999 123-45-67">
      </div>

      <div class="input-group fade-in-up delay-5">
        <label class="input-label" for="profile-telegram">Telegram для связи</label>
        <input type="text" class="input" id="profile-telegram" name="telegram" autocomplete="username" value="${master.telegram_username || ''}"
               placeholder="@username">
      </div>

      <div class="input-group fade-in-up delay-6">
        <label class="input-label" for="profile-experience">Опыт работы</label>
        <input type="text" class="input" id="profile-experience" name="experience" autocomplete="off" value="${master.experience || ''}"
               placeholder="5 лет">
      </div>

      <!-- Кнопка для браузера -->
      <button class="btn btn-primary btn-full mt fade-in-up delay-6" id="btn-save-profile">
        Сохранить
      </button>
    `;
  },

  onEnter(el) {
    // Выбор специализации (мультивыбор)
    el.querySelectorAll('#profile-specs .chip').forEach(chip => {
      chip.addEventListener('click', () => {
        hapticSelection();
        chip.classList.toggle('active');
      });
    });

    const save = () => {
      hapticSuccess();
      // В продакшене — сохранение в Supabase
      goBack();
    };

    showMainButton('Сохранить', save);
    el.querySelector('#btn-save-profile')?.addEventListener('click', save);
  },
};
