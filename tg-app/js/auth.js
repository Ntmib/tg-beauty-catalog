/**
 * Аутентификация через Edge Function auth-telegram
 *
 * Принимает initData от Telegram WebApp →
 * POST /functions/v1/auth-telegram →
 * Получает { access_token, role, master_id } →
 * Сохраняет сессию и устанавливает токен в supabase клиент.
 */

import { setAuthToken, SUPABASE_BASE_URL, SUPABASE_ANON_KEY } from './supabase.js';

let _session = null; // { access_token, role, master_id, debug? }

/**
 * Аутентификация при старте приложения.
 * Возвращает сессию или null если нет initData (браузер).
 */
export async function authenticate() {
  const initData = window.Telegram?.WebApp?.initData || '';

  // Браузерный режим — без Telegram initData
  if (!initData) {
    console.warn('[auth] Нет initData — браузерный режим (debug)');
    _session = { role: 'client', master_id: null, access_token: null, debug: true };
    return _session;
  }

  try {
    // master_id из URL (?master=<uuid>) — когда клиент открывает бота мастера
    const masterIdFromUrl = new URLSearchParams(window.location.search).get('master') || undefined;

    // Таймаут 10 сек на случай зависания Edge Function
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${SUPABASE_BASE_URL}/functions/v1/auth-telegram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ initData, master_id: masterIdFromUrl }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const reason = err.error || err.message || `HTTP ${res.status}`;
      console.error('[auth] Ошибка аутентификации:', reason);
      return { authError: reason };
    }

    const data = await res.json();
    _session = data;
    setAuthToken(data.access_token);
    return data;
  } catch (e) {
    console.error('[auth] Сбой сети:', e);
    return { authError: e.name === 'AbortError' ? 'Timeout (>10s)' : (e.message || 'Network error') };
  }
}

/** Текущая сессия */
export const getSession = () => _session;

/** Роль: 'master' | 'client' */
export const getRole = () => _session?.role || 'client';

/** UUID мастера (для мастера — свой, для клиента — UUID мастера чей каталог) */
export const getMasterId = () => _session?.master_id || null;

/** Авторизован ли пользователь */
export const isAuthenticated = () => !!_session;

/** Браузерный режим без Telegram */
export const isDebugMode = () => !!_session?.debug;

/**
 * Вызов Edge Function с JWT аутентификацией.
 * Используется для bots-connect, bots-disconnect и т.д.
 */
export async function callEdgeFunction(functionName, body = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (_session?.access_token) {
    headers['Authorization'] = `Bearer ${_session.access_token}`;
  }

  const res = await fetch(`${SUPABASE_BASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || 'Ошибка запроса');
  return data;
}
