
-- Skema untuk tabel notification_templates
create table if not exists public.notification_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique, -- Kunci unik untuk template (misal: 'otp', 'sos_darurat')
  judul_template text not null,      -- Judul notifikasi
  pesan_template text not null,      -- Isi template pesan (dengan placeholder)
  tipe text not null check (tipe IN ('info', 'warning', 'critical', 'pastoral_sos')), -- Tipe pesan untuk kategori
  target_layer integer,              -- Lapisan akses target (opsional)
  created_at timestamp with time zone default now()
);

-- Tambahkan kebijakan RLS (Row Level Security)
alter table public.notification_templates enable row level security;

-- Drop existing policies if they exist (idempotent)
drop policy if exists "Super Admins can manage all notification templates" on public.notification_templates;
drop policy if exists "Authenticated users can view notification templates" on public.notification_templates;

-- Kebijakan untuk super admin (layer 9) dapat melihat dan mengelola semua template
create policy "Super Admins can manage all notification templates"
on public.notification_templates for all
using (
  (select auth.jwt() ->> 'user_metadata'::text)::jsonb ->> 'access_layer'::text = '9'
) with check (
  (select auth.jwt() ->> 'user_metadata'::text)::jsonb ->> 'access_layer'::text = '9'
);

-- Kebijakan untuk user terotentikasi dapat membaca template (jika diperlukan untuk client-side rendering atau informasi)
create policy "Authenticated users can view notification templates"
on public.notification_templates for select
using (auth.role() = 'authenticated');


INSERT INTO public.notification_templates (template_key, judul_template, pesan_template, tipe)
SELECT v.template_key, v.judul_template, v.pesan_template, v.tipe
FROM (VALUES
  ('otp', 'Kode OTP Paroki Santo Klemens', 'Kode OTP Paroki Santo Klemens: {{otp}}\n\nKode ini berlaku 5 menit. Jangan bagikan ke siapapun.', 'info'),
  ('sos_darurat', 'SOS DARURAT - Butuh Tindak Lanjut Segera!', 'SOS DARURAT\n\nNama: {{nama}}\nNo WA: {{phone}}\nLingkungan: {{lingkungan}}\nJenis: {{jenis_sos}}\nKondisi: {{kondisi}}\nWaktu: {{waktu}}\n{{#if maps_link}}Lokasi: {{maps_link}}\n{{/if}}\nSegera tindaklanjuti!', 'pastoral_sos'),
  ('gakin_submission', 'Pengajuan Data GAKIN Baru', 'Pengajuan GAKIN Baru:\n\nOleh: {{proposed_by_name}}\nKeluarga: {{family_name}}\nKondisi: {{kondisi_rumah}}\nLink Review: {{review_link}}\n\nMohon segera tinjau dan setujui.', 'info')
) AS v(template_key, judul_template, pesan_template, tipe)
WHERE NOT EXISTS (SELECT 1 FROM public.notification_templates WHERE template_key = v.template_key);

