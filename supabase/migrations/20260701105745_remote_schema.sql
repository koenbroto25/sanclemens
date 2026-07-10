drop view if exists "public"."admin_system_stats";

set check_function_bodies = off;

create or replace view "public"."admin_orphan_qa" as  SELECT qp.id AS qa_id,
    qp.question_variations[1] AS sample_question,
    qp.domain,
    qp.bot_access[1] AS bot_name,
    qp.created_at,
        CASE
            WHEN (akb.id IS NULL) THEN 'ORPHAN - No knowledge base entry'::text
            ELSE 'OK'::text
        END AS status
   FROM (public.qa_pairs qp
     LEFT JOIN public.ai_knowledge_base akb ON ((akb.qa_pair_id = qp.id)))
  WHERE (qp.domain = 'catechism_module'::text);


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


CREATE OR REPLACE FUNCTION public.set_embedding_outdated()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.content_for_rag IS DISTINCT FROM OLD.content_for_rag THEN
        NEW.embedding_outdated = TRUE;
    END IF;
    RETURN NEW;
END;
$function$
;

grant select on table "public"."saints_collection" to "service_role";


