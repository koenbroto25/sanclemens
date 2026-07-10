-- This migration creates cron jobs for Edge Functions
-- using the pg_cron extension.

-- UP migration
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
    'wdl-consent-check-weekly',
    '0 0 * * 1',
    $$
    SELECT net.http_post(
        url := 'https://brfdzodjzoeoylbfzkry.supabase.co/functions/v1/wdl-consent-check',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyZmR6b2Rqem9lb3lsYmZ6a3J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyOTQ5OTQsImV4cCI6MjA5NTg3MDk5NH0.jReWj4d_0iD2hUtVBwZLOHfvveRkONtbLQ6qiJDtGB0'
        ),
        body := '{}'::jsonb
    );
    $$
);

SELECT cron.schedule(
    'liturgical-push-daily',
    '0 0 * * *',
    $$
    SELECT net.http_post(
        url := 'https://brfdzodjzoeoylbfzkry.supabase.co/functions/v1/liturgical-push',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyZmR6b2Rqem9lb3lsYmZ6a3J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyOTQ5OTQsImV4cCI6MjA5NTg3MDk5NH0.jReWj4d_0iD2hUtVBwZLOHfvveRkONtbLQ6qiJDtGB0'
        ),
        body := '{}'::jsonb
    );
    $$
);

SELECT cron.schedule(
    'morning-check-lansia-daily',
    '0 22 * * *',
    $$
    SELECT net.http_post(
        url := 'https://brfdzodjzoeoylbfzkry.supabase.co/functions/v1/morning-check-lansia',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyZmR6b2Rqem9lb3lsYmZ6a3J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyOTQ5OTQsImV4cCI6MjA5NTg3MDk5NH0.jReWj4d_0iD2hUtVBwZLOHfvveRkONtbLQ6qiJDtGB0'
        ),
        body := '{}'::jsonb
    );
    $$
);

SELECT cron.schedule(
    'anomaly-detector-weekly',
    '0 0 * * 1',
    $$
    SELECT net.http_post(
        url := 'https://brfdzodjzoeoylbfzkry.supabase.co/functions/v1/anomaly-detector',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyZmR6b2Rqem9lb3lsYmZ6a3J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyOTQ5OTQsImV4cCI6MjA5NTg3MDk5NH0.jReWj4d_0iD2hUtVBwZLOHfvveRkONtbLQ6qiJDtGB0'
        ),
        body := '{}'::jsonb
    );
    $$
);

SELECT cron.schedule(
    'report-generator-monthly',
    '0 22 1 * *',
    $$
    SELECT net.http_post(
        url := 'https://brfdzodjzoeoylbfzkry.supabase.co/functions/v1/report-generator',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyZmR6b2Rqem9lb3lsYmZ6a3J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyOTQ5OTQsImV4cCI6MjA5NTg3MDk5NH0.jReWj4d_0iD2hUtVBwZLOHfvveRkONtbLQ6qiJDtGB0'
        ),
        body := '{}'::jsonb
    );
    $$
);


-- DOWN migration
SELECT cron.unschedule('wdl-consent-check-weekly');
SELECT cron.unschedule('liturgical-push-daily');
SELECT cron.unschedule('morning-check-lansia-daily');
SELECT cron.unschedule('anomaly-detector-weekly');
SELECT cron.unschedule('report-generator-monthly');
