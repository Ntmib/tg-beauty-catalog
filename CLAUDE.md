# tg-beauty-catalog — CLAUDE.md

## О проекте

Telegram Mini App — каталог бьюти-мастера (SaaS). Клиент видит услуги, портфолио, записывается онлайн. Мастер управляет каталогом, расписанием, записями.

**Бот:** @Beauty_100master_bot
**Mini App:** https://tg-app-khaki.vercel.app
**Деплой:** Vercel (статика + serverless functions)

**Модули:**
- **tg-app/** — Mini App (фронтенд + webhook бота)
- **research.md** — Маркетинговое исследование (конкуренты, экспертизы)
- **brief.md** — Техническое задание (13 экранов, wireframes, схема БД)

**Структура проекта:**
```
tg-beauty-catalog/
├── CLAUDE.md               # Этот файл
├── PLAN.md                 # План работ
├── DECISIONS.md            # Архитектурные решения
├── .env                    # Секреты (не в git)
├── .env.example            # Шаблон переменных
├── .gitignore
├── research.md             # Исследование рынка
├── brief.md                # Техническое задание
└── tg-app/                 # Mini App
    ├── CLAUDE.md           # Документация модуля
    ├── TESTING.md          # Чеклист тестирования
    ├── index.html          # Точка входа
    ├── css/style.css       # Дизайн-система (~1300 строк)
    ├── api/
    │   └── webhook.js      # Vercel Serverless — обработчик бота
    └── js/
        ├── app.js          # Инициализация, режимы, регистрация экранов
        ├── data.js         # Демо-данные (мастер, услуги, портфолио, записи)
        ├── telegram.js     # Обёртка Telegram WebApp SDK
        ├── router.js       # SPA-роутер со стеком экранов
        └── screens/        # 16 экранов
            ├── welcome.js          # Приветствие клиента
            ├── offer.js            # Модалка-оффер (скидка 15%)
            ├── catalog.js          # К1: Профиль + каталог
            ├── photo.js            # К2: Лайтбокс фото
            ├── service.js          # К3: Детали услуги
            ├── booking.js          # К4: Выбор даты/времени
            ├── success.js          # К5: Запись подтверждена
            ├── records.js          # К6: Мои записи
            ├── onboarding.js       # М0.1: Онбординг мастера
            ├── dashboard.js        # М1: Дашборд мастера
            ├── master-services.js  # М2: Управление услугами
            ├── service-edit.js     # М2.1: Редактирование услуги
            ├── master-portfolio.js # М3: Портфолио
            ├── master-schedule.js  # М4: Расписание
            ├── master-bookings.js  # М5: Записи мастера
            └── master-profile.js   # М6: Профиль мастера
```

## Tech Stack

- **Frontend:** HTML + CSS + JavaScript (ES Modules, без фреймворков)
- **Backend:** Vercel Serverless Functions (Node.js)
- **Telegram SDK:** telegram-web-app.js
- **Деплой:** Vercel (статика + API)
- **Дизайн:** CSS-переменные из Telegram ThemeParams (авто-тема)
- **Роутинг:** Кастомный SPA-роутер (стек экранов, анимации)

## Архитектура

Два режима работы:
- **Клиент** — просматривает каталог, записывается
- **Мастер** — управляет услугами, расписанием, записями

Навигация:
```
Клиент: welcome → catalog → service → booking → success
                   catalog → photo
                   catalog → records

Мастер: onboarding → dashboard → services → service-edit
                      dashboard → portfolio
                      dashboard → schedule
                      dashboard → bookings
                      dashboard → profile
                      dashboard → catalog (предпросмотр)
```

Webhook бота: `tg-app/api/webhook.js` — отвечает на /start, /help, deep-link из оффера.

## Ключевые решения

- **Без фреймворков** — прототип v1.0, максимальная скорость загрузки в Telegram
- **ES Modules** — `type="module"` без бандлера, нативный import/export
- **Vercel** — статика + serverless в одном деплое, HTTPS из коробки
- **CSS ThemeParams** — цвета из Telegram, автоматическая тёмная тема
- **localStorage** — хранение состояния (offer_shown, welcome_shown)

## Coding Conventions

- **Язык кода:** английский
- **Язык документации:** русский
- **Комментарии:** русский, в каждом файле
- **Стиль:** без фреймворков, vanilla JS, ES Modules
- **Именование экранов:** `camelCaseScreen` (catalogScreen, dashboardScreen)
- **Именование файлов:** `kebab-case.js`
- **CSS:** БЭМ-подобное именование (.card-title, .btn-primary)

## Тестирование

| Модуль | Файл тестирования |
|--------|-------------------|
| tg-app | `tg-app/TESTING.md` |

**После каждого изменения:**
1. Сборка без ошибок (открыть в браузере, проверить консоль)
2. Все экраны открываются, переходы работают
3. Прогнать чеклист из `tg-app/TESTING.md`

**При создании нового модуля:**
- Создать `TESTING.md` в корне модуля
- Добавить ссылку в таблицу выше

## Документация проекта

Каждый файл отвечает за свою область. При запросе «обновить документацию» — обновить каждый:

| Файл | Что содержит | Когда обновлять |
|------|-------------|-----------------|
| `CLAUDE.md` | Общий контекст проекта | Новый модуль, смена стека |
| `PLAN.md` | Задачи, спринты, бэклог | Завершение/добавление задач |
| `DECISIONS.md` | Архитектурные решения | Новое значимое решение |
| `tg-app/CLAUDE.md` | Документация Mini App модуля | Новый экран, изменение структуры |
| `tg-app/TESTING.md` | Чеклист тестирования Mini App | Новый функционал |

**Правила:**
- Каждый файл обновляет только свою информацию
- Не дублировать между файлами
- При добавлении модуля — добавить его файлы в таблицу

## Claude Code команды

| Команда | Что делает |
|---------|-----------|
| `/user:start` | Создать документацию для нового проекта |
| `/user:update-docs` | Обновить всю техническую документацию |
| `/user:commit` | Автокоммит |
| `/user:audit` | Аудит архитектуры |

## Commands

```bash
# Запуск локально
cd tg-app && python3 -m http.server 8080
# → http://localhost:8080

# Деплой на Vercel
cd tg-app && vercel --yes --prod

# Проверить webhook
curl https://tg-app-khaki.vercel.app/api/webhook
```

## Environment Variables

| Переменная | Описание | Где используется |
|-----------|----------|-----------------|
| `BOT_TOKEN` | Токен Telegram бота (@BotFather) | api/webhook.js (Vercel env) |
