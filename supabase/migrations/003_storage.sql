-- ============================================================
-- Миграция 003: Supabase Storage — бакеты и политики
-- Запустить ПОСЛЕ миграции 002_rls.sql
-- ============================================================
-- Бакеты:
--   portfolio — фото работ мастеров (публичные)
--   logos     — логотипы White-Label (публичные)
--   avatars   — аватары мастеров (публичные)
-- ============================================================

-- Создаём бакеты (если не существуют)
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('portfolio', 'portfolio', true),
  ('logos',     'logos',     true),
  ('avatars',   'avatars',   true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PORTFOLIO бакет
-- Структура: portfolio/{master_id}/{filename}
-- ============================================================

-- Мастер загружает только в свою папку
CREATE POLICY "master_upload_portfolio"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'portfolio'
    AND (storage.foldername(name))[1] = (
      SELECT id::text FROM masters
      WHERE telegram_id::text = (auth.jwt() ->> 'sub')
      LIMIT 1
    )
  );

-- Мастер удаляет только свои фото
CREATE POLICY "master_delete_portfolio"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'portfolio'
    AND (storage.foldername(name))[1] = (
      SELECT id::text FROM masters
      WHERE telegram_id::text = (auth.jwt() ->> 'sub')
      LIMIT 1
    )
  );

-- Все могут читать (публичный бакет)
CREATE POLICY "public_read_portfolio"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'portfolio');

-- ============================================================
-- LOGOS бакет
-- Структура: logos/{master_id}/{filename}
-- ============================================================

CREATE POLICY "master_upload_logo"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1] = (
      SELECT id::text FROM masters
      WHERE telegram_id::text = (auth.jwt() ->> 'sub')
      LIMIT 1
    )
  );

CREATE POLICY "master_delete_logo"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1] = (
      SELECT id::text FROM masters
      WHERE telegram_id::text = (auth.jwt() ->> 'sub')
      LIMIT 1
    )
  );

CREATE POLICY "public_read_logos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'logos');

-- ============================================================
-- AVATARS бакет
-- Структура: avatars/{master_id}/{filename}
-- ============================================================

CREATE POLICY "master_upload_avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (
      SELECT id::text FROM masters
      WHERE telegram_id::text = (auth.jwt() ->> 'sub')
      LIMIT 1
    )
  );

CREATE POLICY "master_update_avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (
      SELECT id::text FROM masters
      WHERE telegram_id::text = (auth.jwt() ->> 'sub')
      LIMIT 1
    )
  );

CREATE POLICY "public_read_avatars"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');
