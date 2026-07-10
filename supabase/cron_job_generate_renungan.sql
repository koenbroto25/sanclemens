-- This cron job is scheduled to run every Sunday at 20:00 WITA (12:00 UTC).
-- It triggers the /api/cron/generate-renungan API route to generate daily meditations
-- for the upcoming week and initiate the curation process.

SELECT cron.schedule(
    'generate-renungan',
    '0 12 * * 0', -- Run at 12:00 UTC every Sunday (20:00 WITA)
    'SELECT net.http_post(
        url:=''https://[YOUR_DOMAIN_HERE]/api/cron/generate-renungan'',
        headers:=''{"Authorization":"Bearer [CRON_SECRET_HERE]"}''
    )'
);

-- IMPORTANT:
-- 1. Replace `[YOUR_DOMAIN_HERE]` with your actual application domain.
-- 2. Replace `[CRON_SECRET_HERE]` with the secret key configured in your environment
--    variables (e.g., `CRON_SECRET`). This secret is used to authenticate the cron job request.
-- 3. Ensure the 'net' extension is enabled in your Supabase project (Extensions -> net).