# Реорганизация дизайна — tg-beauty-catalog

> Аудит текущего UI + план улучшений по профессиональным стандартам веб-дизайна.
> Дата: 3 марта 2026

---

## Общая оценка

Текущий дизайн — **крепкий прототип**. Хорошая база: CSS-переменные из Telegram, единая дизайн-система, анимации появления, правильные touch-размеры кнопок (44px). Но есть системные проблемы, которые отделяют прототип от продакшен-качества.

**Что хорошо:**
- CSS-переменные из Telegram ThemeParams — автоматическая тёмная тема
- Единый файл стилей с логичной структурой (~1400 строк)
- Минимальная высота кнопок 44px (стандарт Apple HIG)
- Анимации появления (fade-in-up) с каскадными задержками
- Safe-area поддержка (`env(safe-area-inset-bottom)`)
- Скрытие скроллбаров в горизонтальных списках

**Что плохо:**
- Нет типографической шкалы — размеры шрифтов хаотичные
- Inline-стили вместо CSS-классов (30+ мест)
- Нет системы отступов — используются произвольные значения
- Нет фокус-состояний — приложение недоступно с клавиатуры
- Кликабельные `<div>` вместо `<button>` — проблемы доступности
- Нет адаптации под `prefers-reduced-motion`
- Нет обработки длинного контента (обрезка, переносы)

---

## Часть 1. Типографика

### Проблема
Размеры шрифтов разбросаны по файлам без системы: 11px, 12px, 13px, 14px, 15px, 16px, 17px, 18px, 20px, 22px, 24px, 56px. Нет чёткой иерархии — непонятно, какой размер для чего.

### Что используют дизайнеры
**Типографическая шкала** — набор фиксированных размеров с математическим соотношением (обычно множитель 1.2–1.333). Каждый размер имеет название и роль.

### План

Ввести 6 уровней типографики через CSS-переменные:

```
--font-xs:    12px   → Метки, бейджи, самый мелкий текст
--font-sm:    13px   → Подписи, hint-текст, caption
--font-base:  15px   → Основной текст, кнопки, карточки
--font-md:    17px   → Подзаголовки, выделенные элементы
--font-lg:    20px   → Заголовки экранов (page-title)
--font-xl:    24px   → Крупные акценты (welcome, offer)
```

Где сейчас хаос:
- `service.js` — цена `22px` (должен быть `--font-lg: 20px`)
- `welcome.js` — заголовок `24px` inline (должен быть `--font-xl`)
- `offer.js` — эмодзи `56px` inline (ОК, это декоративный элемент)
- `date-month` — `11px` (слишком мелко, заменить на `--font-xs: 12px`)
- `empty-state-title` — `17px` (должен быть `--font-md`)

**Также добавить:**
- `font-variant-numeric: tabular-nums` для цен и чисел — чтобы цифры были одинаковой ширины и цены не прыгали

---

## Часть 2. Система отступов (spacing)

### Проблема
Отступы заданы как попало: `4px, 6px, 8px, 10px, 12px, 14px, 16px, 20px, 24px, 32px, 36px, 40px`. Многие прописаны inline в JS-файлах (`style="margin-top: 8px; padding-bottom: 16px;"`).

### Что используют дизайнеры
**Шкала отступов (spacing scale)** — кратные базовому значению (обычно 4px или 8px). Tailwind использует `4, 8, 12, 16, 20, 24, 32, 40, 48`.

### План

Использовать шкалу кратную 4px, привязанную к CSS-переменным:

```
--space-1:  4px    (gap-xs)
--space-2:  8px    (gap-sm)
--space-3:  12px
--space-4:  16px   (gap — базовый)
--space-5:  20px
--space-6:  24px
--space-8:  32px
--space-10: 40px
```

**Что исправить:**
- Убрать все inline `style="margin-top: Xpx"` из JS-файлов — заменить на CSS-классы
- Утилиты `mt`, `mt-sm`, `mt-lg` — привязать к шкале
- Расширить набор утилит: `gap-1` ... `gap-6`, `p-1` ... `p-6`

---

## Часть 3. Inline-стили → CSS-классы

### Проблема
В JS-файлах 30+ мест с inline `style="..."`. Это:
- Усложняет поддержку (стили размазаны по 16 файлам)
- Невозможно переопределить через CSS (специфичность inline выше)
- Не работает с тёмной темой (захардкоженные цвета)

### Примеры (самые частые)

| Файл | Inline-стиль | Что должно быть |
|------|-------------|-----------------|
| `welcome.js` | `style="min-height: 70vh; text-align: center; padding: 20px;"` | Класс `.screen-centered` |
| `welcome.js` | `style="font-size: 56px; margin-bottom: 20px;"` | Класс `.hero-emoji` |
| `welcome.js` | `style="font-size: 24px; font-weight: 700;"` | Класс `.hero-title` |
| `service.js` | `style="display: flex; gap: 8px; overflow-x: auto;"` | Класс `.horizontal-scroll` |
| `service.js` | `style="flex-shrink: 0; width: 140px; height: 140px;"` | Класс `.scroll-photo` |
| `service.js` | `style="font-size: 22px;"` | Использовать `.price-lg` |
| `booking.js` | `style="text-align: center; padding: 20px 0;"` | Использовать утилиты |
| `catalog.js` | `style="text-align: center; margin-top: 8px; padding-bottom: 16px;"` | Использовать утилиты |
| `dashboard.js` | `style="flex: 1;"` | Использовать `.flex-1` |
| `master-profile.js` | `style="text-align: center; margin-bottom: 20px;"` | Класс `.avatar-section` |
| `photo.js` | `style="display: flex; min-height: 60vh; ..."` | Класс `.screen-centered` |
| `success.js` | `style="text-align: center; padding-top: 40px;"` | Утилиты |

### План

1. Создать повторяющиеся классы для общих паттернов:
   - `.screen-centered` — вертикальное центрирование контента
   - `.horizontal-scroll` — горизонтальный скролл с скрытым скроллбаром
   - `.scroll-photo` — фото в горизонтальном скролле
   - `.hero-emoji` — большой эмодзи на welcome/offer экранах
   - `.hero-title` — крупный заголовок
   - `.avatar-section` — блок с аватаркой по центру
   - `.price-lg` — крупная цена на детальном экране

2. Расширить утилиты:
   - `.flex-1`, `.flex-center`, `.flex-between`
   - `.text-center`, `.text-left`
   - `.p-4`, `.p-6` и т.д.

3. Пройтись по всем 16 экранам, заменить inline на классы

---

## Часть 4. Доступность (Accessibility)

### Проблема
Приложение сейчас **недоступно** для пользователей с ограничениями: нет фокус-состояний, кликабельные div-ы, нет ARIA-атрибутов.

### Что используют разработчики
- **WCAG 2.1 AA** — стандарт доступности (минимум для продакшена)
- **Apple HIG** — минимальный touch target 44×44px
- **WAI-ARIA** — атрибуты для скринридеров

### Что исправить

**4.1. Фокус-состояния (критично)**

Сейчас `outline: none` на всех элементах глобально (style.css:73), а замена есть только у `.input:focus`. Все остальные интерактивные элементы (кнопки, карточки, чипы, тайлы) — без видимого фокуса.

Добавить:
```css
/* Видимый фокус для клавиатурной навигации */
:focus-visible {
  outline: 2px solid var(--button);
  outline-offset: 2px;
}
```

**4.2. Семантический HTML (критично)**

Сейчас кликабельные элементы — это `<div>` с `addEventListener('click')`. Скринридер не знает, что это кнопки. Клавиатурой до них не добраться.

| Элемент | Сейчас | Должно быть |
|---------|--------|-------------|
| Контакт-кнопки (catalog.js) | `<div class="contact-btn">` | `<button class="contact-btn">` |
| Карточки услуг (catalog.js) | `<div class="card" data-service-id>` | `<div class="card" role="button" tabindex="0">` |
| Фото портфолио (catalog.js) | `<div class="portfolio-item">` | `<div role="button" tabindex="0" aria-label="Фото N">` |
| Адрес (catalog.js) | `<div id="address-link">` | `<button>` или `<a href="geo:...">` |
| Плитки дашборда (dashboard.js) | `<div class="grid-tile">` | `<button class="grid-tile">` |
| Дата в скролле (booking.js) | `<div class="date-item">` | `<button class="date-item">` |
| Слоты времени (booking.js) | `<div class="time-slot">` | `<button class="time-slot">` |
| Чипы (chips) | `<div class="chip">` | `<button class="chip" aria-pressed="true/false">` |
| Крестик подсказки (dashboard.js) | `<div class="tip-dismiss">` | `<button aria-label="Закрыть подсказку">` |
| Крестик удаления фото | `<div class="portfolio-delete">` | `<button aria-label="Удалить фото">` |

**4.3. Touch-цели (средне)**

Два элемента меньше 44px минимума:
- `.portfolio-delete` — 24×24px → увеличить до 44×44px (контент 24px, но padding до 44px)
- `.tip-dismiss` — 24×24px → аналогично

**4.4. Динамический контент**

Добавить `aria-live="polite"` к блокам, которые обновляются:
- `#booking-summary` (сводка записи)
- `#time-grid-container` (слоты после выбора даты)
- `#bookings-content` (записи при переключении табов)

---

## Часть 5. Анимации

### Проблема
Анимации не учитывают пользователей, которые отключили анимации в настройках ОС (вестибулярные расстройства, укачивание).

### Стандарт
`prefers-reduced-motion: reduce` — медиа-запрос, который срабатывает если пользователь просил уменьшить анимации.

### План

Добавить в style.css:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Также заменить все `transition: all` на явные свойства:
- `.mode-btn` → `transition: background 200ms, color 200ms, box-shadow 200ms`
- `.chip` → `transition: background 200ms, color 200ms, transform 200ms`
- `.day-toggle` → `transition: background 200ms, color 200ms, transform 200ms`
- `.time-slot` → `transition: background 200ms, color 200ms, transform 200ms`
- `.date-item` → `transition: background 200ms, color 200ms, transform 200ms`
- `.tab` → `transition: background 200ms, color 200ms, box-shadow 200ms`
- `.service-template` → `transition: background 200ms, box-shadow 200ms, transform 200ms`

`transition: all` заставляет браузер следить за изменением ВСЕХ свойств — это лишняя работа и может вызвать неожиданные эффекты.

---

## Часть 6. Обработка контента

### Проблема
Нет защиты от длинных текстов. Если мастер введёт длинное название услуги или адрес — вёрстка поедет.

### Стандарт
- `text-overflow: ellipsis` — обрезка с многоточием
- `line-clamp` — обрезка по количеству строк
- `word-break: break-word` — перенос длинных слов

### План

Добавить:
```css
.card-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-subtitle {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.body-text {
  word-break: break-word;
}

.profile-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
```

Для описаний услуг — `line-clamp: 3` в списке, полный текст на детальной странице.

---

## Часть 7. Визуальная консистентность

### 7.1. Радиусы скруглений
Сейчас 5 разных значений: `8px, 10px, 12px, 13px, 20px, 50%`. Нужна система:

```
--radius-sm:   8px    → кнопки мелкие, инпуты, табы
--radius-md:  12px    → карточки, тайлы, модалки
--radius-lg:  20px    → чипы, offer-card
--radius-full: 9999px → аватарки, бейджи, точки
```

### 7.2. Тени
Сейчас тени только у `.mode-btn.active` и `.tab.active` (разные!). Нужна единая шкала:

```
--shadow-sm:  0 1px 2px rgba(0,0,0,0.06)   → активные табы
--shadow-md:  0 2px 8px rgba(0,0,0,0.08)   → приподнятые карточки
--shadow-lg:  0 4px 16px rgba(0,0,0,0.12)  → модалки, оверлеи
```

### 7.3. Цвета статусов
Захардкожены в CSS: `#34c759` (зелёный), `#ff9f0a` (жёлтый). В тёмной теме могут плохо читаться. Вынести в переменные:

```
--color-success:  #34c759
--color-warning:  #ff9f0a
--color-error:    var(--destructive)
```

---

## Часть 8. index.html

### Что исправить

1. **Убрать `user-scalable=no`** — блокирует зум, нарушает доступность
2. **Добавить `<meta name="theme-color">`** — чтобы адресная строка браузера совпадала с фоном
3. **Добавить `preconnect`** к `telegram.org` — ускорит загрузку SDK
4. **Добавить `color-scheme: light dark`** на `<html>` — сообщить браузеру о поддержке тем

```html
<html lang="ru" style="color-scheme: light dark;">
<head>
  <meta name="theme-color" content="#ffffff">
  <link rel="preconnect" href="https://telegram.org">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
```

---

## Часть 9. Формы

### Проблема
Инпуты не используют стандартные HTML-атрибуты, которые улучшают UX на мобильных.

### План

| Поле | Сейчас | Добавить |
|------|--------|----------|
| Имя | `<input type="text">` | `name="name" autocomplete="name"` |
| Телефон | `<input type="tel">` | `name="phone" autocomplete="tel"` |
| Адрес | `<input type="text">` | `name="address" autocomplete="street-address"` |
| Telegram | `<input type="text">` | `name="telegram" inputmode="text"` |
| Цена | `<input type="number">` | `name="price" inputmode="numeric" min="0"` |

`autocomplete` позволяет телефону подставить данные из контактов — экономит время мастера при заполнении профиля.

Также — связать `<label>` с `<input>` через `for`/`id`, чтобы клик по подписи ставил фокус в поле.

---

## Приоритеты реализации

### Приоритет 1 — Быстрые исправления (не меняют визуал)
- [ ] Добавить `:focus-visible` стиль глобально
- [ ] Добавить `@media (prefers-reduced-motion: reduce)`
- [ ] Заменить `transition: all` на явные свойства (7 мест)
- [ ] Добавить `font-variant-numeric: tabular-nums` к ценам
- [ ] Исправить `index.html` (theme-color, preconnect, убрать user-scalable=no)
- [ ] Добавить `autocomplete` и `name` к инпутам
- [ ] Увеличить touch-target у portfolio-delete и tip-dismiss

### Приоритет 2 — CSS-система (визуал не меняется, код чище)
- [ ] Ввести CSS-переменные для типографики (--font-xs ... --font-xl)
- [ ] Ввести CSS-переменные для spacing (--space-1 ... --space-10)
- [ ] Ввести CSS-переменные для радиусов (--radius-sm/md/lg/full)
- [ ] Ввести CSS-переменные для теней (--shadow-sm/md/lg)
- [ ] Вынести статусные цвета в переменные
- [ ] Создать утилит-классы (flex-center, text-center, p-4 и т.д.)

### Приоритет 3 — Рефакторинг шаблонов (основная работа)
- [ ] Заменить кликабельные div на button/role="button" (12+ мест)
- [ ] Убрать inline-стили из JS → создать CSS-классы (30+ мест)
- [ ] Добавить aria-label к icon-кнопкам
- [ ] Добавить aria-live к динамическим блокам
- [ ] Добавить обрезку длинного текста (ellipsis, line-clamp)
- [ ] Связать label с input через for/id

### Приоритет 4 — Дизайн-улучшения (визуальные изменения)
- [ ] Hover-состояния для десктопа (если открывают в браузере)
- [ ] Скелетоны при загрузке данных (уже есть в CSS, не используются)
- [ ] Пустые состояния на всех экранах
- [ ] Анимация переключения табов
- [ ] Подтверждение перед деструктивными действиями (decline без confirm)

---

## Итого

| Категория | Найдено проблем | Влияние |
|-----------|----------------|---------|
| Доступность (a11y) | 15+ | Высокое — часть пользователей не может пользоваться |
| Inline-стили | 30+ | Среднее — усложняет поддержку |
| Типографика | 12+ размеров без системы | Среднее — визуальная рассогласованность |
| Отступы | 12+ произвольных значений | Среднее — непредсказуемое поведение |
| Анимации | 7 transition:all + 0 reduced-motion | Низкое — производительность и a11y |
| Формы | 10+ полей без autocomplete | Низкое — упущенный UX |

**Главный вывод:** Визуально приложение выглядит нормально. Проблемы — под капотом: доступность, консистентность кода, отсутствие дизайн-токенов. Приоритет 1 можно сделать за один подход, не меняя внешний вид.

---

*Аудит проведён по Web Interface Guidelines (Vercel) + Apple HIG + WCAG 2.1 AA.*
