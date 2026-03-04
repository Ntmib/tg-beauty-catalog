-- ============================================================
-- Миграция 002: Row Level Security (RLS)
-- Запустить ПОСЛЕ миграции 001_tables.sql
-- ============================================================
-- Логика:
--   Мастер видит и редактирует только свои данные.
--   Клиент видит только данные конкретного мастера (по master_id из JWT).
--   Таблица admins — только service_role (Edge Functions).
-- ============================================================

-- Включаем RLS на всех таблицах
ALTER TABLE masters          ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE services         ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio        ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules        ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients          ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins           ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Вспомогательная функция: получить master_id из JWT
-- Edge Function кладёт master_id в claim 'app_master_id'
-- ============================================================
CREATE OR REPLACE FUNCTION get_master_id_from_jwt()
RETURNS UUID AS $$
  SELECT (current_setting('request.jwt.claims', true)::jsonb ->> 'app_master_id')::uuid;
$$ LANGUAGE SQL STABLE;

-- ============================================================
-- MASTERS
-- ============================================================
-- Мастер читает только себя
CREATE POLICY "master_select_own"
  ON masters FOR SELECT
  USING (telegram_id::text = (auth.jwt() ->> 'sub'));

-- Мастер обновляет только себя
CREATE POLICY "master_update_own"
  ON masters FOR UPDATE
  USING (telegram_id::text = (auth.jwt() ->> 'sub'));

-- Вставку делает только Edge Function через service_role
-- (создание мастера происходит в auth/telegram Edge Function)

-- ============================================================
-- MASTER_PROFILES
-- ============================================================
-- Мастер читает и редактирует свой профиль
CREATE POLICY "master_select_own_profile"
  ON master_profiles FOR SELECT
  USING (master_id = (
    SELECT id FROM masters
    WHERE telegram_id::text = (auth.jwt() ->> 'sub')
    LIMIT 1
  ));

CREATE POLICY "master_insert_own_profile"
  ON master_profiles FOR INSERT
  WITH CHECK (master_id = (
    SELECT id FROM masters
    WHERE telegram_id::text = (auth.jwt() ->> 'sub')
    LIMIT 1
  ));

CREATE POLICY "master_update_own_profile"
  ON master_profiles FOR UPDATE
  USING (master_id = (
    SELECT id FROM masters
    WHERE telegram_id::text = (auth.jwt() ->> 'sub')
    LIMIT 1
  ));

-- Клиент читает профиль своего мастера
CREATE POLICY "client_select_master_profile"
  ON master_profiles FOR SELECT
  USING (master_id = get_master_id_from_jwt());

-- ============================================================
-- SERVICES
-- ============================================================
-- Мастер видит ВСЕ свои услуги (включая is_over_limit)
CREATE POLICY "master_select_own_services"
  ON services FOR SELECT
  USING (master_id = (
    SELECT id FROM masters
    WHERE telegram_id::text = (auth.jwt() ->> 'sub')
    LIMIT 1
  ));

CREATE POLICY "master_insert_service"
  ON services FOR INSERT
  WITH CHECK (master_id = (
    SELECT id FROM masters
    WHERE telegram_id::text = (auth.jwt() ->> 'sub')
    LIMIT 1
  ));

CREATE POLICY "master_update_service"
  ON services FOR UPDATE
  USING (master_id = (
    SELECT id FROM masters
    WHERE telegram_id::text = (auth.jwt() ->> 'sub')
    LIMIT 1
  ));

CREATE POLICY "master_delete_service"
  ON services FOR DELETE
  USING (master_id = (
    SELECT id FROM masters
    WHERE telegram_id::text = (auth.jwt() ->> 'sub')
    LIMIT 1
  ));

-- Клиент видит только активные услуги БЕЗ is_over_limit
CREATE POLICY "client_select_active_services"
  ON services FOR SELECT
  USING (
    master_id = get_master_id_from_jwt()
    AND is_active = true
    AND is_over_limit = false
  );

-- ============================================================
-- PORTFOLIO
-- ============================================================
-- Мастер управляет своим портфолио
CREATE POLICY "master_select_own_portfolio"
  ON portfolio FOR SELECT
  USING (master_id = (
    SELECT id FROM masters
    WHERE telegram_id::text = (auth.jwt() ->> 'sub')
    LIMIT 1
  ));

CREATE POLICY "master_insert_portfolio"
  ON portfolio FOR INSERT
  WITH CHECK (master_id = (
    SELECT id FROM masters
    WHERE telegram_id::text = (auth.jwt() ->> 'sub')
    LIMIT 1
  ));

CREATE POLICY "master_update_portfolio"
  ON portfolio FOR UPDATE
  USING (master_id = (
    SELECT id FROM masters
    WHERE telegram_id::text = (auth.jwt() ->> 'sub')
    LIMIT 1
  ));

CREATE POLICY "master_delete_portfolio"
  ON portfolio FOR DELETE
  USING (master_id = (
    SELECT id FROM masters
    WHERE telegram_id::text = (auth.jwt() ->> 'sub')
    LIMIT 1
  ));

-- Клиент читает портфолио своего мастера
CREATE POLICY "client_select_portfolio"
  ON portfolio FOR SELECT
  USING (master_id = get_master_id_from_jwt());

-- ============================================================
-- SCHEDULES
-- ============================================================
-- Мастер читает и редактирует своё расписание
CREATE POLICY "master_select_own_schedule"
  ON schedules FOR SELECT
  USING (master_id = (
    SELECT id FROM masters
    WHERE telegram_id::text = (auth.jwt() ->> 'sub')
    LIMIT 1
  ));

CREATE POLICY "master_upsert_schedule"
  ON schedules FOR ALL
  USING (master_id = (
    SELECT id FROM masters
    WHERE telegram_id::text = (auth.jwt() ->> 'sub')
    LIMIT 1
  ));

-- Клиент читает расписание (для генерации слотов)
CREATE POLICY "client_select_schedule"
  ON schedules FOR SELECT
  USING (master_id = get_master_id_from_jwt());

-- ============================================================
-- CLIENTS
-- ============================================================
-- Мастер видит список своих клиентов
CREATE POLICY "master_select_own_clients"
  ON clients FOR SELECT
  USING (master_id = (
    SELECT id FROM masters
    WHERE telegram_id::text = (auth.jwt() ->> 'sub')
    LIMIT 1
  ));

-- Клиент видит только свою запись (создаётся Edge Function через service_role)
CREATE POLICY "client_select_own"
  ON clients FOR SELECT
  USING (
    master_id = get_master_id_from_jwt()
    AND telegram_id::text = (auth.jwt() ->> 'sub')
  );

-- ============================================================
-- BOOKINGS
-- ============================================================
-- Мастер видит все записи у себя
CREATE POLICY "master_select_own_bookings"
  ON bookings FOR SELECT
  USING (master_id = (
    SELECT id FROM masters
    WHERE telegram_id::text = (auth.jwt() ->> 'sub')
    LIMIT 1
  ));

-- Мастер обновляет статус своих записей
CREATE POLICY "master_update_booking_status"
  ON bookings FOR UPDATE
  USING (master_id = (
    SELECT id FROM masters
    WHERE telegram_id::text = (auth.jwt() ->> 'sub')
    LIMIT 1
  ));

-- Клиент создаёт запись к своему мастеру
CREATE POLICY "client_insert_booking"
  ON bookings FOR INSERT
  WITH CHECK (master_id = get_master_id_from_jwt());

-- Клиент видит только свои записи у этого мастера
CREATE POLICY "client_select_own_bookings"
  ON bookings FOR SELECT
  USING (
    master_id = get_master_id_from_jwt()
    AND client_id IN (
      SELECT id FROM clients
      WHERE master_id = get_master_id_from_jwt()
        AND telegram_id::text = (auth.jwt() ->> 'sub')
    )
  );

-- Клиент может отменить свою запись (только pending → cancelled_by_client)
CREATE POLICY "client_cancel_own_booking"
  ON bookings FOR UPDATE
  USING (
    master_id = get_master_id_from_jwt()
    AND client_id IN (
      SELECT id FROM clients
      WHERE master_id = get_master_id_from_jwt()
        AND telegram_id::text = (auth.jwt() ->> 'sub')
    )
    AND status = 'pending'
  );

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
-- Мастер видит историю своих платежей
CREATE POLICY "master_select_own_subscriptions"
  ON subscriptions FOR SELECT
  USING (master_id = (
    SELECT id FROM masters
    WHERE telegram_id::text = (auth.jwt() ->> 'sub')
    LIMIT 1
  ));

-- Создание и обновление только через service_role (Edge Functions)

-- ============================================================
-- THEMES
-- ============================================================
-- Мастер читает и редактирует свою тему
CREATE POLICY "master_select_own_theme"
  ON themes FOR SELECT
  USING (master_id = (
    SELECT id FROM masters
    WHERE telegram_id::text = (auth.jwt() ->> 'sub')
    LIMIT 1
  ));

CREATE POLICY "master_upsert_theme"
  ON themes FOR ALL
  USING (master_id = (
    SELECT id FROM masters
    WHERE telegram_id::text = (auth.jwt() ->> 'sub')
    LIMIT 1
  ));

-- Клиент читает тему своего мастера
CREATE POLICY "client_select_theme"
  ON themes FOR SELECT
  USING (master_id = get_master_id_from_jwt());

-- ============================================================
-- ADMINS — только service_role (Edge Functions/VPS)
-- Обычные пользователи не могут читать эту таблицу через anon key
-- ============================================================
-- Политика намеренно отсутствует для анонимных пользователей.
-- Доступ только через service_role ключ.
