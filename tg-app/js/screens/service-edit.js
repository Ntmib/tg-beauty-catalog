/**
 * Экран М2.1: Редактирование / добавление услуги
 *
 * Форма с сохранением в Supabase.
 */

import { formatDuration, formatPrice } from '../data.js';
import { goBack } from '../router.js';
import { showMainButton, hapticSuccess, hapticWarning, confirm as tgConfirm } from '../telegram.js';
import { getServiceById, saveService, deleteService, clearCache } from '../api.js';

const durationOptions = [30, 60, 90, 120, 150, 180];

export const serviceEditScreen = {
  render(params) {
    return `
      <div id="service-edit-content">
        <div class="caption text-center" style="padding: 40px 0;">Загрузка...</div>
      </div>
    `;
  },

  async onEnter(el, params) {
    const service = params.serviceId ? await getServiceById(params.serviceId).catch(() => null) : null;
    const isNew = !service;

    let selectedDuration = service?.duration || null;

    const durationChips = durationOptions.map(d => `
      <button class="chip ${service && service.duration === d ? 'active' : ''}" data-duration="${d}">
        ${formatDuration(d)}
      </button>
    `).join('');

    el.querySelector('#service-edit-content').innerHTML = `
      <div class="page-title fade-in-up">${isNew ? 'Новая услуга' : 'Редактировать услугу'}</div>

      <div class="input-group fade-in-up delay-1">
        <label class="input-label" for="edit-title">Название</label>
        <input type="text" class="input" id="edit-title" name="title" autocomplete="off"
               value="${service ? service.title : ''}"
               placeholder="Например: Маникюр + покрытие">
      </div>

      <div class="input-group fade-in-up delay-2">
        <label class="input-label" for="edit-price">Цена (₽)</label>
        <input type="number" class="input" id="edit-price" name="price" autocomplete="off"
               value="${service ? service.price : ''}"
               placeholder="2500" inputmode="numeric">
      </div>

      <div class="input-group fade-in-up delay-3">
        <label class="input-label">Длительность</label>
        <div class="chips" id="duration-chips">${durationChips}</div>
      </div>

      <div class="input-group fade-in-up delay-4">
        <label class="input-label" for="edit-desc">Описание (необязательно)</label>
        <textarea class="input" id="edit-desc" name="description" autocomplete="off" rows="3"
                  placeholder="Что входит в услугу">${service ? (service.description || '') : ''}</textarea>
      </div>

      ${!isNew ? `
        <button class="btn btn-destructive btn-full mt fade-in-up delay-5" id="btn-delete-service">
          🗑 Удалить услугу
        </button>
      ` : ''}

      <button class="btn btn-primary btn-full mt fade-in-up delay-5" id="btn-save-service">
        Сохранить
      </button>
      <div id="save-error" class="caption text-center" style="color:var(--color-error,red);display:none;margin-top:8px;"></div>
    `;

    // Выбор длительности
    el.querySelectorAll('#duration-chips .chip').forEach(chip => {
      chip.addEventListener('click', () => {
        el.querySelectorAll('#duration-chips .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        selectedDuration = parseInt(chip.dataset.duration);
      });
    });

    const save = async () => {
      const title = el.querySelector('#edit-title').value.trim();
      const price = parseInt(el.querySelector('#edit-price').value);
      const description = el.querySelector('#edit-desc').value.trim();

      if (!title) {
        el.querySelector('#save-error').textContent = 'Введите название услуги';
        el.querySelector('#save-error').style.display = 'block';
        return;
      }
      if (!price || price <= 0) {
        el.querySelector('#save-error').textContent = 'Введите цену';
        el.querySelector('#save-error').style.display = 'block';
        return;
      }
      if (!selectedDuration) {
        el.querySelector('#save-error').textContent = 'Выберите длительность';
        el.querySelector('#save-error').style.display = 'block';
        return;
      }

      el.querySelector('#save-error').style.display = 'none';
      const saveBtn = el.querySelector('#btn-save-service');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Сохранение...';

      try {
        await saveService({
          id: service?.id || null,
          title,
          price,
          duration: selectedDuration,
          description: description || null,
        });
        clearCache();
        hapticSuccess();
        goBack();
      } catch (e) {
        console.error('[service-edit] Ошибка сохранения:', e);
        el.querySelector('#save-error').textContent = e.message || 'Ошибка сохранения';
        el.querySelector('#save-error').style.display = 'block';
        saveBtn.disabled = false;
        saveBtn.textContent = 'Сохранить';
      }
    };

    showMainButton('Сохранить', save);
    el.querySelector('#btn-save-service')?.addEventListener('click', save);

    // Удаление
    el.querySelector('#btn-delete-service')?.addEventListener('click', async () => {
      hapticWarning();
      const ok = await tgConfirm('Удалить услугу?');
      if (ok) {
        try {
          await deleteService(service.id);
          clearCache();
          hapticSuccess();
          goBack();
        } catch (e) {
          console.error('[service-edit] Ошибка удаления:', e);
        }
      }
    });
  },
};
