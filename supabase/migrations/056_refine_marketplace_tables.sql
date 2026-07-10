-- Migration 056: Refine marketplace tables for v5 Pasar Kasih
-- Ref: GDD v5 Bab 4 "Struktur Halaman & Fitur PASAR KASIH"
-- Purpose: Add FK references, indexes, and new columns for marketplace v5 requirements

-- ============================================
-- 1. ENSURE ojek_orders has proper FK to marketplace_orders
-- ============================================

-- Add FK constraint if order_id references marketplace_orders
-- (The column exists from 048 but FK may not be fully enforced)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'ojek_orders_order_id_fkey'
    ) THEN
        -- Comment only, FK will be added when marketplace_orders table exists
        -- The FK relationship is conceptual: ojek_orders serves marketplace orders
        NULL;
    END IF;
END $$;

-- Add indexes for marketplace performance
CREATE INDEX IF NOT EXISTS idx_ojek_orders_marketplace ON public.ojek_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_ojek_orders_status ON public.ojek_orders(status);
CREATE INDEX IF NOT EXISTS idx_ojek_orders_driver_status ON public.ojek_orders(driver_id, status);

-- ============================================
-- 2. ADD v5-specific columns to marketplace tables
-- ============================================

-- Add seller verification status
ALTER TABLE public.marketplace_products ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.marketplace_products ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.marketplace_products ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.marketplace_products ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
COMMENT ON COLUMN public.marketplace_products.verified IS 'Admin marketplace verification status';
COMMENT ON COLUMN public.marketplace_products.verified_by IS 'Who verified this product';
COMMENT ON COLUMN public.marketplace_products.rejection_reason IS 'Reason if product was rejected';

-- Add shipping tracking fields
ALTER TABLE public.marketplace_orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE public.marketplace_orders ADD COLUMN IF NOT EXISTS shipping_notes TEXT;
ALTER TABLE public.marketplace_orders ADD COLUMN IF NOT EXISTS ojek_driver_id UUID REFERENCES public.ojek_drivers(id);
ALTER TABLE public.marketplace_orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
COMMENT ON COLUMN public.marketplace_orders.ojek_driver_id IS 'Ojek Solidaritas driver assigned to this order';
COMMENT ON COLUMN public.marketplace_orders.delivered_at IS 'Timestamp when order was delivered';

-- Add commission tracking for marketplace
ALTER TABLE public.marketplace_orders ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE public.marketplace_orders ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 0;
COMMENT ON COLUMN public.marketplace_orders.commission_amount IS 'Commission charged by marketplace for this order';
COMMENT ON COLUMN public.marketplace_orders.commission_rate IS 'Commission rate in percentage';

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_marketplace_products_verified ON public.marketplace_products(verified);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_driver ON public.marketplace_orders(ojek_driver_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_status_date ON public.marketplace_orders(status, created_at);

-- ============================================
-- 3. ADD Klemen Kerja enhancements
-- ============================================

-- Add match_score for AI matching
ALTER TABLE public.lowongan_kerja ADD COLUMN IF NOT EXISTS match_count INTEGER DEFAULT 0;
COMMENT ON COLUMN public.lowongan_kerja.match_count IS 'Number of potential matches for this job';

ALTER TABLE public.tenaga_kerja ADD COLUMN IF NOT EXISTS match_count INTEGER DEFAULT 0;
COMMENT ON COLUMN public.tenaga_kerja.match_count IS 'Number of potential matches for this worker';

-- ============================================
-- 4. GRANTS
-- ============================================
GRANT ALL ON public.marketplace_products TO authenticated;
GRANT ALL ON public.marketplace_orders TO authenticated;
GRANT ALL ON public.ojek_drivers TO authenticated;
GRANT ALL ON public.ojek_orders TO authenticated;