/**
 * API-модуль — все CRUD операции через Supabase
 *
 * Мастер: читает и изменяет свои данные (RLS по telegram_id из JWT sub)
 * Клиент: читает данные мастера (RLS по app_master_id из JWT)
 *
 * Кеш: данные хранятся в памяти до перезагрузки страницы.
 * Для принудительного обновления передайте forceRefresh = true.
 */

import { supabase } from './supabase.js';
import { getMasterId } from './auth.js';

// ============================================================
// Внутренний кеш
// ============================================================
const _cache = {
  profile: null,    // данные master + master_profiles
  services: null,   // список услуг
  portfolio: null,  // список фото
  schedule: null,   // расписание
};

export function clearCache() {
  _cache.profile = null;
  _cache.services = null;
  _cache.portfolio = null;
  _cache.schedule = null;
}

// ============================================================
// ПРОФИЛЬ МАСТЕРА
// ============================================================

/**
 * Получить профиль (masters JOIN master_profiles).
 * Для мастера — его профиль. Для клиента — профиль мастера из JWT.
 */
export async function getMasterProfile(forceRefresh = false) {
  if (!forceRefresh && _cache.profile) return _cache.profile;

  // Клиент читает master_profiles через RLS (app_master_id из JWT)
  // Мастер читает через RLS (telegram_id из sub)
  const { data, error } = await supabase
    .from('master_profiles')
    .select(`
      *,
      masters (
        id, first_name, last_name, username,
        bot_username, is_bot_active, onboarding_done,
        plan, plan_expires_at
      )
    `)
    .single();

  if (error) throw error;
  _cache.profile = data;
  return data;
}

/**
 * Данные мастера из таблицы masters (только для мастера).
 */
export async function getMasterRow() {
  const { data, error } = await supabase
    .from('masters')
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

/**
 * Сохранить профиль мастера.
 */
export async function saveMasterProfile({ name, specialty, bio, experience, city }) {
  const nameParts = name.trim().split(/\s+/);
  const first_name = nameParts[0] || '';
  const last_name = nameParts.slice(1).join(' ') || null;

  // Обновить имя в таблице masters
  const { error: mErr } = await supabase
    .from('masters')
    .update({ first_name, last_name });
  if (mErr) throw mErr;

  // Upsert master_profiles
  const { error: pErr } = await supabase
    .from('master_profiles')
    .upsert({
      master_id: getMasterId(),
      name,
      specialty: specialty || [],
      bio: bio || null,
      experience: experience || null,
      city: city || null,
    });
  if (pErr) throw pErr;

  _cache.profile = null; // сбросить кеш
}

/**
 * Отметить онбординг завершённым.
 */
export async function completeOnboarding() {
  const { error } = await supabase
    .from('masters')
    .update({ onboarding_done: true });
  if (error) throw error;
}

// ============================================================
// УСЛУГИ
// ============================================================

/**
 * Получить услуги.
 * Мастер — все свои. Клиент — только активные, через RLS.
 */
export async function getServices(forceRefresh = false) {
  if (!forceRefresh && _cache.services) return _cache.services;

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  _cache.services = data || [];
  return _cache.services;
}

/**
 * Получить услугу по ID из кеша или из базы.
 */
export async function getServiceById(id) {
  const services = await getServices();
  return services.find(s => s.id === id) || null;
}

/**
 * Создать или обновить услугу.
 */
export async function saveService({ id, title, description, price, duration }) {
  _cache.services = null; // сбросить кеш

  if (id) {
    const { data, error } = await supabase
      .from('services')
      .update({ title, description: description || null, price: parseInt(price), duration: parseInt(duration) })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('services')
      .insert({
        master_id: getMasterId(),
        title,
        description: description || null,
        price: parseInt(price),
        duration: parseInt(duration),
        is_active: true,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

/**
 * Скрыть услугу (soft delete — is_active = false).
 */
export async function deleteService(id) {
  _cache.services = null;
  const { error } = await supabase
    .from('services')
    .update({ is_active: false })
    .eq('id', id);
  if (error) throw error;
}

// ============================================================
// ПОРТФОЛИО
// ============================================================

/**
 * Получить список фото.
 */
export async function getPortfolio(forceRefresh = false) {
  if (!forceRefresh && _cache.portfolio) return _cache.portfolio;

  const { data, error } = await supabase
    .from('portfolio')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  _cache.portfolio = data || [];
  return _cache.portfolio;
}

/**
 * Загрузить фото в Supabase Storage + добавить запись в portfolio.
 */
export async function uploadPhoto(file) {
  const masterId = getMasterId();
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}.${ext}`;
  const path = `${masterId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('portfolio')
    .upload(path, file, { contentType: file.type });
  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage.from('portfolio').getPublicUrl(path);

  const { data, error } = await supabase
    .from('portfolio')
    .insert({ master_id: masterId, image_url: publicUrl })
    .select()
    .single();
  if (error) throw error;

  _cache.portfolio = null;
  return data;
}

/**
 * Удалить фото (из Storage + из portfolio).
 */
export async function deletePhoto(id, imageUrl) {
  // Попытаться удалить из Storage (опционально)
  try {
    const marker = '/portfolio/';
    const idx = imageUrl.indexOf(marker);
    if (idx !== -1) {
      const storagePath = imageUrl.substring(idx + marker.length);
      await supabase.storage.from('portfolio').remove([storagePath]);
    }
  } catch (e) {
    console.warn('[api] Не удалось удалить из Storage:', e);
  }

  const { error } = await supabase.from('portfolio').delete().eq('id', id);
  if (error) throw error;
  _cache.portfolio = null;
}

// ============================================================
// РАСПИСАНИЕ
// ============================================================

const DEFAULT_SCHEDULE = {
  work_days: [1, 2, 3, 4, 5],
  start_hour: 10,
  end_hour: 19,
  break_start: 13,
  break_end: 14,
  slot_duration: 30,
};

/**
 * Получить расписание.
 */
export async function getSchedule(forceRefresh = false) {
  if (!forceRefresh && _cache.schedule) return _cache.schedule;

  const masterId = getMasterId();
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('master_id', masterId)
    .maybeSingle();

  if (error) throw error;
  _cache.schedule = data || { ...DEFAULT_SCHEDULE, master_id: masterId };
  return _cache.schedule;
}

/**
 * Сохранить расписание.
 */
export async function saveSchedule({ work_days, start_hour, end_hour, break_start, break_end }) {
  const masterId = getMasterId();
  const { error } = await supabase
    .from('schedules')
    .upsert({ master_id: masterId, work_days, start_hour, end_hour, break_start, break_end });
  if (error) throw error;
  _cache.schedule = null;
}

// ============================================================
// ЗАПИСИ (мастер)
// ============================================================

/**
 * Получить все записи мастера с деталями.
 */
export async function getMasterBookings() {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      services (title, price, duration),
      clients (first_name, last_name, username)
    `)
    .order('booking_date', { ascending: true })
    .order('booking_time', { ascending: true });

  if (error) throw error;
  return (data || []).map(mapBooking);
}

/**
 * Обновить статус записи.
 */
export async function updateBookingStatus(id, status) {
  const { error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}

// ============================================================
// ЗАПИСИ (клиент)
// ============================================================

/**
 * Получить свои записи как клиент.
 */
export async function getClientBookings() {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      services (title, price, duration)
    `)
    .order('booking_date', { ascending: true })
    .order('booking_time', { ascending: true });

  if (error) throw error;
  return (data || []).map(b => ({
    ...b,
    service_title: b.services?.title || 'Услуга',
    price: b.services?.price || 0,
    duration: b.services?.duration || 60,
  }));
}

/**
 * Получить существующие записи для проверки слотов (клиент смотрит занятые слоты мастера).
 * Возвращает только date + time + duration для выбранной даты.
 */
export async function getBookedSlots(date) {
  const masterId = getMasterId();
  const { data, error } = await supabase
    .from('bookings')
    .select('booking_time, duration, status')
    .eq('master_id', masterId)
    .eq('booking_date', date)
    .not('status', 'in', '("cancelled_by_client","cancelled_by_master")');

  if (error) throw error;
  return data || [];
}

/**
 * Создать запись (клиент).
 */
export async function createBooking({ serviceId, date, time, duration, comment }) {
  const masterId = getMasterId();

  // Получить client_id (создаётся в auth-telegram Edge Function)
  const { data: clientData, error: clientError } = await supabase
    .from('clients')
    .select('id')
    .eq('master_id', masterId)
    .maybeSingle();

  if (clientError) throw clientError;
  if (!clientData) throw new Error('Запись клиента не найдена. Перезапустите приложение.');

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      master_id: masterId,
      client_id: clientData.id,
      service_id: serviceId,
      booking_date: date,
      booking_time: time,
      duration,
      client_comment: comment || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Отменить запись (клиент).
 */
export async function cancelBooking(id) {
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled_by_client' })
    .eq('id', id);
  if (error) throw error;
}

/**
 * Уведомить мастера о новой записи через Edge Function.
 */
export async function notifyMasterAboutBooking(bookingId) {
  const { SUPABASE_BASE_URL } = await import('./supabase.js');
  const { getSession } = await import('./auth.js');
  const session = getSession();

  try {
    await fetch(`${SUPABASE_BASE_URL}/functions/v1/bookings-notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ booking_id: bookingId }),
    });
  } catch (e) {
    console.warn('[api] Не удалось уведомить мастера:', e);
  }
}

// ============================================================
// Вспомогательные
// ============================================================

function mapBooking(b) {
  const client = b.clients;
  let clientName = 'Клиент';
  if (client) {
    const parts = [client.first_name, client.last_name].filter(Boolean);
    clientName = parts.length > 0
      ? parts.join(' ').trim()
      : (client.username ? `@${client.username}` : 'Клиент');
    // Сократить: "Мария Петрова" → "Мария П."
    if (parts.length === 2) {
      clientName = `${parts[0]} ${parts[1].charAt(0)}.`;
    }
  }
  return {
    ...b,
    service_title: b.services?.title || 'Услуга',
    client_name: clientName,
    price: b.services?.price || 0,
    duration: b.services?.duration || b.duration || 60,
  };
}
