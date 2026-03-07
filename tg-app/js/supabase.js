/**
 * Supabase клиент
 *
 * Singleton с кастомным fetch, который автоматически добавляет
 * Bearer-токен от Edge Function auth-telegram в каждый запрос.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

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

/** Кастомный fetch: добавляет Authorization header к каждому запросу */
function authFetch(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (_authToken) {
    headers['Authorization'] = `Bearer ${_authToken}`;
  }
  return fetch(url, { ...options, headers });
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { fetch: authFetch },
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Базовый URL Supabase (для прямых fetch к Edge Functions) */
export const SUPABASE_BASE_URL = SUPABASE_URL;
