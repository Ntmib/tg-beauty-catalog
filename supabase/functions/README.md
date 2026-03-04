# Supabase Edge Functions

## Структура

```
functions/
├── _shared/
│   ├── crypto.ts      — AES-256-GCM шифрование токенов
│   └── telegram.ts    — Telegram API + валидация initData
├── auth/telegram/     — Авторизация через Telegram initData
├── bots/connect/      — Подключение бота мастера
├── bots/disconnect/   — Отключение бота
├── services/check-limit/ — Проверка лимита услуг
└── bookings/notify/   — Уведомление мастера о записи
```

## Переменные окружения (Supabase Secrets)

Установить через: Supabase Dashboard → Settings → Edge Functions → Secrets

| Переменная | Описание |
|-----------|----------|
| `PLATFORM_BOT_TOKEN` | Токен @Beauty_100master_bot |
| `PLATFORM_BOT_ID` | ID @Beauty_100master_bot (число, из getMe) |
| `TOKEN_ENCRYPTION_KEY` | AES-256 ключ (тот же что на VPS) |
| `VPS_BASE_URL` | `https://beauty.mcdenil.com` |
| `MINI_APP_URL` | `https://tg-app-khaki.vercel.app` |
| `JWT_SECRET` | Из Supabase Settings → API → JWT Secret |

## Деплой через Supabase CLI

```bash
# Установить CLI (если нет)
brew install supabase/tap/supabase

# Войти
supabase login

# Привязать к проекту
supabase link --project-ref zbxbeagmqmnijkjhhcgp

# Задеплоить все функции
supabase functions deploy auth --no-verify-jwt
supabase functions deploy bots --no-verify-jwt
supabase functions deploy services --no-verify-jwt
supabase functions deploy bookings --no-verify-jwt

# Или конкретную:
supabase functions deploy auth/telegram --no-verify-jwt
```

## Secrets (установить один раз)

```bash
supabase secrets set PLATFORM_BOT_TOKEN=<токен>
supabase secrets set PLATFORM_BOT_ID=<id>
supabase secrets set TOKEN_ENCRYPTION_KEY=018c9ad0221800799585c7e4eded83de33f9567f062de397ef00b57aed8169b2
supabase secrets set VPS_BASE_URL=https://beauty.mcdenil.com
supabase secrets set MINI_APP_URL=https://tg-app-khaki.vercel.app
supabase secrets set JWT_SECRET=<из Supabase Settings → API>
```

## Эндпоинты

| Метод | URL | Назначение |
|-------|-----|-----------|
| POST | `/functions/v1/auth/telegram` | Авторизация → JWT |
| POST | `/functions/v1/bots/connect` | Подключить бота |
| POST | `/functions/v1/bots/disconnect` | Отключить бота |
| GET | `/functions/v1/services/check-limit` | Лимит услуг |
| POST | `/functions/v1/bookings/notify` | Уведомить мастера |
