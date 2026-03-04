# Supabase — Инструкция по запуску

## Шаг 1: Создать проект Supabase

1. Зайти на https://app.supabase.com
2. Нажать **New project**
3. Заполнить:
   - **Name:** `tg-beauty-catalog`
   - **Database Password:** придумать надёжный пароль, сохранить в `.env`
   - **Region:** выбрать ближайший (Europe West — Frankfurt)
4. Дождаться создания проекта (~2 минуты)

---

## Шаг 2: Запустить миграции (по порядку!)

Перейти: **SQL Editor → New Query**

Запускать файлы строго по порядку:

### 001 — Таблицы
Открыть `migrations/001_tables.sql` → скопировать всё → вставить в SQL Editor → **Run**

Ожидаемый результат: `Success. No rows returned`

### 002 — RLS политики
Открыть `migrations/002_rls.sql` → скопировать → вставить → **Run**

Ожидаемый результат: `Success. No rows returned`

### 003 — Storage бакеты
Открыть `migrations/003_storage.sql` → скопировать → вставить → **Run**

Ожидаемый результат: `Success. No rows returned`

---

## Шаг 3: Seed-данные (только для разработки)

Открыть `seed/001_demo_master.sql` → скопировать → вставить → **Run**

Создаст:
- Мастер с telegram_id = 123456789
- 5 услуг
- Расписание Пн-Пт 10-19
- Демо-клиент (telegram_id = 999888777)
- 4 тестовые записи

---

## Шаг 4: Получить ключи

Перейти: **Settings → API**

| Переменная | Где взять |
|-----------|---------|
| `SUPABASE_URL` | Project URL (вид `https://xxx.supabase.co`) |
| `SUPABASE_ANON_KEY` | `anon` `public` ключ |
| `SUPABASE_SERVICE_KEY` | `service_role` ключ (только для VPS!) |

**Добавить в `.env`:**
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...   # НЕ добавлять в фронтенд!
```

**Добавить в Vercel Environment Variables:**
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

**Добавить в Supabase Edge Functions Secrets:**
```
Перейти: Settings → Edge Functions → Add new secret
```

---

## Шаг 5: Проверить таблицы

Перейти: **Table Editor**

Должны быть видны 10 таблиц:
- masters
- master_profiles
- services
- portfolio
- schedules
- clients
- bookings
- subscriptions
- themes
- admins

---

## Шаг 6: Проверить Storage

Перейти: **Storage**

Должны быть видны 3 бакета:
- portfolio (public)
- logos (public)
- avatars (public)

---

## Шаг 7: Добавить себя как admin

После создания проекта выполнить в SQL Editor:

```sql
-- Заменить YOUR_TELEGRAM_ID на твой реальный Telegram ID
-- Узнать свой ID: написать @userinfobot в Telegram
INSERT INTO admins (telegram_id, role)
VALUES (YOUR_TELEGRAM_ID, 'superadmin');
```

---

## Структура файлов

```
supabase/
├── README.md                  # Этот файл
├── migrations/
│   ├── 001_tables.sql         # Все 10 таблиц
│   ├── 002_rls.sql            # Row Level Security политики
│   └── 003_storage.sql        # Storage бакеты и политики
└── seed/
    └── 001_demo_master.sql    # Демо-данные для тестирования
```
