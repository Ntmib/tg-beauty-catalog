/**
 * Статические данные и утилиты
 *
 * Динамические данные (мастер, услуги, портфолио, записи)
 * теперь хранятся в Supabase и загружаются через api.js.
 *
 * Здесь остались:
 * - Утилиты форматирования (formatPrice, formatDuration, etc.)
 * - Шаблоны услуг для онбординга (serviceTemplates)
 * - Список специализаций (specialties)
 */

// --- Специализации ---
export const specialties = [
  { id: 'nails',  label: 'Ногти',   emoji: '💅' },
  { id: 'brows',  label: 'Брови',   emoji: '✨' },
  { id: 'lashes', label: 'Ресницы', emoji: '👁' },
  { id: 'hair',   label: 'Волосы',  emoji: '💇' },
  { id: 'face',   label: 'Лицо',    emoji: '🧖' },
  { id: 'body',   label: 'Тело',    emoji: '🧴' },
];

// --- Шаблоны услуг для онбординга ---
export const serviceTemplates = {
  nails: [
    { title: 'Маникюр классический',  duration: 90,  price: 1500 },
    { title: 'Маникюр + покрытие',    duration: 120, price: 2500 },
    { title: 'Педикюр',               duration: 90,  price: 2000 },
    { title: 'Снятие + маникюр',      duration: 150, price: 3000 },
    { title: 'Наращивание',           duration: 180, price: 4000 },
    { title: 'Дизайн ногтей',         duration: 30,  price: 500  },
  ],
  brows: [
    { title: 'Коррекция бровей',       duration: 60,  price: 1000 },
    { title: 'Окрашивание бровей',     duration: 60,  price: 1500 },
    { title: 'Ламинирование бровей',   duration: 90,  price: 2500 },
    { title: 'Коррекция + окрашивание',duration: 90,  price: 2000 },
  ],
  lashes: [
    { title: 'Наращивание классика',  duration: 120, price: 3000 },
    { title: 'Наращивание 2D',        duration: 150, price: 3500 },
    { title: 'Наращивание объём',     duration: 180, price: 4000 },
    { title: 'Ламинирование ресниц',  duration: 90,  price: 2500 },
    { title: 'Снятие ресниц',         duration: 30,  price: 500  },
  ],
  hair: [
    { title: 'Стрижка женская',          duration: 60,  price: 2000 },
    { title: 'Окрашивание',              duration: 180, price: 5000 },
    { title: 'Укладка',                  duration: 60,  price: 1500 },
    { title: 'Кератиновое выпрямление',  duration: 180, price: 6000 },
    { title: 'Ботокс для волос',         duration: 150, price: 5000 },
  ],
  face: [
    { title: 'Чистка лица',       duration: 90, price: 3000 },
    { title: 'Пилинг',            duration: 60, price: 2500 },
    { title: 'Массаж лица',       duration: 60, price: 2000 },
    { title: 'Уходовая процедура',duration: 90, price: 3500 },
  ],
  body: [
    { title: 'Массаж',             duration: 60, price: 3000 },
    { title: 'Обёртывание',        duration: 90, price: 3500 },
    { title: 'Шугаринг',           duration: 60, price: 2000 },
    { title: 'Восковая депиляция', duration: 60, price: 2000 },
  ],
};

// ============================================================
// Утилиты форматирования
// ============================================================

/** Форматирование цены: 2500 → "2 500 ₽" */
export function formatPrice(price) {
  return (price || 0).toLocaleString('ru-RU') + ' ₽';
}

/** Форматирование длительности: 90 → "1.5 ч", 30 → "30 мин" */
export function formatDuration(minutes) {
  if (!minutes) return '';
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

/** Время конца: "14:00" + 120 мин → "16:00" */
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

/** Дата в формате YYYY-MM-DD */
export function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
