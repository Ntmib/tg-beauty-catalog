/**
 * Демо-данные приложения
 * Реалистичные данные мастера маникюра для демонстрации
 *
 * В продакшене данные приходят из Supabase.
 * Здесь — хардкод для прототипа.
 */

// --- Мастер ---
export const master = {
  id: 'master_001',
  telegram_id: 123456789,
  bot_username: 'anna_beauty_bot',
  name: 'Анна Иванова',
  photo_url: null, // используем аватарку-заглушку
  initials: 'АИ',
  specialty: ['nails'],
  specialtyLabels: ['Маникюр, педикюр'],
  experience: '5 лет',
  address: 'ул. Тверская, 15, оф 3',
  phone: '+7 999 123-45-67',
  telegram_username: '@anna_nails',
  bookings_count: 247,
  schedule: {
    work_days: [1, 2, 3, 4, 5], // Пн-Пт
    start_hour: 10,
    end_hour: 19,
    break_start: 13,
    break_end: 14
  },
  day_offs: [], // конкретные выходные
  onboarding_done: true,
};

// --- Услуги ---
export const services = [
  {
    id: 'svc_001',
    title: 'Маникюр классический',
    description: 'Классический маникюр с обработкой кутикулы и приданием формы ногтям.',
    price: 1500,
    duration: 90, // минуты
    category: 'nails',
    is_active: true,
  },
  {
    id: 'svc_002',
    title: 'Маникюр + покрытие',
    description: 'Классический маникюр с покрытием гель-лаком. Широкая палитра цветов.',
    price: 2500,
    duration: 120,
    category: 'nails',
    is_active: true,
  },
  {
    id: 'svc_003',
    title: 'Педикюр',
    description: 'Аппаратный педикюр с обработкой стоп и покрытием.',
    price: 2000,
    duration: 90,
    category: 'nails',
    is_active: true,
  },
  {
    id: 'svc_004',
    title: 'Снятие + маникюр',
    description: 'Снятие старого покрытия + классический маникюр + новое покрытие гель-лаком.',
    price: 3000,
    duration: 150,
    category: 'nails',
    is_active: true,
  },
  {
    id: 'svc_005',
    title: 'Наращивание',
    description: 'Наращивание ногтей гелем или акрилом. Любая длина и форма.',
    price: 4000,
    duration: 180,
    category: 'nails',
    is_active: true,
  },
  {
    id: 'svc_006',
    title: 'Дизайн ногтей',
    description: 'Художественный дизайн: стразы, втирка, рисунки, фольга.',
    price: 500,
    duration: 30,
    category: 'nails',
    is_active: true,
  },
];

// --- Портфолио (плейсхолдеры с градиентами) ---
export const portfolio = [
  { id: 'ph_1', placeholder: 'ph-1', emoji: '💅' },
  { id: 'ph_2', placeholder: 'ph-2', emoji: '✨' },
  { id: 'ph_3', placeholder: 'ph-3', emoji: '💖' },
  { id: 'ph_4', placeholder: 'ph-4', emoji: '🌸' },
  { id: 'ph_5', placeholder: 'ph-5', emoji: '💎' },
  { id: 'ph_6', placeholder: 'ph-6', emoji: '🦋' },
];

// --- Записи ---
export const bookings = [
  {
    id: 'bk_001',
    service_id: 'svc_002',
    service_title: 'Маникюр + покрытие',
    client_name: 'Мария П.',
    client_tg_id: 111222333,
    booking_date: '2026-03-05',
    booking_time: '14:00',
    duration: 120,
    price: 2500,
    status: 'pending',
  },
  {
    id: 'bk_002',
    service_id: 'svc_001',
    service_title: 'Маникюр классический',
    client_name: 'Елена К.',
    client_tg_id: 444555666,
    booking_date: '2026-03-04',
    booking_time: '10:00',
    duration: 90,
    price: 1500,
    status: 'confirmed',
  },
  {
    id: 'bk_003',
    service_id: 'svc_003',
    service_title: 'Педикюр',
    client_name: 'Ольга С.',
    client_tg_id: 777888999,
    booking_date: '2026-03-04',
    booking_time: '14:00',
    duration: 90,
    price: 2000,
    status: 'confirmed',
  },
  {
    id: 'bk_004',
    service_id: 'svc_001',
    service_title: 'Маникюр классический',
    client_name: 'Мария П.',
    client_tg_id: 111222333,
    booking_date: '2026-02-17',
    booking_time: '10:00',
    duration: 90,
    price: 1500,
    status: 'completed',
  },
];

// --- Шаблоны услуг для онбординга ---
export const serviceTemplates = {
  nails: [
    { title: 'Маникюр классический', duration: 90, price: 1500 },
    { title: 'Маникюр + покрытие', duration: 120, price: 2500 },
    { title: 'Педикюр', duration: 90, price: 2000 },
    { title: 'Снятие + маникюр', duration: 150, price: 3000 },
    { title: 'Наращивание', duration: 180, price: 4000 },
    { title: 'Дизайн ногтей', duration: 30, price: 500 },
  ],
  brows: [
    { title: 'Коррекция бровей', duration: 60, price: 1000 },
    { title: 'Окрашивание бровей', duration: 60, price: 1500 },
    { title: 'Ламинирование бровей', duration: 90, price: 2500 },
    { title: 'Коррекция + окрашивание', duration: 90, price: 2000 },
  ],
  lashes: [
    { title: 'Наращивание классика', duration: 120, price: 3000 },
    { title: 'Наращивание 2D', duration: 150, price: 3500 },
    { title: 'Наращивание объём', duration: 180, price: 4000 },
    { title: 'Ламинирование ресниц', duration: 90, price: 2500 },
    { title: 'Снятие ресниц', duration: 30, price: 500 },
  ],
  hair: [
    { title: 'Стрижка женская', duration: 60, price: 2000 },
    { title: 'Окрашивание', duration: 180, price: 5000 },
    { title: 'Укладка', duration: 60, price: 1500 },
    { title: 'Кератиновое выпрямление', duration: 180, price: 6000 },
    { title: 'Ботокс для волос', duration: 150, price: 5000 },
  ],
  face: [
    { title: 'Чистка лица', duration: 90, price: 3000 },
    { title: 'Пилинг', duration: 60, price: 2500 },
    { title: 'Массаж лица', duration: 60, price: 2000 },
    { title: 'Уходовая процедура', duration: 90, price: 3500 },
  ],
  body: [
    { title: 'Массаж', duration: 60, price: 3000 },
    { title: 'Обёртывание', duration: 90, price: 3500 },
    { title: 'Шугаринг', duration: 60, price: 2000 },
    { title: 'Восковая депиляция', duration: 60, price: 2000 },
  ],
};

// --- Специализации (для выбора) ---
export const specialties = [
  { id: 'nails', label: 'Ногти', emoji: '💅' },
  { id: 'brows', label: 'Брови', emoji: '✨' },
  { id: 'lashes', label: 'Ресницы', emoji: '👁' },
  { id: 'hair', label: 'Волосы', emoji: '💇' },
  { id: 'face', label: 'Лицо', emoji: '🧖' },
  { id: 'body', label: 'Тело', emoji: '🧴' },
];

// --- Вспомогательные функции ---

/** Форматирование цены: 2500 → "2 500 ₽" */
export function formatPrice(price) {
  return price.toLocaleString('ru-RU') + ' ₽';
}

/** Форматирование длительности: 90 → "1.5 ч", 30 → "30 мин" */
export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} мин`;
  const hours = minutes / 60;
  if (hours === Math.floor(hours)) return `${hours} ч`;
  return `${hours.toFixed(1).replace('.', ',')} ч`;
}

/** Форматирование даты: "2026-03-05" → "Ср, 5 марта" */
export function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
}

/** Форматирование времени конца: "14:00" + 120мин → "16:00" */
export function getEndTime(time, durationMin) {
  const [h, m] = time.split(':').map(Number);
  const totalMin = h * 60 + m + durationMin;
  const endH = Math.floor(totalMin / 60);
  const endM = totalMin % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

/** Является ли дата "сегодня" */
export function isToday(dateStr) {
  const today = new Date();
  const date = new Date(dateStr + 'T00:00:00');
  return date.toDateString() === today.toDateString();
}

/** Является ли дата "завтра" */
export function isTomorrow(dateStr) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = new Date(dateStr + 'T00:00:00');
  return date.toDateString() === tomorrow.toDateString();
}

/** Получить дату в формате YYYY-MM-DD */
export function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
