/**
 * Экран М6: Профиль мастера (редактирование)
 *
 * Загружает профиль из Supabase, сохраняет изменения.
 */

import { specialties } from '../data.js';
import { goBack } from '../router.js';
import { showMainButton, hapticSelection, hapticSuccess } from '../telegram.js';
import { getMasterProfile, saveMasterProfile, clearCache } from '../api.js';

export const masterProfileScreen = {
  render() {
    return `
      <div id="profile-form-content">
        <div class="caption text-center" style="padding: 40px 0;">Загрузка профиля...</div>
      </div>
    `;
  },

  async onEnter(el) {
    const profile = await getMasterProfile(true).catch(() => null);
    const masterData = profile?.masters || {};

    const name = profile?.name || `${masterData.first_name || ''} ${masterData.last_name || ''}`.trim() || '';
    const initials = name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??';
    const currentSpecs = profile?.specialty || [];

    const specChips = specialties.map(s => {
      const isActive = currentSpecs.includes(s.id);
      return `<button class="chip ${isActive ? 'active' : ''}" data-spec="${s.id}">${s.emoji} ${s.label}</button>`;
    }).join('');

    el.querySelector('#profile-form-content').innerHTML = `
      <div class="avatar-section fade-in-up">
        <div class="avatar avatar-lg">${initials}</div>
      </div>

      <div class="input-group fade-in-up delay-1">
        <label class="input-label" for="profile-name">Имя</label>
        <input type="text" class="input" id="profile-name" name="name" autocomplete="name" value="${name}">
      </div>

      <div class="input-group fade-in-up delay-2">
        <label class="input-label">Специализация</label>
        <div class="chips" id="profile-specs">${specChips}</div>
      </div>

      <div class="input-group fade-in-up delay-3">
        <label class="input-label" for="profile-city">Город / Адрес</label>
        <input type="text" class="input" id="profile-city" name="city" autocomplete="street-address"
               value="${profile?.city || ''}" placeholder="Москва, ул. Тверская 15">
      </div>

      <div class="input-group fade-in-up delay-4">
        <label class="input-label" for="profile-experience">Опыт работы</label>
        <input type="text" class="input" id="profile-experience" name="experience" autocomplete="off"
               value="${profile?.experience || ''}" placeholder="5 лет">
      </div>

      <div class="input-group fade-in-up delay-5">
        <label class="input-label" for="profile-bio">О себе (необязательно)</label>
        <textarea class="input" id="profile-bio" name="bio" autocomplete="off" rows="3"
                  placeholder="Расскажите о своём подходе к работе">${profile?.bio || ''}</textarea>
      </div>

      <button class="btn btn-primary btn-full mt fade-in-up delay-6" id="btn-save-profile">
        Сохранить
      </button>
      <div id="profile-error" class="caption text-center" style="color:var(--color-error,red);display:none;margin-top:8px;"></div>
    `;

    // Выбор специализации
    el.querySelectorAll('#profile-specs .chip').forEach(chip => {
      chip.addEventListener('click', () => {
        hapticSelection();
        chip.classList.toggle('active');
      });
    });

    const save = async () => {
      const name = el.querySelector('#profile-name').value.trim();
      if (!name) {
        el.querySelector('#profile-error').textContent = 'Введите имя';
        el.querySelector('#profile-error').style.display = 'block';
        return;
      }

      el.querySelector('#profile-error').style.display = 'none';
      const saveBtn = el.querySelector('#btn-save-profile');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Сохранение...';

      const specialty = Array.from(el.querySelectorAll('#profile-specs .chip.active')).map(c => c.dataset.spec);

      try {
        await saveMasterProfile({
          name,
          specialty,
          city: el.querySelector('#profile-city').value.trim() || null,
          experience: el.querySelector('#profile-experience').value.trim() || null,
          bio: el.querySelector('#profile-bio').value.trim() || null,
        });
        clearCache();
        hapticSuccess();
        goBack();
      } catch (e) {
        console.error('[master-profile] Ошибка:', e);
        el.querySelector('#profile-error').textContent = e.message || 'Ошибка сохранения';
        el.querySelector('#profile-error').style.display = 'block';
        saveBtn.disabled = false;
        saveBtn.textContent = 'Сохранить';
      }
    };

    showMainButton('Сохранить', save);
    el.querySelector('#btn-save-profile')?.addEventListener('click', save);
  },
};
