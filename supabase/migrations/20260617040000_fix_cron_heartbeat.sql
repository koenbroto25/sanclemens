ALTER TABLE cron_heartbeat ADD COLUMN IF NOT EXISTS last_run TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE cron_heartbeat ADD COLUMN IF NOT EXISTS job_name TEXT DEFAULT 'morning_check';
INSERT INTO cron_heartbeat (last_run, job_name) VALUES (NOW(), 'morning_check') ON CONFLICT DO NOTHING;