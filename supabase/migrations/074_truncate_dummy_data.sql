-- ============================================
-- PHASE 0: HAPUS SEMUA DATA DUMMY
-- Migration 061 - 25 Juni 2026
-- ============================================

-- Hapus dalam urutan (respect foreign key constraints)
TRUNCATE TABLE 
  public.umat_needs,
  public.user_skills,
  public.charity_requests,
  public.charity_services,
  public.usaha_umat,
  public.sakramen_user,
  public.anggota_keluarga,
  public.keluarga,
  public.profiles
CASCADE;

-- Verifikasi
DO $$
DECLARE
  profile_count INT;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  
  IF profile_count = 0 THEN
    RAISE NOTICE 'SUCCESS: Database cleaned (0 profiles)';
  ELSE
    RAISE WARNING 'FAILED: Still % profiles in database', profile_count;
    RAISE EXCEPTION 'Cleanup failed';
  END IF;
END $$;

-- Log migration
-- INSERT INTO public._migration_log (phase, description, executed_at, success)
VALUES ('phase_0', 'truncate_dummy_data', NOW(), TRUE);