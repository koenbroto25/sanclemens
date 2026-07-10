-- Migration 044: Create admin registrations and activations tables
CREATE TABLE public.admin_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    role_requested TEXT NOT NULL,
    lingkungan_slug TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    approved_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.admin_activations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    password_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optional: add foreign key constraints if not already present
ALTER TABLE public.admin_registrations
    ADD CONSTRAINT fk_admin_registrations_approved_by
    FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.admin_activations
    ADD CONSTRAINT fk_admin_activations_user
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;