drop view if exists "public"."admin_system_stats";

create or replace view "public"."admin_system_stats" as  SELECT ( SELECT count(*) AS count
           FROM public.profiles) AS total_users,
    ( SELECT count(*) AS count
           FROM public.profiles
          WHERE (profiles.access_layer >= 2)) AS total_activated_users,
    ( SELECT count(*) AS count
           FROM public.lingkungan) AS total_lingkungan,
    ( SELECT count(*) AS count
           FROM public.families) AS total_families,
    ( SELECT count(*) AS count
           FROM public.admin_registrations
          WHERE (admin_registrations.status = 'pending'::text)) AS pending_admin_registrations,
    ( SELECT count(*) AS count
           FROM public.error_logs
          WHERE (error_logs.is_resolved = false)) AS unresolved_errors;



