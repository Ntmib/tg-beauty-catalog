-- ============================================================
-- Миграция 001: Создание всех таблиц
-- tg-beauty-catalog SaaS
-- ============================================================
-- Запустить в Supabase SQL Editor:
-- https://app.supabase.com → Project → SQL Editor → New Query
-- Вставить содержимое файла → Run
-- ============================================================

-- Включаем расширение для UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. MASTERS — аккаунты мастеров
-- ============================================================
CREATE TABLE masters (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id     BIGINT UNIQUE NOT NULL,
  first_name      TEXT NOT NULL,
  last_name       TEXT,
  username        TEXT,                          -- @username в Telegram
  bot_token_enc   TEXT UNIQUE,                   -- токен зашифрован AES-256
  bot_id          BIGINT UNIQUE,                 -- ID бота (из Telegram getMe)
  bot_username    TEXT,                          -- @anna_beauty_bot
  is_bot_active   BOOLEAN DEFAULT false,
  onboarding_done BOOLEAN DEFAULT false,
  plan            TEXT DEFAULT 'free'
                  CHECK (plan IN ('free', 'pro', 'premium')),
  plan_expires_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  last_active_at  TIMESTAMPTZ
);

-- ============================================================
-- 2. MASTER_PROFILES — профиль мастера
-- ============================================================
CREATE TABLE master_profiles (
  master_id     UUID PRIMARY KEY REFERENCES masters(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  specialty     TEXT[] DEFAULT '{}',             -- ['nails', 'brows']
  bio           TEXT,
  experience    TEXT,                            -- "5 лет"
  avatar_url    TEXT,                            -- Supabase Storage URL
  city          TEXT
);

-- ============================================================
-- 3. SERVICES — услуги мастера
-- ============================================================
CREATE TABLE services (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id     UUID NOT NULL REFERENCES masters(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  duration      INTEGER NOT NULL CHECK (duration > 0),  -- минуты
  price         INTEGER NOT NULL CHECK (price >= 0),    -- рубли
  is_active     BOOLEAN DEFAULT true,
  is_over_limit BOOLEAN DEFAULT false,   -- true = скрыта из-за downgrade подписки
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. PORTFOLIO — фотографии работ мастера
-- ============================================================
CREATE TABLE portfolio (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id  UUID NOT NULL REFERENCES masters(id) ON DELETE CASCADE,
  image_url  TEXT NOT NULL,              -- Supabase Storage URL
  caption    TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. SCHEDULES — расписание мастера
-- ============================================================
CREATE TABLE schedules (
  master_id     UUID PRIMARY KEY REFERENCES masters(id) ON DELETE CASCADE,
  work_days     INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}',  -- 1=Пн .. 7=Вс
  start_hour    INTEGER DEFAULT 10 CHECK (start_hour BETWEEN 0 AND 23),
  end_hour      INTEGER DEFAULT 19 CHECK (end_hour BETWEEN 0 AND 23),
  break_start   INTEGER CHECK (break_start BETWEEN 0 AND 23),
  break_end     INTEGER CHECK (break_end BETWEEN 0 AND 23),
  slot_duration INTEGER DEFAULT 30 CHECK (slot_duration IN (15, 30, 60))
);

-- ============================================================
-- 6. CLIENTS — клиенты мастера
-- (один человек может быть клиентом у нескольких мастеров)
-- ============================================================
CREATE TABLE clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id   UUID NOT NULL REFERENCES masters(id) ON DELETE CASCADE,
  telegram_id BIGINT NOT NULL,
  first_name  TEXT,
  last_name   TEXT,
  username    TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(master_id, telegram_id)             -- клиент уникален У каждого мастера
);

-- ============================================================
-- 7. BOOKINGS — записи клиентов
-- ============================================================
CREATE TABLE bookings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id      UUID NOT NULL REFERENCES masters(id) ON DELETE CASCADE,
  client_id      UUID NOT NULL REFERENCES clients(id),
  service_id     UUID NOT NULL REFERENCES services(id),
  booking_date   DATE NOT NULL,
  booking_time   TIME NOT NULL,
  duration       INTEGER NOT NULL,           -- копируется из услуги на момент записи
  status         TEXT DEFAULT 'pending'
                 CHECK (status IN (
                   'pending',
                   'confirmed',
                   'completed',
                   'cancelled_by_client',
                   'cancelled_by_master'
                 )),
  client_comment TEXT,
  master_comment TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 8. SUBSCRIPTIONS — история платежей
-- ============================================================
CREATE TABLE subscriptions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id      UUID NOT NULL REFERENCES masters(id) ON DELETE CASCADE,
  plan           TEXT NOT NULL CHECK (plan IN ('pro', 'premium')),
  price_kopecks  INTEGER NOT NULL,           -- 29900 = 299 рублей
  payment_method TEXT NOT NULL CHECK (payment_method IN ('yookassa', 'stars')),
  external_id    TEXT,                       -- ID платежа в YooKassa или Telegram
  status         TEXT DEFAULT 'pending'
                 CHECK (status IN ('pending', 'paid', 'cancelled', 'expired')),
  period_start   TIMESTAMPTZ,
  period_end     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 9. THEMES — White-Label настройки (только premium)
-- ============================================================
CREATE TABLE themes (
  master_id       UUID PRIMARY KEY REFERENCES masters(id) ON DELETE CASCADE,
  color_scheme    TEXT DEFAULT 'rose'
                  CHECK (color_scheme IN ('rose', 'lavender', 'gold', 'dark', 'mint')),
  logo_url        TEXT,                      -- Supabase Storage URL
  brand_name      TEXT,                      -- "Студия Анны" вместо "Powered by"
  show_powered_by BOOLEAN DEFAULT true       -- false убирает плашку платформы
);

-- ============================================================
-- 10. ADMINS — администраторы платформы (Дмитрий)
-- ============================================================
CREATE TABLE admins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  role        TEXT DEFAULT 'superadmin',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ИНДЕКСЫ — для быстрых запросов
-- ============================================================
CREATE INDEX idx_services_master_id     ON services(master_id);
CREATE INDEX idx_services_active        ON services(master_id, is_active, is_over_limit);
CREATE INDEX idx_portfolio_master_id    ON portfolio(master_id);
CREATE INDEX idx_clients_master_id      ON clients(master_id);
CREATE INDEX idx_bookings_master_id     ON bookings(master_id);
CREATE INDEX idx_bookings_date          ON bookings(master_id, booking_date);
CREATE INDEX idx_subscriptions_master   ON subscriptions(master_id);
CREATE INDEX idx_masters_telegram_id    ON masters(telegram_id);
CREATE INDEX idx_masters_bot_id         ON masters(bot_id);
CREATE INDEX idx_masters_plan_expires   ON masters(plan_expires_at)
  WHERE plan != 'free';
