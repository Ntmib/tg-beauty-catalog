# BACKEND-PLAN.md — tg-beauty-catalog SaaS
> Версия 2.0 — исправлены все критические ошибки v1.0

## Контекст

Превратить прототип (один мастер, hardcoded данные) в SaaS-платформу:
- Любой мастер регистрируется, подключает своего бота, получает изолированный каталог
- Бесплатно: до 5 услуг. Платная подписка: безлимит + White-Label
- Оплата: YooKassa (карты РФ) + Telegram Stars (глобально)

---

## Стек

| Слой | Технология | Назначение |
|------|-----------|------------|
| Frontend | Vanilla JS + ES Modules (текущий) | Mini App в Telegram |
| БД + RLS | Supabase (PostgreSQL) | Данные, изоляция по master_id |
| Storage | Supabase Storage | Портфолио фото, логотипы |
| Edge Functions | Supabase Edge Functions (Deno/TypeScript) | Auth, bot-connect, payments |
| Webhook-сервер | Python 3.11 + aiohttp на Beget VPS | Multi-bot webhook роутинг |
| Reverse proxy | nginx + Let's Encrypt на Beget VPS | HTTPS для Telegram webhook |
| Деплой фронтенда | Vercel | Mini App + admin-страница |
| Платежи | YooKassa + Telegram Stars через ПЛАТФОРМЕННОГО бота | Подписки мастеров |
| Уведомления | Через @Beauty_100master_bot | Мастерам + себе (Дмитрию) |

---

## ИСПРАВЛЕНИЕ 1: Аутентификация — платформенный бот

### Проблема v1.0
Initdata валидировалась токеном мастерского бота. Но новый мастер ещё не подключил бота.

### Решение
Два режима валидации initData:

```
ЭТАП А (мастер ещё не подключил бота):
  initData → проверяем HMAC-SHA256 с токеном ПЛАТФОРМЕННОГО бота
  (@Beauty_100master_bot, токен в env-переменной PLATFORM_BOT_TOKEN)
  → регистрируем мастера → даём доступ в онбординг

ЭТАП Б (мастер подключил своего бота):
  initData → проверяем по bot_id из initData → находим мастера в БД
  → расшифровываем bot_token → проверяем HMAC-SHA256 с ним
  → даём полный доступ
```

### Edge Function: `POST /functions/v1/auth/telegram`

```typescript
// Псевдокод логики
const botId = extractBotIdFromInitData(initData);
let token: string;

if (botId === PLATFORM_BOT_ID) {
  // Новый мастер или клиент платформенного бота
  token = PLATFORM_BOT_TOKEN;
} else {
  // Уже подключённый мастер
  const master = await getMasterByBotId(botId);
  token = decrypt(master.bot_token_enc, ENCRYPTION_KEY);
}

verifyHmacSha256(initData, token); // Бросает ошибку если не валидно

const user = parseUser(initData);
const isMaster = await checkIsMaster(user.id); // telegram_id есть в masters?

return supabaseJwt({
  sub: user.id,
  role: isMaster ? 'master' : 'client',
  master_id: isMaster ? masterRow.id : contextMasterId,
});
```

---

## ИСПРАВЛЕНИЕ 2: Telegram Stars — только через платформенного бота

### Проблема v1.0
Stars-инвойс отправлялся через бота мастера. Но провайдер Telegram Stars настраивается один раз — только у @Beauty_100master_bot.

### Решение
Все Stars-платежи отправляются через ПЛАТФОРМЕННОГО бота (@Beauty_100master_bot).

```
Stars-оплата:
1. Мастер нажимает "Оплатить" → выбирает Stars
2. Edge Function вызывает: платформенный бот → sendInvoice мастеру
3. Telegram присылает pre_checkout_query → отвечаем ok
4. Telegram присылает successful_payment → обновляем подписку
5. Платформенный бот отправляет мастеру: "✅ Подписка Pro активирована до..."

YooKassa-оплата:
1. Мастер нажимает "Оплатить" → выбирает YooKassa
2. Edge Function создаёт платёж через YooKassa API
3. Возвращает confirmation_url → фронтенд открывает в браузере
4. После оплаты YooKassa POST /functions/v1/payments/yookassa/webhook
5. Обновляем подписку, платформенный бот уведомляет мастера
```

### Конфигурация Stars на платформенном боте
Один раз вручную:
1. @BotFather → /mybots → @Beauty_100master_bot → Payments → Stars

---

## ИСПРАВЛЕНИЕ 3: HTTPS и домен для VPS

### Проблема v1.0
Telegram требует HTTPS для webhook, но в плане был `http://IP:8080`.

### Решение — пошаговая настройка (выполняется при деплое VPS)

**Шаг 1: Купить домен**
- Рекомендую: `beauty-bot-api.ru` или `api-beauty.ru` (Reg.ru, ~200₽/год)
- Добавить A-запись: `api.yourdomain.ru → 193.42.124.57`

**Шаг 2: Установить nginx на VPS**
```bash
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
```

**Шаг 3: Конфигурация nginx**
```nginx
# /etc/nginx/sites-available/beauty-api
server {
    listen 80;
    server_name api.yourdomain.ru;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Шаг 4: SSL сертификат (Let's Encrypt)**
```bash
sudo certbot --nginx -d api.yourdomain.ru
# Автоматически обновляется каждые 90 дней
```

**Итоговый URL для webhook:**
```
https://api.yourdomain.ru/webhook/bot{bot_id}
```

**Что прописать в переменных:**
```
VPS_BASE_URL=https://api.yourdomain.ru
# Edge Function будет вызывать setWebhook с этим URL
```

---

## ИСПРАВЛЕНИЕ 4: Логика истечения подписки

### Правило downgrade (по согласованию с Дмитрием)

> Услуги сверх лимита (6+) — **скрыть от клиентов**, мастер видит их с замочком 🔒 и кнопкой "Продлить подписку"

### Схема работы

**В таблице `services` добавляем поле:**
```sql
is_over_limit  BOOLEAN DEFAULT false  -- true когда скрыта из-за downgrade
```

**Cron-задача на VPS — каждую ночь в 02:00**
```python
# /opt/beauty-bot/cron/check_subscriptions.py

async def check_and_downgrade():
    # 1. Найти всех мастеров у кого plan_expires_at + 3 дня < now() (grace period)
    expired = await supabase.get_expired_masters()

    for master in expired:
        # 2. Обновить план на 'free'
        await supabase.set_plan(master.id, 'free')

        # 3. Посчитать активные услуги
        services = await supabase.get_active_services(master.id)

        if len(services) > 5:
            # 4. Скрыть услуги с 6-й по N-ю (сортировка по sort_order)
            over_limit = services[5:]
            await supabase.mark_over_limit(over_limit)  # is_over_limit = true

        # 5. Уведомить мастера через его бот
        msg = (
            "⚠️ Ваша подписка истекла.\n\n"
            "Услуги сверх лимита скрыты от клиентов.\n"
            "Продлите подписку: [кнопка]"
        )
        await send_message(master.bot_id, master.telegram_id, msg)

async def send_expiry_warnings():
    # Найти мастеров у кого plan_expires_at = now() + 3 дня (предупреждение)
    expiring_soon = await supabase.get_expiring_in_days(3)
    for master in expiring_soon:
        await send_message(master, "⏰ Ваша подписка истекает через 3 дня...")

# Crontab:
# 0 2 * * * /usr/bin/python3 /opt/beauty-bot/cron/check_subscriptions.py
```

**RLS политика для скрытых услуг:**
```sql
-- Клиент не видит услуги помеченные is_over_limit
CREATE POLICY "client_read_active_services" ON services
  FOR SELECT
  USING (
    is_active = true
    AND is_over_limit = false
    AND master_id = current_setting('app.current_master_id')::uuid
  );

-- Мастер видит ВСЕ свои услуги (включая is_over_limit)
CREATE POLICY "master_read_own_services" ON services
  FOR SELECT
  USING (master_id = auth.uid());
```

**UI мастера — замочек на заблокированных услугах:**
```javascript
// В master-services.js — если услуга is_over_limit
const lockBadge = service.is_over_limit
  ? `<span class="lock-badge">🔒 Скрыта — <a href="#">продлите подписку</a></span>`
  : '';
```

**При оплате подписки — автоматически восстановить:**
```typescript
// Edge Function payments/yookassa/webhook и payments/stars/webhook
async function onPaymentSuccess(masterId: string) {
  await supabase.setPlan(masterId, 'pro', newExpiry);
  // Снять флаги is_over_limit со всех услуг мастера
  await supabase.restoreOverLimitServices(masterId);
}
```

---

## ИСПРАВЛЕНИЕ 5: Admin-панель для Дмитрия

### Что нужно
- Веб-страница со статистикой (количество мастеров, выручка, подписки, клиенты)
- Telegram-уведомления при каждой оплате

### Таблица: `admins`
```sql
id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
telegram_id  BIGINT UNIQUE NOT NULL  -- Дмитрий
role         TEXT DEFAULT 'superadmin'
created_at   TIMESTAMPTZ DEFAULT now()
```

### Admin Edge Function: `GET /functions/v1/admin/stats`
Только для telegram_id из таблицы admins (service_role).

```typescript
// Возвращает:
{
  masters_total: 142,
  masters_active_30d: 87,   // открывали Mini App за 30 дней
  subscriptions: {
    free: 98,
    pro: 31,
    premium: 13,
  },
  revenue: {
    current_month: 14700,   // рублей
    prev_month: 12400,
    total: 89200,
  },
  top_masters: [            // топ по количеству клиентов
    { name: "Анна И.", clients: 143, plan: "premium" },
    ...
  ],
  bookings_today: 28,
}
```

### Admin веб-страница
**Деплой:** отдельная страница на Vercel (`/admin`)
**Защита:** Telegram Login Widget + проверка telegram_id в таблице admins

**Страница включает:**
- Карточки: мастеров / выручка / подписки / записей сегодня
- График выручки по месяцам
- Таблица: мастера → план → кол-во клиентов → дата регистрации
- Кнопки: продлить/отменить подписку вручную

### Telegram-уведомления Дмитрию при каждой оплате

```typescript
async function notifyAdmin(master: Master, plan: string, amount: number, method: string) {
  const text = [
    `💰 Новая оплата!`,
    ``,
    `👤 Мастер: ${master.first_name} @${master.username}`,
    `📦 Тариф: ${plan}`,
    `💵 Сумма: ${amount}₽`,
    `💳 Способ: ${method}`,
    `📅 Дата: ${new Date().toLocaleDateString('ru-RU')}`,
  ].join('\n');

  await fetch(`https://api.telegram.org/bot${PLATFORM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    body: JSON.stringify({ chat_id: ADMIN_TELEGRAM_ID, text }),
  });
}
```

---

## Полная схема базы данных (9 таблиц)

### `masters`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
telegram_id     BIGINT UNIQUE NOT NULL
first_name      TEXT NOT NULL
last_name       TEXT
username        TEXT
bot_token_enc   TEXT UNIQUE                   -- AES-256
bot_id          BIGINT UNIQUE
bot_username    TEXT
is_bot_active   BOOLEAN DEFAULT false
onboarding_done BOOLEAN DEFAULT false
plan            TEXT DEFAULT 'free'           -- 'free' | 'pro' | 'premium'
plan_expires_at TIMESTAMPTZ
created_at      TIMESTAMPTZ DEFAULT now()
last_active_at  TIMESTAMPTZ
```

### `master_profiles`
```sql
master_id     UUID REFERENCES masters(id) ON DELETE CASCADE PRIMARY KEY
name          TEXT NOT NULL
specialty     TEXT[]                          -- ['nails', 'brows']
bio           TEXT
experience    TEXT
avatar_url    TEXT
city          TEXT
```

### `services`
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
master_id     UUID REFERENCES masters(id) ON DELETE CASCADE
title         TEXT NOT NULL
description   TEXT
duration      INTEGER NOT NULL                -- минуты
price         INTEGER NOT NULL                -- рубли
is_active     BOOLEAN DEFAULT true
is_over_limit BOOLEAN DEFAULT false           -- true = скрыта после downgrade
sort_order    INTEGER DEFAULT 0
created_at    TIMESTAMPTZ DEFAULT now()
```

### `portfolio`
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
master_id     UUID REFERENCES masters(id) ON DELETE CASCADE
image_url     TEXT NOT NULL
caption       TEXT
sort_order    INTEGER DEFAULT 0
created_at    TIMESTAMPTZ DEFAULT now()
```

### `schedules`
```sql
master_id     UUID REFERENCES masters(id) PRIMARY KEY
work_days     INTEGER[] NOT NULL              -- [1,2,3,4,5]
start_hour    INTEGER DEFAULT 10
end_hour      INTEGER DEFAULT 19
break_start   INTEGER
break_end     INTEGER
slot_duration INTEGER DEFAULT 30
```

### `clients`
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
master_id     UUID REFERENCES masters(id) ON DELETE CASCADE
telegram_id   BIGINT NOT NULL
first_name    TEXT
last_name     TEXT
username      TEXT
created_at    TIMESTAMPTZ DEFAULT now()
UNIQUE(master_id, telegram_id)
```

### `bookings`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
master_id       UUID REFERENCES masters(id) ON DELETE CASCADE
client_id       UUID REFERENCES clients(id)
service_id      UUID REFERENCES services(id)
booking_date    DATE NOT NULL
booking_time    TIME NOT NULL
duration        INTEGER NOT NULL
status          TEXT DEFAULT 'pending'
-- 'pending' | 'confirmed' | 'completed'
-- | 'cancelled_by_client' | 'cancelled_by_master'
client_comment  TEXT
master_comment  TEXT
created_at      TIMESTAMPTZ DEFAULT now()
```

### `subscriptions` (история платежей)
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
master_id       UUID REFERENCES masters(id) ON DELETE CASCADE
plan            TEXT NOT NULL               -- 'pro' | 'premium'
price_kopecks   INTEGER NOT NULL            -- 29900 = 299₽
payment_method  TEXT NOT NULL               -- 'yookassa' | 'stars'
external_id     TEXT                        -- ID в YooKassa или Stars payload
status          TEXT DEFAULT 'pending'      -- pending | paid | cancelled
period_start    TIMESTAMPTZ
period_end      TIMESTAMPTZ
created_at      TIMESTAMPTZ DEFAULT now()
```

### `themes`
```sql
master_id       UUID REFERENCES masters(id) PRIMARY KEY
color_scheme    TEXT DEFAULT 'rose'
-- 'rose' | 'lavender' | 'gold' | 'dark' | 'mint'
logo_url        TEXT
brand_name      TEXT
show_powered_by BOOLEAN DEFAULT true        -- false на premium
```

### `admins`
```sql
id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
telegram_id  BIGINT UNIQUE NOT NULL
role         TEXT DEFAULT 'superadmin'
created_at   TIMESTAMPTZ DEFAULT now()
```

---

## Все API эндпоинты

### Supabase Edge Functions

| Метод | Путь | Назначение | Кто вызывает |
|-------|------|-----------|-------------|
| POST | `/auth/telegram` | Валидация initData → JWT | Фронтенд при старте |
| POST | `/bots/connect` | Подключить бота мастера | Мастер (онбординг) |
| POST | `/bots/disconnect` | Отключить бота | Мастер (настройки) |
| GET | `/services/check-limit` | Можно ли добавить услугу | Фронтенд мастера |
| POST | `/payments/yookassa/create` | Создать платёж | Фронтенд мастера |
| POST | `/payments/yookassa/webhook` | Событие от YooKassa | YooKassa (внешний) |
| POST | `/payments/stars/create` | Отправить инвойс Stars | Фронтенд мастера |
| POST | `/bookings/notify` | Уведомить мастера о записи | Фронтенд после booking |
| GET | `/admin/stats` | Статистика платформы | Admin-страница |
| POST | `/admin/subscription` | Ручное изменение подписки | Admin-страница |

### VPS (Python/aiohttp)

| Метод | Путь | Назначение |
|-------|------|-----------|
| POST | `/webhook/bot{bot_id}` | Webhook от Telegram ботов |
| POST | `/notify` | Уведомления от Supabase |
| GET | `/health` | Проверка работоспособности |

---

## Монетизация

**Два тарифа (Premium убран — упрощаем):**

| Параметр | Free | Pro (699₽/мес) |
|---------|------|----------------|
| Услуг | 5 | Безлимит |
| Фото портфолио | 10 | Безлимит |
| История записей | 30 дней | 1 год |
| Grace period при просрочке | — | 3 дня |

**Оплата:** YooKassa (карты РФ, 699₽/мес)

---

## Поток регистрации мастера (детально)

```
1. Мастер открывает @Beauty_100master_bot → Menu Button
2. Mini App стартует, initData содержит bot_id = PLATFORM_BOT_ID
3. POST /auth/telegram → валидация по PLATFORM_BOT_TOKEN
4. telegram_id не найден в masters → создаём запись (plan=free)
5. Возвращаем JWT с role=master

6. ОНБОРДИНГ ШАГ 0: "Подключите вашего бота"
   → Инструкция: @BotFather → /newbot → скопировать токен
   → Поле ввода "Вставьте токен"
   → Кнопка "Подключить"
   → POST /bots/connect (токен)

7. Edge Function /bots/connect:
   a. Telegram getMe → bot_id, bot_username
   b. Проверить что бот не привязан к другому мастеру
   c. Зашифровать токен AES-256, сохранить в masters
   d. setWebhook → https://api.yourdomain.ru/webhook/bot{bot_id}
   e. setChatMenuButton → кнопка "Открыть каталог"
   f. setMyCommands → [/start, /help]
   g. setMyDescription → "Каталог мастера {name}"
   h. setMyShortDescription → "Запись онлайн"
   i. Вернуть {ok: true, bot_username: "@anna_beauty_bot"}

8. Показать "✅ @anna_beauty_bot подключён"
9. ОНБОРДИНГ ШАГ 1: Профиль
10. ОНБОРДИНГ ШАГ 2: Услуги
11. ОНБОРДИНГ ШАГ 3: Расписание
12. navigateToRoot('dashboard')
```

---

## Поток клиента (детально)

```
1. Клиент нажимает Menu в @anna_beauty_bot
2. initData содержит bot_id = anna_bot_id (мастерской бот)
3. POST /auth/telegram → bot_id → найти мастера → валидация
4. telegram_id не в clients → создать запись (master_id + telegram_id)
5. JWT с role=client, master_id = anna's UUID

6. Supabase RLS: клиент видит только services WHERE
   master_id = anna's UUID AND is_active = true AND is_over_limit = false

7. Клиент бронирует → INSERT bookings
8. POST /bookings/notify → VPS → анна получает уведомление в @anna_beauty_bot
```

---

## Порядок разработки

### Этап 1: Supabase — Инфраструктура ✅ ВЫПОЛНЕН
- [x] Создать проект Supabase (zbxbeagmqmnijkjhhcgp)
- [x] SQL: создать все 10 таблиц (включая admins)
- [x] Настроить RLS политики для всех таблиц
- [x] Создать Supabase Storage buckets: `portfolio` (public), `logos` (public)
- [x] Настроить политики Storage (мастер загружает только в свою папку `/{master_id}/`)
- [x] Добавить seed-данные для тестирования (supabase/seed/)

### Этап 2: VPS — HTTPS + webhook сервер ✅ ВЫПОЛНЕН
- [x] Купить домен, настроить A-запись → 193.42.124.57 (beauty.mcdenil.com)
- [x] Установить nginx на VPS
- [x] Получить SSL-сертификат Let's Encrypt (certbot)
- [x] Написать Python/aiohttp сервер (`/webhook/bot{id}`, `/notify`, `/health`)
- [x] Реализовать AES-256 расшифровку токена
- [x] Обработчики: /start, /start admin, /start from_app, /help, обычное сообщение
- [x] Настроить systemd-сервис (tg-beauty-catalog) для автозапуска
- [x] Написать cron-скрипт check_subscriptions.py
- [x] Настроить crontab: 02:00 каждую ночь

### Этап 3: Edge Functions — Auth + Bot Connect ✅ ВЫПОЛНЕН
- [x] `auth-telegram`: двухрежимная валидация (platform / master token) — исправлен баг с импортом
- [x] `bots-connect`: getMe → encrypt → setWebhook + все setChat* методы
- [x] `bots-disconnect`: deleteWebhook + очистка БД
- [x] `services-check-limit`: счётчик активных услуг vs план
- [x] `bookings-notify`: уведомление мастера о новой записи

### Этап 4: Frontend → Supabase ✅ ВЫПОЛНЕН
- [x] Добавить Supabase JS SDK (esm.sh CDN в supabase.js)
- [x] Создать auth.js: authenticate() → auth-telegram Edge Function
- [x] Создать api.js: полный CRUD с in-memory кешем
- [x] Заменить все экраны с hardcoded data.js на Supabase
- [x] Мастер: сохранение профиля, услуг, расписания, портфолио
- [x] Клиент: чтение услуг/портфолио через RLS
- [x] Загрузка фото в Supabase Storage
- [x] Экран онбординга Шаг 0 (подключение бота через bots-connect)
- [x] Задеплоено на Vercel: https://tg-app-khaki.vercel.app

### Этап 5: Монетизация ⏳ СЛЕДУЮЩИЙ
- [ ] Включить Stars: @BotFather → @Beauty_100master_bot → Bot Payments → Stars
- [ ] Edge Function: `payments/yookassa/create` — создание платежа YooKassa
- [ ] Edge Function: `payments/yookassa/webhook` — обработка успешной оплаты
- [ ] UI выбора плана в дашборде мастера (экран plan-select)
- [ ] Ограничения по плану в UI (кнопка "Добавить услугу" disabled + подсказка)
- [ ] Замочки на услугах is_over_limit в master-services.js
- [ ] Telegram-уведомление мастеру после успешной оплаты
- [ ] Telegram-уведомление Дмитрию после каждой оплаты

### Этап 6: White-Label ❌ ОТМЕНЁН (упрощаем — два тарифа Free/Pro)

### Этап 7: Admin-страница для Дмитрия ⏳ ПОСЛЕ МОНЕТИЗАЦИИ
- [ ] Отдельная страница `/admin` на Vercel
- [ ] Telegram Login Widget для аутентификации
- [ ] Edge Function `admin/stats` с метриками
- [ ] Edge Function `admin/subscription` для ручного управления
- [ ] UI: карточки + таблица мастеров + график выручки

---

## Переменные окружения

### Vercel (Mini App фронтенд)
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Supabase Edge Functions (Secrets)
```
PLATFORM_BOT_TOKEN=        # токен @Beauty_100master_bot
PLATFORM_BOT_ID=           # ID @Beauty_100master_bot (из getMe)
TOKEN_ENCRYPTION_KEY=      # AES-256 ключ (32 байта, hex)
YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=
VPS_BASE_URL=https://api.yourdomain.ru
VPS_NOTIFY_SECRET=         # shared secret для /notify endpoint
ADMIN_TELEGRAM_ID=         # telegram_id Дмитрия
```

### Beget VPS (.env)
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...  # service_role, ТОЛЬКО на VPS
TOKEN_ENCRYPTION_KEY=         # тот же ключ что в Supabase secrets
VPS_NOTIFY_SECRET=            # тот же secret
PORT=8080
```

---

## Безопасность

1. **initData** — всегда проверяется на сервере (Edge Function), никогда на клиенте
2. **bot_token** — шифруется AES-256, хранится в БД, расшифровывается только на VPS
3. **service_role ключ** — только на VPS, никогда на фронтенде или в Vercel
4. **RLS** — мастер физически не может прочитать данные другого мастера
5. **HMAC** между Supabase и VPS — VPS_NOTIFY_SECRET защищает /notify
6. **Admin** — проверка telegram_id в таблице admins + service_role
7. **Storage** — политики: мастер загружает только в папку `/{master_id}/`
