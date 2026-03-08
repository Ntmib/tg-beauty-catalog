/**
 * Экран М6: Профиль мастера (редактирование)
 *
 * Загружает профиль из Supabase, сохраняет изменения.
 */

import { specialties } from '../data.js';
import { goBack } from '../router.js';
import { hideMainButton, hapticSelection, hapticSuccess } from '../telegram.js';
import { getMasterProfile, saveMasterProfile, clearCache, getMasterRow } from '../api.js';
import { callEdgeFunction } from '../auth.js';

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

      <!-- Администратор (бот) -->
      <div class="fade-in-up delay-7" style="margin-top: var(--space-6);" id="bot-section"></div>
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

    hideMainButton();
    el.querySelector('#btn-save-profile')?.addEventListener('click', save);

    // --- Секция «Администратор» ---
    const masterRow = await getMasterRow().catch(() => null);
    const botSection = el.querySelector('#bot-section');
    if (!botSection) return;

    const isConnected = masterRow?.is_bot_active && masterRow?.bot_username;

    if (isConnected) {
      botSection.innerHTML = `
        <div class="card">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
            <span style="font-size: 24px;">🤖</span>
            <span style="font-weight: 600;">Администратор подключён</span>
          </div>
          <div class="caption" style="margin-bottom: 12px;">
            Бот <a href="https://t.me/${masterRow.bot_username}" target="_blank" style="color: var(--color-primary);">@${masterRow.bot_username}</a> работает — напоминает клиентам о визитах и принимает записи.
          </div>
          <button class="btn btn-outline btn-full" id="btn-disconnect-bot" style="color: var(--color-error, red); border-color: var(--color-error, red);">
            Отключить бота
          </button>
        </div>
      `;

      el.querySelector('#btn-disconnect-bot')?.addEventListener('click', async () => {
        const btn = el.querySelector('#btn-disconnect-bot');
        btn.disabled = true;
        btn.textContent = 'Отключаем...';
        try {
          await callEdgeFunction('bots-disconnect', {});
          clearCache();
          hapticSuccess();
          // Перерисовать секцию
          botSection.innerHTML = renderBotConnect();
          setupBotConnect(el);
        } catch (e) {
          btn.disabled = false;
          btn.textContent = 'Отключить бота';
        }
      });
    } else {
      botSection.innerHTML = renderBotConnect();
      setupBotConnect(el);
    }
  },
};

function renderBotConnect() {
  return `
    <div class="card">
      <div style="font-size: 28px; text-align: center; margin-bottom: 8px;">🤖</div>
      <div style="font-weight: 600; font-size: 15px; text-align: center; margin-bottom: 6px;">
        Подключите администратора
      </div>
      <div class="caption text-center" style="margin-bottom: 14px; line-height: 1.5;">
        Создайте бота через @BotFather — он будет напоминать клиентам о визитах и принимать записи.
      </div>

      <div class="input-group" style="margin-bottom: 8px;">
        <label class="input-label" for="bot-token-profile">Токен бота</label>
        <input type="text" class="input" id="bot-token-profile" autocomplete="off"
               placeholder="1234567890:AAF...">
      </div>

      <div id="bot-connect-error-profile" class="caption" style="color: red; display: none; margin-bottom: 8px;"></div>

      <button class="btn btn-primary btn-full" id="btn-connect-bot-profile">Подключить</button>

      <details style="margin-top: 14px;">
        <summary class="caption" style="cursor: pointer; color: var(--color-primary); user-select: none;">
          Как создать бота? (инструкция)
        </summary>
        <ol style="margin: 10px 0 0; padding-left: 20px; line-height: 2; font-size: 13px; color: var(--tg-theme-text-color);">
          <li>Открой <a href="https://t.me/BotFather" target="_blank" style="color: var(--color-primary);">@BotFather</a> в Telegram</li>
          <li>Отправь <code>/newbot</code></li>
          <li>Напиши имя бота (например: «Маникюр Анны»)</li>
          <li>Напиши username с <code>_bot</code> на конце (например: <code>anna_nail_bot</code>)</li>
          <li>Скопируй токен и вставь в поле выше</li>
        </ol>
      </details>
    </div>
  `;
}

function setupBotConnect(el) {
  el.querySelector('#btn-connect-bot-profile')?.addEventListener('click', async () => {
    const token = el.querySelector('#bot-token-profile').value.trim();
    const errEl = el.querySelector('#bot-connect-error-profile');
    errEl.style.display = 'none';

    if (!token || !token.includes(':')) {
      errEl.textContent = 'Вставь токен бота. Он выглядит так: 1234567890:AAF...';
      errEl.style.display = 'block';
      return;
    }

    const btn = el.querySelector('#btn-connect-bot-profile');
    btn.disabled = true;
    btn.textContent = 'Подключаем...';

    try {
      await callEdgeFunction('bots-connect', { bot_token: token });
      clearCache();
      hapticSuccess();
      // Перезагрузить экран чтобы показать подключённого бота
      goBack();
    } catch (e) {
      errEl.textContent = e.message || 'Не получилось подключить. Проверь токен.';
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Подключить';
    }
  });
}
