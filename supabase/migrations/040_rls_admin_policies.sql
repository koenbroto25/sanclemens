-- Migration: RLS Policies for Admin Roles (idempotent)
-- Ref: Masterplan v4.0 Fase 7.6, GDD v4.0 BAB XXIII

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admin Paroki bisa lihat semua profil' AND tablename = 'profiles'
  ) THEN
    CREATE POLICY "Admin Paroki bisa lihat semua profil"
    ON profiles FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'admin_paroki'
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admin Paroki bisa ubah profil' AND tablename = 'profiles'
  ) THEN
    CREATE POLICY "Admin Paroki bisa ubah profil"
    ON profiles FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'admin_paroki'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'admin_paroki'
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admin Paroki bisa lihat semua keluarga' AND tablename = 'families'
  ) THEN
    CREATE POLICY "Admin Paroki bisa lihat semua keluarga"
    ON families FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'admin_paroki'
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admin Lingkungan hanya bisa lihat kegiatan lingkungan sendiri' AND tablename = 'kegiatan'
  ) THEN
    CREATE POLICY "Admin Lingkungan hanya bisa lihat kegiatan lingkungan sendiri"
    ON kegiatan FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'admin_lingkungan'
        AND (
          kegiatan.pic_id = auth.uid()
          OR kegiatan.pengaju_id = auth.uid()
        )
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admin Lingkungan hanya bisa lihat profil lingkungan sendiri' AND tablename = 'profiles'
  ) THEN
    CREATE POLICY "Admin Lingkungan hanya bisa lihat profil lingkungan sendiri"
    ON profiles FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles p2
        WHERE p2.id = auth.uid()
        AND p2.role = 'admin_lingkungan'
        AND (
          profiles.lingkungan_id = p2.lingkungan_id
          OR profiles.id = auth.uid()
        )
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admin Marketplace bisa akses produk' AND tablename = 'marketplace_products'
  ) THEN
    CREATE POLICY "Admin Marketplace bisa akses produk"
    ON marketplace_products FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'admin_marketplace'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'admin_marketplace'
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admin Marketplace bisa akses orders' AND tablename = 'marketplace_orders'
  ) THEN
    CREATE POLICY "Admin Marketplace bisa akses orders"
    ON marketplace_orders FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'admin_marketplace'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'admin_marketplace'
      )
    );
  END IF;
END $$;