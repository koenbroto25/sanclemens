-- Migration 057: Marketplace RLS Policies for v5 Pasar Kasih
-- Ref: GDD v5 Bab 4 "Struktur Halaman & Fitur PASAR KASIH"
-- Purpose: RLS policies for buyer, seller, ojek_solidaritas, manager_marketplace, keuangan_marketplace

-- ============================================
-- 0. HELPER FUNCTION (defined first to be available for policies)
-- ============================================
CREATE OR REPLACE FUNCTION public.role_has_access(p_user_id UUID, p_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = p_user_id AND role = p_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.role_has_access(UUID, TEXT) IS 'Check if user has a specific role';

-- ============================================
-- 1. MARKETPLACE PRODUCTS RLS
-- ============================================
DO $$
BEGIN
    -- Buyers can see all active/verified products
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Buyer lihat produk aktif' AND tablename = 'marketplace_products') THEN
        CREATE POLICY "Buyer lihat produk aktif" ON public.marketplace_products
            FOR SELECT USING (
                role_has_access(auth.uid(), 'buyer') OR
                role_has_access(auth.uid(), 'umat') OR
                role_has_access(auth.uid(), 'seller')
            );
    END IF;

    -- Sellers can manage their own products
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Seller kelola produk sendiri' AND tablename = 'marketplace_products') THEN
        CREATE POLICY "Seller kelola produk sendiri" ON public.marketplace_products
            FOR ALL USING (
                role_has_access(auth.uid(), 'seller') AND
                penjual_id = auth.uid()
            ) WITH CHECK (
                penjual_id = auth.uid()
            );
    END IF;

    -- Marketplace managers can CRUD all products
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Manager marketplace CRUD semua produk' AND tablename = 'marketplace_products') THEN
        CREATE POLICY "Manager marketplace CRUD semua produk" ON public.marketplace_products
            FOR ALL USING (
                role_has_access(auth.uid(), 'manager_marketplace')
            ) WITH CHECK (
                role_has_access(auth.uid(), 'manager_marketplace')
            );
    END IF;
END $$;

-- ============================================
-- 2. MARKETPLACE ORDERS RLS
-- ============================================
DO $$
BEGIN
    -- Buyers can view and create their own orders
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Buyer kelola pesanan sendiri' AND tablename = 'marketplace_orders') THEN
        CREATE POLICY "Buyer kelola pesanan sendiri" ON public.marketplace_orders
            FOR ALL USING (
                role_has_access(auth.uid(), 'buyer') AND
                pembeli_id = auth.uid()
            ) WITH CHECK (
                pembeli_id = auth.uid()
            );
    END IF;

    -- Sellers can view orders for their products
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Seller lihat pesanan produk sendiri' AND tablename = 'marketplace_orders') THEN
        CREATE POLICY "Seller lihat pesanan produk sendiri" ON public.marketplace_orders
            FOR SELECT USING (
                role_has_access(auth.uid(), 'seller') AND
                EXISTS (SELECT 1 FROM public.marketplace_products mp WHERE mp.id = marketplace_orders.produk_id AND mp.penjual_id = auth.uid())
            );
    END IF;

    -- Marketplace managers and finance can view all orders
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Manager finance lihat semua pesanan' AND tablename = 'marketplace_orders') THEN
        CREATE POLICY "Manager finance lihat semua pesanan" ON public.marketplace_orders
            FOR SELECT USING (
                role_has_access(auth.uid(), 'manager_marketplace') OR
                role_has_access(auth.uid(), 'keuangan_marketplace')
            );
    END IF;

    -- Marketplace managers can update orders (dispute resolution, refunds)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Manager update pesanan' AND tablename = 'marketplace_orders') THEN
        CREATE POLICY "Manager update pesanan" ON public.marketplace_orders
            FOR UPDATE USING (
                role_has_access(auth.uid(), 'manager_marketplace')
            ) WITH CHECK (
                role_has_access(auth.uid(), 'manager_marketplace')
            );
    END IF;
END $$;

-- ============================================
-- 3. OJEK DRIVERS RLS
-- ============================================
DO $$
BEGIN
    -- Ojek drivers can view their own profile
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Ojek kelola profil sendiri' AND tablename = 'ojek_drivers') THEN
        CREATE POLICY "Ojek kelola profil sendiri" ON public.ojek_drivers
            FOR ALL USING (
                profile_id = auth.uid()
            ) WITH CHECK (
                profile_id = auth.uid()
            );
    END IF;

    -- Marketplace managers can view all drivers
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Manager lihat semua ojek' AND tablename = 'ojek_drivers') THEN
        CREATE POLICY "Manager lihat semua ojek" ON public.ojek_drivers
            FOR SELECT USING (
                role_has_access(auth.uid(), 'manager_marketplace')
            );
    END IF;
END $$;

-- ============================================
-- 4. OJEK ORDERS RLS (refinement from 048)
-- ============================================
DO $$
BEGIN
    -- Ojek drivers can view and update orders assigned to them
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Ojek kelola pengantaran sendiri' AND tablename = 'ojek_orders') THEN
        CREATE POLICY "Ojek kelola pengantaran sendiri" ON public.ojek_orders
            FOR ALL USING (
                driver_id IN (SELECT id FROM public.ojek_drivers WHERE profile_id = auth.uid())
            ) WITH CHECK (
                driver_id IN (SELECT id FROM public.ojek_drivers WHERE profile_id = auth.uid())
            );
    END IF;

    -- Marketplace managers can view all ojek orders
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Manager lihat semua ojek orders' AND tablename = 'ojek_orders') THEN
        CREATE POLICY "Manager lihat semua ojek orders" ON public.ojek_orders
            FOR SELECT USING (
                role_has_access(auth.uid(), 'manager_marketplace')
            );
    END IF;
END $$;

-- ============================================
-- 5. LOWONGAN KERJA & TENAGA KERJA RLS (from 048)
-- ============================================
DO $$
BEGIN
    -- All authenticated users can view job listings
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Semua user lihat lowongan' AND tablename = 'lowongan_kerja') THEN
        CREATE POLICY "Semua user lihat lowongan" ON public.lowongan_kerja
            FOR SELECT USING (auth.role() = 'authenticated');
    END IF;

    -- All authenticated users can view workers
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Semua user lihat tenaga kerja' AND tablename = 'tenaga_kerja') THEN
        CREATE POLICY "Semua user lihat tenaga kerja" ON public.tenaga_kerja
            FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

