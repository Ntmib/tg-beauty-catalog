/**
 * Supabase клиент
 *
 * Singleton с кастомным fetch, который автоматически добавляет
 * Bearer-токен от Edge Function auth-telegram в каждый запрос.
 */

// Supabase SDK загружается через <script> тег в index.html (UMD)
// window.supabase доступен глобально до загрузки этого модуля
const { createClient } = window.supabase;

const SUPABASE_URL = 'https://zbxbeagmqmnijkjhhcgp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpieGJlYWdtcW1uaWpramhoY2dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NDUzNzYsImV4cCI6MjA4ODIyMTM3Nn0.WRpMHqQcH7zbcS7EsdAGiqXFM1uvD42Z7daS5wN1PGo';

let _authToken = null;

/** Установить JWT токен (вызывается из auth.js после аутентификации) */
export function setAuthToken(token) {
  _authToken = token;
}

/** Получить текущий токен (используется в edgeFetch) */
export function getAuthToken() {
  return _authToken;
}

/** Кастомный fetch: добавляет apikey и Authorization header к каждому запросу */
function authFetch(url, options = {}) {
  // Headers может быть Headers-объектом или plain object — обрабатываем оба случая
  const srcHeaders = options.headers;
  let headers;
  if (srcHeaders instanceof Headers) {
    headers = Object.fromEntries(srcHeaders.entries());
  } else {
    headers = { ...(srcHeaders || {}) };
  }

  // Всегда добавляем apikey явно (Supabase требует)
  headers['apikey'] = SUPABASE_ANON_KEY;

  if (_authToken) {
    headers['Authorization'] = `Bearer ${_authToken}`;
  }

  // DEBUG: логируем части JWT в Authorization
  const authVal = headers['Authorization'] || '';
  const jwtPart = authVal.replace('Bearer ', '');
  console.log('[authFetch] JWT parts in Authorization:', jwtPart.split('.').length, '| url:', String(url).split('/').slice(-2).join('/'));

  return fetch(url, { ...options, headers }).then(async res => {
    if (!res.ok) {
      const clone = res.clone();
      try {
        const errBody = await clone.json();
        console.error('[authFetch] Error response:', errBody?.message || errBody?.error, '| status:', res.status);
      } catch {}
    }
    return res;
  });
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { fetch: authFetch },
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Базовый URL Supabase (для прямых fetch к Edge Functions) */
export const SUPABASE_BASE_URL = SUPABASE_URL;
