/**
 * Экран М7: Рассылка сообщения клиентам
 *
 * Мастер пишет текст и отправляет всем клиентам через своего бота.
 * Требует подключённого бота.
 */

import { goBack } from '../router.js';
import { hideMainButton, hapticSuccess, hapticWarning } from '../telegram.js';
import { getClientsCount, broadcastToClients, getMasterRow } from '../api.js';

export const masterBroadcastScreen = {
  render() {
    return `
      <div id="broadcast-content">
        <div class="caption text-center" style="padding: 40px 0;">Загрузка...</div>
      </div>
    `;
  },

  async onEnter(el) {
    hideMainButton();

    const [masterRow, clientsCount] = await Promise.all([
      getMasterRow().catch(() => null),
      getClientsCount().catch(() => 0),
    ]);

    const haBot = masterRow?.is_bot_active && masterRow?.bot_username;

    if (!haBot) {
      el.querySelector('#broadcast-content').innerHTML = `
        <div class="text-center fade-in-up" style="padding: 40px 0;">
          <div style="font-size: 48px; margin-bottom: 16px;">🤖</div>
          <div class="page-title">Сначала подключи бота</div>
          <div class="caption" style="margin-top: 8px; line-height: 1.5;">
            Рассылка работает через твоего бота.<br>
            Подключи его в настройках профиля.
          </div>
          <button class="btn btn-primary btn-full mt" id="btn-go-profile">Подключить бота</button>
        </div>
      `;
      const { navigateTo } = await import('../router.js');
      el.querySelector('#btn-go-profile')?.addEventListener('click', () => navigateTo('master-profile'));
      return;
    }

    el.querySelector('#broadcast-content').innerHTML = `
      <div class="page-title fade-in-up">Написать клиентам</div>

      <div class="card fade-in-up delay-1" style="margin-top: var(--space-4);">
        <div class="card-row">
          <div style="font-size: 32px;">👥</div>
          <div class="card-body">
            <div class="card-title">${clientsCount} ${pluralClients(clientsCount)}</div>
            <div class="card-subtitle">получат твоё сообщение</div>
          </div>
        </div>
      </div>

      ${clientsCount === 0 ? `
        <div class="tip fade-in-up delay-2">
          <div class="tip-icon">ℹ️</div>
          <div class="tip-text">
            Пока клиентов нет — некому отправлять. Как только кто-то запишется через твоего бота, появится здесь.
          </div>
        </div>
      ` : ''}

      <div class="input-group fade-in-up delay-2" style="margin-top: var(--space-4);">
        <label class="input-label" for="broadcast-text">Текст сообщения</label>
        <textarea class="input" id="broadcast-text" rows="6" autocomplete="off"
          placeholder="Например: Привет! В честь весны дарю скидку 20% на маникюр до конца марта. Записывайся!"></textarea>
        <div class="caption" id="char-counter" style="text-align: right; margin-top: 4px; opacity: 0.5;">0 / 1000</div>
      </div>

      <div class="tip fade-in-up delay-3">
        <div class="tip-icon">💡</div>
        <div class="tip-text">
          Пиши коротко и по делу. Лучшие рассылки — акции, новые услуги, свободные окна.
          Клиенты оценят если не часто.
        </div>
      </div>

      <div id="broadcast-error" class="caption text-center" style="color: var(--color-error, red); display: none; margin-top: 8px;"></div>

      <button class="btn btn-primary btn-full mt fade-in-up delay-3" id="btn-send-broadcast"
        ${clientsCount === 0 ? 'disabled' : ''}>
        📣 Отправить ${clientsCount > 0 ? clientsCount + ' ' + pluralClients(clientsCount) : ''}
      </button>
      <div class="caption text-center fade-in-up delay-4" style="margin-top: 8px; opacity: 0.5;">
        Сообщение придёт от @${masterRow.bot_username}
      </div>
    `;

    const textarea = el.querySelector('#broadcast-text');
    const counter = el.querySelector('#char-counter');
    const MAX_LEN = 1000;

    textarea?.addEventListener('input', () => {
      const len = textarea.value.length;
      counter.textContent = `${len} / ${MAX_LEN}`;
      counter.style.color = len > MAX_LEN ? 'var(--color-error, red)' : '';
    });

    el.querySelector('#btn-send-broadcast')?.addEventListener('click', async () => {
      const message = textarea?.value.trim();
      const errEl = el.querySelector('#broadcast-error');
      errEl.style.display = 'none';

      if (!message) {
        errEl.textContent = 'Напиши текст сообщения';
        errEl.style.display = 'block';
        return;
      }
      if (message.length > MAX_LEN) {
        errEl.textContent = `Сообщение слишком длинное (максимум ${MAX_LEN} символов)`;
        errEl.style.display = 'block';
        return;
      }

      const sendBtn = el.querySelector('#btn-send-broadcast');
      sendBtn.disabled = true;
      sendBtn.textContent = 'Отправляем...';

      try {
        const result = await broadcastToClients(message);
        hapticSuccess();
        el.querySelector('#broadcast-content').innerHTML = renderSuccess(result);
        el.querySelector('#btn-done')?.addEventListener('click', () => goBack());
      } catch (e) {
        console.error('[broadcast] Ошибка рассылки:', e);
        hapticWarning();
        errEl.textContent = e.message || 'Не удалось отправить. Попробуй позже.';
        errEl.style.display = 'block';
        sendBtn.disabled = false;
        sendBtn.textContent = `📣 Отправить ${clientsCount} ${pluralClients(clientsCount)}`;
      }
    });
  },
};

function renderSuccess({ sent = 0, failed = 0, total = 0 }) {
  return `
    <div class="text-center fade-in-up" style="padding: 40px 0;">
      <div style="font-size: 56px; margin-bottom: 12px;">🎉</div>
      <div class="page-title">Рассылка отправлена!</div>

      <div class="card" style="margin-top: var(--space-5); text-align: left;">
        <div class="card-row">
          <div class="card-title" style="font-size: 32px; font-weight: 700; color: var(--color-primary);">
            ${sent}
          </div>
          <div class="card-body">
            <div class="card-title">доставлено</div>
            ${failed > 0 ? `<div class="card-subtitle">Не получили: ${failed} (удалили бота)</div>` : ''}
          </div>
        </div>
      </div>

      <div class="caption" style="margin-top: 12px; opacity: 0.7; line-height: 1.5;">
        Клиенты, которые заблокировали бота,<br>не получат сообщение — это нормально.
      </div>

      <button class="btn btn-primary btn-full mt" id="btn-done">Готово</button>
    </div>
  `;
}

function pluralClients(n) {
  if (n % 10 === 1 && n % 100 !== 11) return 'клиент';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'клиента';
  return 'клиентов';
}
