# tg-beauty-catalog — План работ

> Обновлён: 8 марта 2026
> Источник фич: FEATURES.md (на основе PAIN-POINTS-RESEARCH.md)
> Источник инфраструктуры: BACKEND-PLAN.md

---

## Статус проекта

| Этап | Статус | Что сделано |
|------|--------|-------------|
| Прототип фронтенда | ✅ | 16 экранов, роутер, CSS, демо-данные |
| Бот (webhook) | ✅ | /start, /help, deep-link, меню |
| Supabase инфраструктура | ✅ | 10 таблиц, RLS, Storage |
| VPS (webhook-сервер) | ✅ | beauty.mcdenil.com, nginx, SSL, systemd |
| Edge Functions | ✅ | auth, bots-connect/disconnect, services-check-limit, bookings-notify |
| Frontend → Supabase | ✅ | CRUD через api.js, auth.js, Supabase SDK |
| **Бот: уведомления MVP** | 🔲 | Следующий шаг |

---

## Спринт 1: Бот — уведомления и напоминания (MVP)

> Цель: решить боль #1 (no-show, -70%) и боль #3 (хаос в записях)
> Агент: general-purpose (Python, VPS webhook-сервер)

### 1.1. Уведомление мастеру о новой записи
- 🔲 При INSERT в bookings → VPS получает через /notify
- 🔲 Бот отправляет мастеру: имя клиента, услуга, дата, время, цена
- 🔲 Inline-кнопки: «Подтвердить» / «Отклонить»
- 🔲 Callback query: обновляет booking.status в Supabase
- 🔲 При подтверждении → бот клиенту: «Запись подтверждена»
- 🔲 При отклонении → бот клиенту: «Выберите другое время» + кнопка Mini App
- **Файлы:** VPS: `handlers/booking_notify.py`, `handlers/callbacks.py`
- **Агент:** `general-purpose` — Python aiohttp, Telegram Bot API, Supabase REST

### 1.2. Подтверждение записи клиенту
- 🔲 После создания записи бот отправляет карточку: услуга, дата, время, цена, адрес
- 🔲 Текст: «Напоминание придёт за 24ч и за 2ч»
- 🔲 Кнопка «Мои записи» (Mini App)
- **Файлы:** VPS: `handlers/booking_confirm.py`
- **Агент:** тот же `general-purpose`

### 1.3. Автонапоминание за 24 часа
- 🔲 Cron-задача или pg_cron: выборка bookings WHERE booking_date = tomorrow
- 🔲 Бот клиенту: «Напоминание: завтра запись. {услуга}, {время}, {адрес}»
- 🔲 Кнопки: «Отменить запись», «Открыть каталог»
- 🔲 При отмене: update booking.status → cancelled_by_client, уведомить мастера
- **Файлы:** VPS: `cron/send_reminders.py`, crontab запись
- **Агент:** `general-purpose` — cron + Telegram Bot API + Supabase

### 1.4. Автонапоминание за 2 часа
- 🔲 Cron каждые 30 мин: bookings WHERE booking_date = today AND booking_time - 2h
- 🔲 Короткое сообщение: «Через 2 часа запись! {услуга}, {время}, {адрес}»
- 🔲 Кнопка «Как добраться» (geo-ссылка)
- 🔲 Без кнопки отмены (слишком поздно)
- **Файлы:** VPS: тот же `cron/send_reminders.py`
- **Агент:** тот же `general-purpose`

### 1.5. Уведомление мастеру об отмене
- 🔲 При UPDATE bookings SET status = 'cancelled_by_client' → webhook/notify
- 🔲 Бот мастеру: «Отмена: {имя}, {услуга}, {дата} {время}. Слот свободен.»
- **Файлы:** VPS: `handlers/booking_cancel.py`
- **Агент:** тот же `general-purpose`

### 1.6. Команда /help — контакты мастера
- 🔲 Бот: имя, телефон, Telegram, адрес (ссылка на карту), режим работы
- 🔲 Данные из master_profiles через Supabase
- **Файлы:** VPS: обновить `handlers/commands.py`
- **Агент:** `general-purpose`

---

## Спринт 2: Frontend — запись и отмена (MVP)

> Цель: решить боль #2 (переписки — запись в 3 тапа)
> Агент: general-purpose (Vanilla JS, фронтенд)

### 2.1. Экран выбора даты/времени — реальные слоты
- 🔲 Загрузка расписания мастера из schedules (Supabase)
- 🔲 Загрузка существующих bookings для расчёта свободных слотов
- 🔲 Логика слотов: начало >= work_start, конец <= work_end, не на перерыве, не занят
- 🔲 Горизонтальный скролл дат (14 дней)
- 🔲 Сетка свободных слотов (30-мин шаг)
- 🔲 Сводка внизу при выборе: услуга + дата + время + цена
- 🔲 MainButton «Подтвердить запись»
- **Файлы:** `tg-app/js/screens/booking.js`
- **Агент:** `general-purpose` — Vanilla JS, Supabase SDK, Telegram WebApp SDK

### 2.2. Создание записи → Supabase + уведомление
- 🔲 INSERT в bookings (client_id, service_id, master_id, date, time, status=pending)
- 🔲 POST /bookings/notify (Edge Function → VPS → бот мастеру)
- 🔲 Переход на экран success.js с анимацией
- **Файлы:** `tg-app/js/screens/booking.js`, `tg-app/js/screens/success.js`
- **Агент:** `general-purpose`

### 2.3. Экран «Мои записи» — реальные данные
- 🔲 Загрузка bookings WHERE client_telegram_id = current_user
- 🔲 Разделение: «Предстоящие» / «Прошедшие»
- 🔲 Карточки: услуга, дата, статус (цветовой индикатор)
- 🔲 Кнопка «Отменить» с подтверждением (showConfirm)
- 🔲 Логика: если <24ч — предупреждение, если >24ч — простое подтверждение
- 🔲 При отмене: UPDATE status, POST уведомление мастеру
- 🔲 Кнопка «Повторить запись» для прошедших
- **Файлы:** `tg-app/js/screens/records.js`
- **Агент:** `general-purpose`

### 2.4. Экран каталога — строка доверия
- 🔲 Подсчёт количества завершённых bookings мастера
- 🔲 Ближайший свободный слот
- 🔲 Отображение: «247 записей, ближайшее завтра 14:00»
- **Файлы:** `tg-app/js/screens/catalog.js`
- **Агент:** `general-purpose`

---

## Спринт 3: Мастер — дашборд и управление записями (MVP)

> Цель: решить боль #3 (хаос) и #8 (выгорание)
> Агент: general-purpose (Vanilla JS, фронтенд)

### 3.1. Дашборд — реальные данные
- 🔲 Ссылка на бота мастера + кнопка «Скопировать» (clipboard API + haptic)
- 🔲 Секция «Ближайшие записи»: bookings на сегодня/завтра
- 🔲 Кнопки «Подтвердить» / «Отклонить» для pending записей
- 🔲 Сетка быстрых действий: Услуги (N), Фото (N), График, Профиль
- 🔲 Подсказки: «Добавьте фото — клиенты записываются на 40% чаще»
- **Файлы:** `tg-app/js/screens/dashboard.js`
- **Агент:** `general-purpose`

### 3.2. Список записей мастера — фильтры
- 🔲 Три таба: «Новые (N)» / «Все» / «Прошлые»
- 🔲 Группировка по датам: «Сегодня», «Завтра», «10 марта»
- 🔲 Карточки: время, имя клиента, услуга, статус
- 🔲 Кнопки «Подтвердить» / «Отклонить» для pending
- 🔲 Обновление статуса через Supabase + уведомление клиенту через бот
- **Файлы:** `tg-app/js/screens/master-bookings.js`
- **Агент:** `general-purpose`

### 3.3. Управление расписанием — day_offs
- 🔲 Быстрое действие «Не работаю завтра» (тоггл)
- 🔲 Сохранение конкретной даты в массив day_offs
- 🔲 Клиенты не видят эти даты в выборе слотов
- **Файлы:** `tg-app/js/screens/master-schedule.js`
- **Агент:** `general-purpose`

### 3.4. «Посмотреть как клиент»
- 🔲 Кнопка на дашборде → открывает catalog.js с данными мастера
- 🔲 BackButton возвращает на дашборд
- **Файлы:** `tg-app/js/screens/dashboard.js`, `tg-app/js/screens/catalog.js`
- **Агент:** `general-purpose`

---

## Спринт 4: Бот — приветствие и автонастройка (MVP)

> Цель: решить боль #4 (сложность) и #6 (привлечение)
> Агент: general-purpose (Python VPS + Edge Functions)

### 4.1. Приветствие с inline-кнопками
- 🔲 /start → сообщение: имя мастера, специализация, адрес
- 🔲 Inline-кнопки: «Каталог» (Mini App), «Мои записи» (Mini App), «Связаться» (ссылка)
- 🔲 Данные из master_profiles через Supabase
- **Файлы:** VPS: `handlers/commands.py`
- **Агент:** `general-purpose`

### 4.2. Автонастройка бота при подключении
- 🔲 После bots-connect: setChatMenuButton, setMyCommands, setMyDescription, setMyShortDescription
- 🔲 Данные для описания из master_profiles (имя, специализация)
- 🔲 Уже частично реализовано в Edge Function bots-connect — проверить и дополнить
- **Файлы:** Supabase: `supabase/functions/bots-connect/index.ts`
- **Агент:** `general-purpose`

### 4.3. Deep-link из оффера
- 🔲 Модалка генерирует ссылку: `t.me/{bot_username}?start=ref_{client_id}`
- 🔲 /start ref_XXX → бот показывает «Вас пригласила {имя}. Скидка 15%»
- 🔲 Сохранение referral_source в clients
- **Файлы:** VPS: `handlers/commands.py`, Frontend: `tg-app/js/screens/offer.js`
- **Агент:** `general-purpose`

---

## Спринт 5: UX-улучшения (MVP polish)

> Цель: довести MVP до production-quality
> Агент: general-purpose (Vanilla JS + CSS)

### 5.1. Скелетоны при загрузке данных
- 🔲 Компонент skeleton-loader для карточек услуг, записей, фото
- 🔲 Показывать при fetch из Supabase, скрывать при получении
- **Файлы:** `tg-app/css/style.css`, `tg-app/js/screens/*.js`
- **Агент:** `general-purpose`

### 5.2. Pull-to-refresh
- 🔲 На экранах каталога, записей, дашборда
- 🔲 Жест свайп вниз → перезагрузка данных из Supabase
- 🔲 HapticFeedback при начале и завершении
- **Файлы:** `tg-app/js/utils/pull-refresh.js`
- **Агент:** `general-purpose`

### 5.3. Обработка ошибок сети
- 🔲 При fetch error → показать toast «Нет соединения, попробуйте снова»
- 🔲 Retry-кнопка на экранах с данными
- 🔲 Offline-state: показать кешированные данные если есть
- **Файлы:** `tg-app/js/api.js`, `tg-app/js/utils/toast.js`
- **Агент:** `general-purpose`

### 5.4. Реальные фото вместо плейсхолдеров
- 🔲 Убрать градиентные заглушки из CSS
- 🔲 Загрузка из Supabase Storage (public URLs)
- 🔲 Lazy loading для фото портфолио
- **Файлы:** `tg-app/css/style.css`, `tg-app/js/screens/catalog.js`
- **Агент:** `general-purpose`

---

## Спринт 6: v1.1 — Удержание клиентов

> Цель: решить боль #7 (нет клиентской базы) и повысить LTV
> Агенты: general-purpose (Python VPS + Vanilla JS)

### 6.1. Комментарий к записи
- 🔲 Textarea на экране booking.js (перед MainButton)
- 🔲 Сохранение в bookings.client_comment
- 🔲 Отображение в уведомлении мастеру и в карточке записи
- **Файлы:** `tg-app/js/screens/booking.js`, VPS: `handlers/booking_notify.py`
- **Агент:** `general-purpose`

### 6.2. Карточка клиента с историей
- 🔲 Тап на имя клиента в master-bookings → карточка
- 🔲 Имя, Telegram, количество визитов, общая сумма
- 🔲 Список прошлых записей (дата + услуга)
- **Файлы:** `tg-app/js/screens/client-card.js` (новый экран)
- **Агент:** `general-purpose`

### 6.3. Утренняя сводка для мастера
- 🔲 Cron в 08:00: выборка bookings на сегодня для каждого мастера
- 🔲 Бот мастеру: «Сегодня 3 записи: 10:00 — Мария, маникюр...»
- 🔲 Если нет записей: «Сегодня свободный день»
- **Файлы:** VPS: `cron/morning_summary.py`
- **Агент:** `general-purpose`

### 6.4. Напоминание о повторной записи
- 🔲 Cron ежедневно: completed bookings WHERE completed_at + N дней = today
- 🔲 N по умолчанию: маникюр — 21, стрижка — 30, окрашивание — 45
- 🔲 Бот клиенту: «Пора обновить маникюр? Запишитесь к {мастер}»
- 🔲 Кнопка «Записаться» (Mini App)
- **Файлы:** VPS: `cron/repeat_reminders.py`
- **Агент:** `general-purpose`

### 6.5. Лист ожидания
- 🔲 Кнопка «Уведомить, если освободится» на booking.js (когда нет слотов)
- 🔲 Новая таблица waitlist (client_id, master_id, preferred_date, service_id)
- 🔲 При отмене записи → проверить waitlist → бот клиенту: «Освободилось время!»
- **Файлы:** Supabase: миграция, `tg-app/js/screens/booking.js`, VPS: `handlers/waitlist.py`
- **Агент:** `general-purpose`

### 6.6. Экран дохода за период
- 🔲 На дашборде: блок «Доход за неделю: X руб.»
- 🔲 Тап → экран с графиком (столбчатая диаграмма, 8 недель)
- 🔲 Под графиком: записей, средний чек, топ-услуга
- **Файлы:** `tg-app/js/screens/master-income.js` (новый экран)
- **Агент:** `general-purpose`

### 6.7. Управление выходными (календарь)
- 🔲 Мини-календарь на месяц в master-schedule.js
- 🔲 Тап на дату = пометить выходным
- 🔲 Выбор диапазона (для отпуска)
- 🔲 Предупреждение при наличии записей на выбранную дату
- **Файлы:** `tg-app/js/screens/master-schedule.js`
- **Агент:** `general-purpose`

---

## Спринт 7: v2.0 — Монетизация

> Цель: доход от подписок мастеров
> Агент: general-purpose (Edge Functions + Python VPS + Vanilla JS)

### 7.1. YooKassa: создание платежа
- 🔲 Edge Function: payments/yookassa/create
- 🔲 Возвращает confirmation_url → фронтенд открывает в браузере
- **Файлы:** Supabase: `supabase/functions/payments-yookassa-create/`
- **Агент:** `general-purpose`

### 7.2. YooKassa: webhook обработки оплаты
- 🔲 Edge Function: payments/yookassa/webhook
- 🔲 Проверка подписи, обновление subscriptions + masters.plan
- 🔲 Уведомление мастеру + Дмитрию через бот
- **Файлы:** Supabase: `supabase/functions/payments-yookassa-webhook/`
- **Агент:** `general-purpose`

### 7.3. Telegram Stars: инвойс + оплата
- 🔲 Edge Function: payments/stars/create — sendInvoice через платформенного бота
- 🔲 VPS: обработка pre_checkout_query и successful_payment
- 🔲 Обновление подписки, уведомления
- **Файлы:** Supabase: `supabase/functions/payments-stars-create/`, VPS: `handlers/payments.py`
- **Агент:** `general-purpose`

### 7.4. UI выбора плана
- 🔲 Экран plan-select.js: карточки Free / Pro / Premium
- 🔲 Сравнительная таблица фич
- 🔲 Кнопки «Оплатить картой» / «Оплатить Stars»
- **Файлы:** `tg-app/js/screens/plan-select.js` (новый экран)
- **Агент:** `general-purpose`

### 7.5. Ограничения по плану в UI
- 🔲 Замочки на услугах is_over_limit в master-services.js
- 🔲 Кнопка «Добавить услугу» → disabled + подсказка «Продлите подписку»
- 🔲 Лимиты фото портфолио (10 / 50 / безлимит)
- **Файлы:** `tg-app/js/screens/master-services.js`, `tg-app/js/screens/master-portfolio.js`
- **Агент:** `general-purpose`

### 7.6. Онлайн-предоплата за запись (для мастера)
- 🔲 Тоггл «Предоплата» в настройках мастера
- 🔲 % от цены или фиксированная сумма
- 🔲 Клиент: кнопка «Оплатить» перед подтверждением записи
- 🔲 Stars через платформенного бота
- **Файлы:** `tg-app/js/screens/master-profile.js`, `tg-app/js/screens/booking.js`
- **Агент:** `general-purpose`

---

## Спринт 8: White-Label + Admin

> Агент: general-purpose (Vanilla JS + Edge Functions)

### 8.1. Темы оформления (Premium)
- 🔲 Экран выбора темы: rose, lavender, gold, dark, mint
- 🔲 Динамическое применение CSS-переменных из themes
- 🔲 Предпросмотр в реальном времени
- **Файлы:** `tg-app/js/screens/master-theme.js` (новый), `tg-app/css/style.css`
- **Агент:** `general-purpose`

### 8.2. Логотип и брендинг (Premium)
- 🔲 Загрузка логотипа через Supabase Storage (bucket: logos)
- 🔲 Поле brand_name — кастомное название вместо имени мастера
- 🔲 Убирать/показывать «Powered by» по плану
- **Файлы:** `tg-app/js/screens/master-profile.js`
- **Агент:** `general-purpose`

### 8.3. Admin-страница для Дмитрия
- 🔲 Отдельная страница /admin на Vercel
- 🔲 Telegram Login Widget + проверка в admins
- 🔲 Edge Function admin/stats: мастера, выручка, подписки
- 🔲 UI: карточки + таблица мастеров + график выручки
- 🔲 Кнопки: продлить/отменить подписку вручную
- **Файлы:** `tg-app/admin/index.html`, Supabase: `supabase/functions/admin-stats/`
- **Агент:** `general-purpose`

---

## Инструкции для агентов

> Какой агент запускать для каждого типа задач

| Тип задачи | Агент | Модель | Контекст для промпта |
|------------|-------|--------|---------------------|
| Python VPS (бот, cron) | `general-purpose` | sonnet | «Прочитай VPS-сервер в /opt/beauty-bot/, структуру handlers/, cron/. Стек: Python 3.11, aiohttp, Supabase REST API. Шифрование: AES-256» |
| Edge Functions (Deno/TS) | `general-purpose` | sonnet | «Прочитай supabase/functions/. Стек: Deno, TypeScript, Supabase client. JWT-авторизация через auth-telegram» |
| Frontend (Vanilla JS) | `general-purpose` | sonnet | «Прочитай tg-app/js/. Стек: ES Modules, без фреймворков, Supabase SDK через esm.sh, Telegram WebApp SDK. Роутер: router.js» |
| CSS/дизайн | `general-purpose` | sonnet | «Прочитай tg-app/css/style.css. БЭМ-подобное именование, CSS-переменные --tg-theme-*, тёмная тема авто» |
| Исследование/планирование | `general-purpose` | opus | «Прочитай CLAUDE.md, FEATURES.md, BACKEND-PLAN.md для полного контекста» |
| Быстрые правки | `general-purpose` | haiku | «Простая правка в одном файле» |

### Шаблон промпта для агента

```
Проект: tg-beauty-catalog (Telegram Mini App для бьюти-мастеров)

Прочитай:
- /Users/.../tg-beauty-catalog/CLAUDE.md (архитектура)
- /Users/.../tg-beauty-catalog/FEATURES.md (фичи)
- [файлы конкретной задачи]

Задача: [описание из плана]

Требования:
- Vanilla JS, ES Modules, без фреймворков
- Supabase для данных (api.js уже есть)
- Комментарии на русском
- Именование: camelCase для экранов, kebab-case для файлов
```

---

## Спринт 9: Лендинг для привлечения мастеров

> Цель: конвертировать мастеров в пользователей платформы
> Источник идеи: анализ GlowUp Beauty Hub (конкурент)
> Агент: general-purpose (HTML + CSS + JS или React)

### 9.1. Hero-секция с CTA
- 🔲 Полноэкранный баннер: заголовок «Онлайн-запись прямо в Telegram»
- 🔲 Подзаголовок: решает 3 боли мастера (переписки, no-show, хаос)
- 🔲 CTA-кнопка «Попробовать бесплатно» → открывает @Beauty_100master_bot
- 🔲 Статистика: «X мастеров уже подключились»
- **Файлы:** `tg-app/landing/index.html` или отдельная страница на Vercel
- **Агент:** `general-purpose`

### 9.2. Секция «Боли мастера»
- 🔲 4 карточки: «Клиенты спрашивают цены в ЛС», «Забывают прийти», «Записи в 5 мессенджерах», «Нет клиентской базы»
- 🔲 Каждая боль → решение платформы
- 🔲 Иконки + анимация появления
- **Файлы:** тот же лендинг
- **Агент:** `general-purpose`

### 9.3. Секция «Как это работает»
- 🔲 3 шага: 1) Подключи бота за 2 мин → 2) Добавь услуги и расписание → 3) Отправь ссылку клиентам
- 🔲 Скриншоты/мокапы Mini App
- 🔲 Видео-демо (опционально, позже)
- **Файлы:** тот же лендинг
- **Агент:** `general-purpose`

### 9.4. Секция «Что получает мастер»
- 🔲 6 фич с иконками: онлайн-каталог, автозапись, напоминания, портфолио, статистика, бот с вашим именем
- 🔲 Анимация каскадного появления
- **Файлы:** тот же лендинг
- **Агент:** `general-purpose`

### 9.5. Тарифы
- 🔲 Карточки Free / Pro: сравнительная таблица фич
- 🔲 Free: до 5 услуг, 10 фото, базовые напоминания
- 🔲 Pro: 699 ₽/мес — безлимит услуг, фото, аналитика, темы
- 🔲 CTA «Начать бесплатно» под каждым тарифом
- **Файлы:** тот же лендинг
- **Агент:** `general-purpose`

### 9.6. Отзывы + FAQ
- 🔲 3-4 отзыва мастеров (на старте — фейковые, потом реальные)
- 🔲 FAQ-аккордеон: 5-6 вопросов (нужно ли скачивать, как клиенты записываются, сколько стоит, что если я новичок)
- 🔲 Финальный CTA-блок: «Подключите за 2 минуты»
- **Файлы:** тот же лендинг
- **Агент:** `general-purpose`

### 9.7. Техническое
- 🔲 Адаптивная вёрстка (mobile-first)
- 🔲 SEO-мета: title, description, OG-теги для шеринга
- 🔲 Деплой на Vercel (отдельный route или поддомен)
- 🔲 Аналитика: Yandex Metrika или простой счётчик кликов
- **Файлы:** конфиг Vercel, мета-теги
- **Агент:** `general-purpose`

---

## Спринт 10: Колесо скидок (геймификация)

> Цель: повысить вовлечение клиентов и конверсию в запись
> Источник идеи: анализ GlowUp Beauty Hub (SpinWheel)
> Агент: general-purpose (Vanilla JS + Canvas)

### 10.1. Canvas-колесо на клиентском экране
- 🔲 8 сегментов с призами (скидки 5-15%, подарок, бесплатная услуга)
- 🔲 Анимация вращения: requestAnimationFrame, ease-out ~4 сек
- 🔲 Результат с генерацией промокода (GLOW5, GLOW10, GLOW15 и т.д.)
- 🔲 Одна попытка: результат в localStorage, повторное вращение заблокировано
- 🔲 HapticFeedback при остановке колеса
- **Файлы:** `tg-app/js/screens/spin-wheel.js` (новый экран), `tg-app/css/style.css`
- **Агент:** `general-purpose`

### 10.2. Интеграция в каталог
- 🔲 Плавающая кнопка «Крути колесо» на экране catalog.js (если ещё не крутил)
- 🔲 После выигрыша: баннер «У вас промокод: GLOW10 — скидка 10%» на каталоге
- 🔲 Переход на spin-wheel.js по тапу на кнопку
- **Файлы:** `tg-app/js/screens/catalog.js`
- **Агент:** `general-purpose`

### 10.3. Применение промокода при бронировании
- 🔲 На экране booking.js: поле ввода промокода или автоподстановка из localStorage
- 🔲 Пересчёт цены со скидкой: зачёркнутая старая + новая
- 🔲 Сохранение промокода в bookings (поле promo_code, discount_percent)
- 🔲 Миграция Supabase: добавить поля promo_code, discount_percent в bookings
- **Файлы:** `tg-app/js/screens/booking.js`, Supabase миграция
- **Агент:** `general-purpose`

### 10.4. Настройка призов мастером
- 🔲 Секция «Колесо скидок» в master-profile.js или отдельный экран
- 🔲 Тоггл «Включить колесо скидок» (по умолчанию выкл)
- 🔲 Редактирование 8 сегментов: текст + тип (процент/подарок/услуга) + значение
- 🔲 Таблица Supabase: spin_wheel_config (master_id, segments JSON, is_active)
- 🔲 Миграция: новая таблица spin_wheel_config
- **Файлы:** `tg-app/js/screens/master-profile.js` или `tg-app/js/screens/master-wheel.js`, Supabase миграция
- **Агент:** `general-purpose`

---

## Спринт 11: Квиз-подборщик процедур

> Цель: помочь клиенту выбрать услугу, повысить конверсию
> Источник идеи: анализ GlowUp Beauty Hub (QuizSection)
> Агент: general-purpose (Vanilla JS)

### 11.1. Экран квиза (5 вопросов)
- 🔲 Новый экран quiz.js с пошаговым прохождением
- 🔲 Вопрос 1: «Что хотите обновить?» — варианты из категорий услуг мастера
- 🔲 Вопрос 2: «Какой стиль предпочитаете?» — классика / яркий / натуральный
- 🔲 Вопрос 3: «Сколько времени готовы потратить?» — до 1ч / 1-2ч / без ограничений
- 🔲 Вопрос 4: «Бюджет?» — до 2000 / 2000-5000 / без лимита
- 🔲 Вопрос 5: «Когда хотите записаться?» — сегодня / на неделе / заранее
- 🔲 Прогресс-бар (5 шагов)
- 🔲 Анимация переходов между вопросами
- **Файлы:** `tg-app/js/screens/quiz.js` (новый экран), `tg-app/css/style.css`
- **Агент:** `general-purpose`

### 11.2. Алгоритм рекомендаций
- 🔲 Фильтрация услуг мастера по ответам: категория + длительность + цена
- 🔲 Сортировка по релевантности (совпадение по нескольким критериям)
- 🔲 Результат: 2-3 подходящие услуги с фото, ценой, длительностью
- 🔲 Кнопка «Записаться» у каждой рекомендации → booking.js с предвыбранной услугой
- 🔲 Кнопка «Пройти снова» для повторного прохождения
- **Файлы:** `tg-app/js/screens/quiz.js`
- **Агент:** `general-purpose`

### 11.3. Интеграция в каталог
- 🔲 Кнопка «Не знаете что выбрать? Пройдите квиз» на catalog.js
- 🔲 Размещение: после портфолио, перед списком услуг (или баннер сверху)
- 🔲 Иконка + короткий текст, привлекающий внимание
- **Файлы:** `tg-app/js/screens/catalog.js`
- **Агент:** `general-purpose`

### 11.4. Настройка квиза мастером (опционально)
- 🔲 Тоггл «Показывать квиз клиентам» в настройках
- 🔲 Вопросы генерируются автоматически из категорий услуг мастера
- 🔲 Если у мастера <3 услуг — квиз скрыт (нет смысла)
- **Файлы:** `tg-app/js/screens/master-profile.js`
- **Агент:** `general-purpose`

---

## Завершено

- ✅ 2026-03-02 — MVP прототип: фронтенд + бот + деплой
- ✅ 2026-03-03 — Supabase: 10 таблиц, RLS, Storage
- ✅ 2026-03-04 — VPS: beauty.mcdenil.com, nginx, SSL, systemd, cron
- ✅ 2026-03-05 — Edge Functions: auth, bots-connect/disconnect, services-check-limit, bookings-notify
- ✅ 2026-03-07 — Frontend → Supabase: CRUD, auth, api.js
- ✅ 2026-03-08 — Desk research болей мастеров (PAIN-POINTS-RESEARCH.md)
- ✅ 2026-03-08 — Функциональные требования (FEATURES.md)

---

Обозначения: ✅ готово | 🔲 в очереди | 🚧 в работе | 🐛 баг
