/**
 * Экран М-план: Выбор тарифа
 *
 * Показывает Free vs Pro, кнопку оплаты через YooKassa.
 * Открывается из дашборда или при попытке добавить 6-ю услугу.
 */

import { hapticLight, hapticSuccess, alert as showAlert } from '../telegram.js';
import { getMasterRow } from '../api.js';

const PLAN_PRICE = 699;
const FREE_SERVICE_LIMIT = 5;

export const planSelectScreen = {
  render() {
    return `
      <div class="fade-in-up">
        <div class="page-title">Тариф</div>
      </div>
      <div id="plan-content">
        <div class="caption text-center" style="padding: 40px 0;">Загрузка...</div>
      </div>
    `;
  },

  async onEnter(el) {
    const masterRow = await getMasterRow().catch(() => null);
    const currentPlan = masterRow?.plan || 'free';
    const expiresAt = masterRow?.plan_expires_at;
    const isPro = currentPlan === 'pro' && expiresAt && new Date(expiresAt) > new Date();

    el.querySelector('#plan-content').innerHTML = isPro
      ? renderProActive(expiresAt)
      : renderUpgrade();

    if (!isPro) {
      el.querySelector('#btn-pay-card')?.addEventListener('click', () => {
        hapticLight();
        showAlert('Оплата картой появится совсем скоро! Мы уведомим вас.');
      });
    }
  },
};

function renderProActive(expiresAt) {
  const date = new Date(expiresAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  return `
    <div class="card fade-in-up delay-1" style="text-align:center; padding: 32px 20px;">
      <div style="font-size: 48px; margin-bottom: 12px;">⭐</div>
      <div class="card-title" style="font-size: 20px; margin-bottom: 8px;">У вас Pro</div>
      <div class="caption">Активна до ${date}</div>
    </div>

    <div class="card fade-in-up delay-2">
      <div class="section-title" style="margin-bottom: 12px;">Что входит в Pro:</div>
      ${renderProFeatures()}
    </div>
  `;
}

function renderUpgrade() {
  return `
    <!-- Текущий тариф -->
    <div class="card fade-in-up delay-1">
      <div class="card-row" style="align-items: flex-start;">
        <div class="card-body">
          <div class="card-title">Free</div>
          <div class="caption" style="margin-top: 4px;">Текущий тариф</div>
        </div>
        <div class="status status-confirmed" style="white-space: nowrap;">Активен</div>
      </div>
      <div style="margin-top: 12px; border-top: 1px solid var(--tg-theme-hint-color, #e0e0e0); padding-top: 12px; opacity: 0.8;">
        <div class="caption">✓ До ${FREE_SERVICE_LIMIT} услуг</div>
        <div class="caption">✓ История записей — 30 дней</div>
        <div class="caption">✓ Неограниченное кол-во клиентов</div>
      </div>
    </div>

    <!-- Pro тариф -->
    <div class="card fade-in-up delay-2" style="border: 2px solid var(--tg-theme-button-color, #e8748a); position: relative; overflow: hidden;">
      <div style="
        position: absolute; top: 12px; right: 12px;
        background: var(--tg-theme-button-color, #e8748a);
        color: var(--tg-theme-button-text-color, #fff);
        font-size: 11px; font-weight: 600;
        padding: 2px 10px; border-radius: 20px;
      ">Рекомендуем</div>

      <div class="card-row" style="align-items: flex-start;">
        <div class="card-body">
          <div class="card-title" style="font-size: 18px;">Pro</div>
          <div style="font-size: 22px; font-weight: 700; margin-top: 4px; color: var(--tg-theme-button-color, #e8748a);">
            ${PLAN_PRICE} ₽<span class="caption" style="font-size: 13px; font-weight: 400;">/мес</span>
          </div>
        </div>
      </div>

      <div style="margin-top: 12px; border-top: 1px solid var(--tg-theme-hint-color, #e0e0e0); padding-top: 12px;">
        ${renderProFeatures()}
      </div>
    </div>

    <!-- Кнопка оплаты -->
    <button class="btn btn-primary btn-full fade-in-up delay-3" id="btn-pay-card" style="margin-top: 8px;">
      Оплатить картой — ${PLAN_PRICE} ₽/мес
    </button>

    <div class="caption text-center fade-in-up delay-4" style="margin-top: 12px; opacity: 0.6;">
      Безопасная оплата через ЮКасса.<br>Отменить можно в любой момент.
    </div>
  `;
}

function renderProFeatures() {
  const features = [
    '✓ Безлимит услуг',
    '✓ История записей — 1 год',
    '✓ Безлимит фото в портфолио',
    '✓ Приоритетная поддержка',
  ];
  return features.map(f => `<div class="caption" style="margin-bottom: 4px;">${f}</div>`).join('');
}
