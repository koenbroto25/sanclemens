drop extension if exists "pg_net";

create extension if not exists "pg_net" with schema "public";

drop policy "Admins can manage app_overview_qna" on "public"."app_overview_qna";

drop policy "Public app_overview_qna viewable by all" on "public"."app_overview_qna";

drop policy "Public learning_paths viewable by all" on "public"."learning_paths";

drop policy "Users can create own learning progress" on "public"."learning_progress_records";

drop policy "Users can update own learning progress" on "public"."learning_progress_records";

drop policy "Users can view own learning progress" on "public"."learning_progress_records";

drop policy "Pastor send surat" on "public"."surat_pastoral";

drop policy "Surat view by recipient/pastor" on "public"."surat_pastoral";

drop policy "Any user submit whistleblower" on "public"."whistleblower_reports";

drop policy "Pastor view whistleblower" on "public"."whistleblower_reports";

drop policy "theology_references_read" on "theology"."references";

drop policy "theology_references_write" on "theology"."references";

drop policy "Admin Lingkungan hanya bisa lihat profil lingkungan sendiri" on "public"."profiles";

revoke references on table "public"."app_overview_qna" from "anon";

revoke trigger on table "public"."app_overview_qna" from "anon";

revoke truncate on table "public"."app_overview_qna" from "anon";

revoke references on table "public"."app_overview_qna" from "authenticated";

revoke trigger on table "public"."app_overview_qna" from "authenticated";

revoke truncate on table "public"."app_overview_qna" from "authenticated";

revoke references on table "public"."app_overview_qna" from "service_role";

revoke trigger on table "public"."app_overview_qna" from "service_role";

revoke truncate on table "public"."app_overview_qna" from "service_role";

revoke references on table "public"."learning_paths" from "anon";

revoke trigger on table "public"."learning_paths" from "anon";

revoke truncate on table "public"."learning_paths" from "anon";

revoke references on table "public"."learning_paths" from "authenticated";

revoke trigger on table "public"."learning_paths" from "authenticated";

revoke truncate on table "public"."learning_paths" from "authenticated";

revoke references on table "public"."learning_paths" from "service_role";

revoke trigger on table "public"."learning_paths" from "service_role";

revoke truncate on table "public"."learning_paths" from "service_role";

revoke references on table "public"."learning_progress_records" from "anon";

revoke trigger on table "public"."learning_progress_records" from "anon";

revoke truncate on table "public"."learning_progress_records" from "anon";

revoke references on table "public"."learning_progress_records" from "authenticated";

revoke trigger on table "public"."learning_progress_records" from "authenticated";

revoke truncate on table "public"."learning_progress_records" from "authenticated";

revoke references on table "public"."learning_progress_records" from "service_role";

revoke trigger on table "public"."learning_progress_records" from "service_role";

revoke truncate on table "public"."learning_progress_records" from "service_role";

revoke references on table "public"."theology_references" from "anon";

revoke trigger on table "public"."theology_references" from "anon";

revoke truncate on table "public"."theology_references" from "anon";

revoke references on table "public"."theology_references" from "authenticated";

revoke trigger on table "public"."theology_references" from "authenticated";

revoke truncate on table "public"."theology_references" from "authenticated";

revoke delete on table "theology"."references" from "service_role";

revoke insert on table "theology"."references" from "service_role";

revoke references on table "theology"."references" from "service_role";

revoke select on table "theology"."references" from "service_role";

revoke trigger on table "theology"."references" from "service_role";

revoke truncate on table "theology"."references" from "service_role";

revoke update on table "theology"."references" from "service_role";

alter table "public"."ai_user_profiles" drop constraint "ai_user_profiles_preferred_learning_depth_check";

alter table "public"."app_overview_qna" drop constraint "app_overview_qna_approved_by_fkey";

alter table "public"."learning_progress_records" drop constraint "learning_progress_records_path_id_fkey";

alter table "public"."learning_progress_records" drop constraint "learning_progress_records_status_check";

alter table "public"."learning_progress_records" drop constraint "learning_progress_records_user_id_fkey";

alter table "public"."profiles" drop constraint "profiles_bot_verbosity_check";

alter table "public"."profiles" drop constraint "profiles_emotional_signal_last_session_check";

alter table "public"."profiles" drop constraint "profiles_last_active_portal_check";

alter table "public"."profiles" drop constraint "profiles_preferred_address_check";

alter table "public"."theology_references" drop constraint "theology_references_document_code_chunk_index_key";

alter table "theology"."references" drop constraint "references_approved_by_fkey";

alter table "public"."profiles" drop constraint "profiles_role_check";

drop view if exists "public"."admin_system_stats";

alter table "public"."app_overview_qna" drop constraint "app_overview_qna_pkey";

alter table "public"."learning_paths" drop constraint "learning_paths_pkey";

alter table "public"."learning_progress_records" drop constraint "learning_progress_records_pkey";

alter table "public"."theology_references" drop constraint "theology_references_pkey";

alter table "theology"."references" drop constraint "references_pkey";

drop index if exists "public"."app_overview_qna_pkey";

drop index if exists "public"."idx_app_overview_qna_embedding";

drop index if exists "public"."idx_learning_progress_path_id";

drop index if exists "public"."idx_learning_progress_user_id";

drop index if exists "public"."learning_paths_pkey";

drop index if exists "public"."learning_progress_records_pkey";

drop index if exists "public"."theology_references_document_code_chunk_index_key";

drop index if exists "public"."theology_references_pkey";

drop index if exists "theology"."references_pkey";

drop table "public"."app_overview_qna";

drop table "public"."learning_paths";

drop table "public"."learning_progress_records";

drop table "theology"."references";


  create table "public"."user_ai_recommendations" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "generated_at" timestamp with time zone not null default now(),
    "next_refresh" timestamp with time zone not null,
    "recommendations_data" jsonb not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."user_ai_recommendations" enable row level security;

alter table "public"."ai_user_profiles" drop column "learning_path_preferences";

alter table "public"."ai_user_profiles" drop column "learning_progress_summary";

alter table "public"."ai_user_profiles" drop column "preferred_learning_depth";

alter table "public"."theology_references" add column "approved_at" timestamp with time zone;

alter table "public"."theology_references" add column "approved_by" uuid;

CREATE INDEX idx_user_ai_recommendations_user_id ON public.user_ai_recommendations USING btree (user_id);

CREATE UNIQUE INDEX references_pkey ON public.theology_references USING btree (id);

CREATE UNIQUE INDEX user_ai_recommendations_pkey ON public.user_ai_recommendations USING btree (id);

CREATE UNIQUE INDEX user_ai_recommendations_user_id_key ON public.user_ai_recommendations USING btree (user_id);

alter table "public"."theology_references" add constraint "references_pkey" PRIMARY KEY using index "references_pkey";

alter table "public"."user_ai_recommendations" add constraint "user_ai_recommendations_pkey" PRIMARY KEY using index "user_ai_recommendations_pkey";

alter table "public"."theology_references" add constraint "references_approved_by_fkey" FOREIGN KEY (approved_by) REFERENCES public.profiles(id) not valid;

alter table "public"."theology_references" validate constraint "references_approved_by_fkey";

alter table "public"."user_ai_recommendations" add constraint "user_ai_recommendations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."user_ai_recommendations" validate constraint "user_ai_recommendations_user_id_fkey";

alter table "public"."user_ai_recommendations" add constraint "user_ai_recommendations_user_id_key" UNIQUE using index "user_ai_recommendations_user_id_key";

alter table "public"."profiles" add constraint "profiles_role_check" CHECK ((role = ANY (ARRAY['umat'::text, 'pastor'::text, 'vikaris'::text, 'wali_digital'::text, 'ketua_lingkungan'::text, 'sekretaris'::text, 'bendahara_ii'::text, 'bendahara_iii'::text, 'koordinator_bidang'::text, 'sub_koordinator'::text, 'wakil_ketua'::text, 'tim_audit'::text, 'operator_ict'::text, 'super_admin'::text, 'kurator_liturgis'::text, 'mitra_eksternal'::text, 'super_admin_dev'::text, 'admin_portal_1'::text, 'admin_portal_2'::text, 'wakil_ketua_lingkungan'::text, 'sekretaris_lingkungan'::text, 'bendahara_lingkungan'::text, 'seksi_liturgi'::text, 'seksi_pewartaan'::text, 'seksi_pendidikan_iman'::text, 'seksi_sosial_paroki'::text, 'seksi_sosial_lingkungan'::text, 'seksi_dana_kasih'::text, 'seksi_sarana'::text, 'buyer'::text, 'seller'::text, 'ojek_solidaritas'::text, 'manager_marketplace'::text, 'keuangan_marketplace'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_role_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.can_access_admin_module(p_user_id uuid DEFAULT auth.uid(), p_module text DEFAULT ''::text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
DECLARE
    v_role TEXT;
    v_access_layer INTEGER;
BEGIN
    SELECT role, access_layer INTO v_role, v_access_layer
    FROM public.profiles WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Super admin can access everything
    IF v_role IN ('super_admin', 'super_admin_dev', 'operator_ict') THEN
        RETURN TRUE;
    END IF;

    -- Module checks
    CASE p_module
        -- Pastoral modules (SOS, Sakramen, Lansia, Surat Pastoral)
        WHEN 'pastoral' THEN
            RETURN v_role IN ('pastor', 'vikaris') OR v_access_layer >= 5;
        
        -- Financial modules (Kolekte, RK1, RK2, RK3, Audit)
        WHEN 'keuangan' THEN
            RETURN v_role IN ('pastor', 'vikaris', 'bendahara_ii', 'bendahara_iii', 
                              'wakil_ketua', 'tim_audit', 'keuangan_marketplace') OR v_access_layer >= 6;
        
        -- User management modules (verification, activation)
        WHEN 'users' THEN
            RETURN v_role IN ('pastor', 'vikaris', 'sekretaris', 'ketua_lingkungan',
                              'sekretaris_lingkungan', 'admin_portal_1') OR v_access_layer >= 5;
        
        -- GAKIN module
        WHEN 'gakin' THEN
            RETURN v_role IN ('pastor', 'vikaris', 'wakil_ketua', 'sekretaris', 
                              'ketua_lingkungan', 'seksi_sosial_paroki', 'seksi_sosial_lingkungan') OR v_access_layer >= 5;
        
        -- Dana Kasih module
        WHEN 'dana_kasih' THEN
            RETURN v_role IN ('pastor', 'vikaris', 'wakil_ketua', 'seksi_dana_kasih') OR v_access_layer >= 5;
        
        -- Marketplace management
        WHEN 'marketplace' THEN
            RETURN v_role IN ('manager_marketplace', 'keuangan_marketplace') OR v_access_layer >= 10;
        
        -- Ads management
        WHEN 'ads' THEN
            RETURN v_role IN ('pastor', 'sekretaris', 'admin_portal_1') OR v_access_layer >= 5;
        
        ELSE
            RETURN FALSE;
    END CASE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_admin_dashboards(p_user_id uuid DEFAULT auth.uid())
 RETURNS SETOF text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
DECLARE
    v_role TEXT;
    v_access_layer INTEGER;
    v_lingkungan_slug TEXT;
    v_result TEXT;
BEGIN
    -- Get user's info
    SELECT role, access_layer, lingkungan_slug 
    INTO v_role, v_access_layer, v_lingkungan_slug
    FROM public.profiles WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- Super Admin
    IF v_role IN ('super_admin', 'super_admin_dev', 'operator_ict') THEN
        RETURN NEXT '/super-admin/dashboard';
    END IF;

    -- Pastor / Vikaris
    IF v_role IN ('pastor', 'vikaris') THEN
        RETURN NEXT '/pastor/dashboard';
        RETURN NEXT '/admin/paroki/dashboard';
    END IF;

    -- Paroki-wide admins (Layer 5+)
    IF v_access_layer >= 5 AND v_role NOT IN ('super_admin', 'super_admin_dev', 'operator_ict', 'pastor', 'vikaris') THEN
        RETURN NEXT '/admin/paroki/dashboard';
    END IF;

    -- Lingkungan/Stasi admins
    IF v_role IN ('ketua_lingkungan', 'wakil_ketua_lingkungan', 'sekretaris_lingkungan', 
                  'bendahara_lingkungan', 'admin_portal_2', 'seksi_sosial_lingkungan') THEN
        IF v_lingkungan_slug IS NOT NULL THEN
            RETURN NEXT '/admin/lingkungan/' || v_lingkungan_slug || '/dashboard';
        END IF;
    END IF;

    -- Marketplace admins
    IF v_role IN ('manager_marketplace', 'keuangan_marketplace') THEN
        RETURN NEXT '/marketplace/admin/dashboard';
    END IF;

    RETURN;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_lingkungan_slug(p_user_id uuid DEFAULT auth.uid())
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
    RETURN (
        SELECT COALESCE(lingkungan_slug, '') FROM public.profiles
        WHERE id = p_user_id
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.mark_prayer_embedding_outdated()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF OLD.prayer_name IS DISTINCT FROM NEW.prayer_name
       OR OLD.latin_text IS DISTINCT FROM NEW.latin_text
       OR OLD.indonesian_text IS DISTINCT FROM NEW.indonesian_text
       OR OLD.meaning IS DISTINCT FROM NEW.meaning THEN
        NEW.embedding_outdated = TRUE;
    END IF;
    NEW.updated_at = NOW();
    RETURN NEW;
END; $function$
;

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


grant delete on table "public"."activity_logs" to "anon";

grant insert on table "public"."activity_logs" to "anon";

grant select on table "public"."activity_logs" to "anon";

grant update on table "public"."activity_logs" to "anon";

grant delete on table "public"."activity_logs" to "authenticated";

grant insert on table "public"."activity_logs" to "authenticated";

grant select on table "public"."activity_logs" to "authenticated";

grant update on table "public"."activity_logs" to "authenticated";

grant delete on table "public"."ad_locations" to "anon";

grant insert on table "public"."ad_locations" to "anon";

grant select on table "public"."ad_locations" to "anon";

grant update on table "public"."ad_locations" to "anon";

grant delete on table "public"."ad_locations" to "authenticated";

grant insert on table "public"."ad_locations" to "authenticated";

grant select on table "public"."ad_locations" to "authenticated";

grant update on table "public"."ad_locations" to "authenticated";

grant delete on table "public"."ad_locations" to "service_role";

grant insert on table "public"."ad_locations" to "service_role";

grant select on table "public"."ad_locations" to "service_role";

grant update on table "public"."ad_locations" to "service_role";

grant delete on table "public"."admin_activations" to "anon";

grant insert on table "public"."admin_activations" to "anon";

grant select on table "public"."admin_activations" to "anon";

grant update on table "public"."admin_activations" to "anon";

grant delete on table "public"."admin_activations" to "authenticated";

grant insert on table "public"."admin_activations" to "authenticated";

grant select on table "public"."admin_activations" to "authenticated";

grant update on table "public"."admin_activations" to "authenticated";

grant delete on table "public"."admin_api_key_pool" to "anon";

grant insert on table "public"."admin_api_key_pool" to "anon";

grant select on table "public"."admin_api_key_pool" to "anon";

grant update on table "public"."admin_api_key_pool" to "anon";

grant delete on table "public"."admin_registrations" to "anon";

grant insert on table "public"."admin_registrations" to "anon";

grant select on table "public"."admin_registrations" to "anon";

grant update on table "public"."admin_registrations" to "anon";

grant delete on table "public"."admin_registrations" to "authenticated";

grant insert on table "public"."admin_registrations" to "authenticated";

grant select on table "public"."admin_registrations" to "authenticated";

grant update on table "public"."admin_registrations" to "authenticated";

grant delete on table "public"."ads" to "anon";

grant insert on table "public"."ads" to "anon";

grant select on table "public"."ads" to "anon";

grant update on table "public"."ads" to "anon";

grant delete on table "public"."ads" to "authenticated";

grant insert on table "public"."ads" to "authenticated";

grant select on table "public"."ads" to "authenticated";

grant update on table "public"."ads" to "authenticated";

grant delete on table "public"."ads" to "service_role";

grant insert on table "public"."ads" to "service_role";

grant select on table "public"."ads" to "service_role";

grant update on table "public"."ads" to "service_role";

grant delete on table "public"."ai_abuse_logs" to "anon";

grant insert on table "public"."ai_abuse_logs" to "anon";

grant select on table "public"."ai_abuse_logs" to "anon";

grant update on table "public"."ai_abuse_logs" to "anon";

grant delete on table "public"."ai_abuse_logs" to "authenticated";

grant insert on table "public"."ai_abuse_logs" to "authenticated";

grant select on table "public"."ai_abuse_logs" to "authenticated";

grant update on table "public"."ai_abuse_logs" to "authenticated";

grant delete on table "public"."ai_approved_answers" to "anon";

grant insert on table "public"."ai_approved_answers" to "anon";

grant select on table "public"."ai_approved_answers" to "anon";

grant update on table "public"."ai_approved_answers" to "anon";

grant delete on table "public"."ai_approved_answers" to "authenticated";

grant insert on table "public"."ai_approved_answers" to "authenticated";

grant select on table "public"."ai_approved_answers" to "authenticated";

grant update on table "public"."ai_approved_answers" to "authenticated";

grant delete on table "public"."ai_approved_answers" to "service_role";

grant insert on table "public"."ai_approved_answers" to "service_role";

grant select on table "public"."ai_approved_answers" to "service_role";

grant update on table "public"."ai_approved_answers" to "service_role";

grant delete on table "public"."ai_feedback_queue" to "anon";

grant insert on table "public"."ai_feedback_queue" to "anon";

grant select on table "public"."ai_feedback_queue" to "anon";

grant update on table "public"."ai_feedback_queue" to "anon";

grant delete on table "public"."ai_feedback_queue" to "authenticated";

grant insert on table "public"."ai_feedback_queue" to "authenticated";

grant select on table "public"."ai_feedback_queue" to "authenticated";

grant update on table "public"."ai_feedback_queue" to "authenticated";

grant delete on table "public"."ai_feedback_queue" to "service_role";

grant insert on table "public"."ai_feedback_queue" to "service_role";

grant select on table "public"."ai_feedback_queue" to "service_role";

grant update on table "public"."ai_feedback_queue" to "service_role";

grant delete on table "public"."ai_interaction_logs" to "anon";

grant insert on table "public"."ai_interaction_logs" to "anon";

grant select on table "public"."ai_interaction_logs" to "anon";

grant update on table "public"."ai_interaction_logs" to "anon";

grant delete on table "public"."ai_interaction_logs" to "authenticated";

grant insert on table "public"."ai_interaction_logs" to "authenticated";

grant select on table "public"."ai_interaction_logs" to "authenticated";

grant update on table "public"."ai_interaction_logs" to "authenticated";

grant delete on table "public"."ai_interaction_logs" to "service_role";

grant insert on table "public"."ai_interaction_logs" to "service_role";

grant select on table "public"."ai_interaction_logs" to "service_role";

grant update on table "public"."ai_interaction_logs" to "service_role";

grant delete on table "public"."ai_knowledge_base" to "anon";

grant insert on table "public"."ai_knowledge_base" to "anon";

grant select on table "public"."ai_knowledge_base" to "anon";

grant update on table "public"."ai_knowledge_base" to "anon";

grant delete on table "public"."ai_knowledge_base" to "authenticated";

grant insert on table "public"."ai_knowledge_base" to "authenticated";

grant select on table "public"."ai_knowledge_base" to "authenticated";

grant update on table "public"."ai_knowledge_base" to "authenticated";

grant delete on table "public"."ai_knowledge_base" to "service_role";

grant insert on table "public"."ai_knowledge_base" to "service_role";

grant select on table "public"."ai_knowledge_base" to "service_role";

grant update on table "public"."ai_knowledge_base" to "service_role";

grant delete on table "public"."ai_prompts" to "anon";

grant insert on table "public"."ai_prompts" to "anon";

grant select on table "public"."ai_prompts" to "anon";

grant update on table "public"."ai_prompts" to "anon";

grant delete on table "public"."ai_prompts" to "authenticated";

grant insert on table "public"."ai_prompts" to "authenticated";

grant select on table "public"."ai_prompts" to "authenticated";

grant update on table "public"."ai_prompts" to "authenticated";

grant delete on table "public"."ai_user_profiles" to "anon";

grant insert on table "public"."ai_user_profiles" to "anon";

grant select on table "public"."ai_user_profiles" to "anon";

grant update on table "public"."ai_user_profiles" to "anon";

grant delete on table "public"."ai_user_profiles" to "authenticated";

grant insert on table "public"."ai_user_profiles" to "authenticated";

grant select on table "public"."ai_user_profiles" to "authenticated";

grant update on table "public"."ai_user_profiles" to "authenticated";

grant delete on table "public"."anggota_keluarga" to "anon";

grant insert on table "public"."anggota_keluarga" to "anon";

grant select on table "public"."anggota_keluarga" to "anon";

grant update on table "public"."anggota_keluarga" to "anon";

grant delete on table "public"."anggota_keluarga" to "authenticated";

grant insert on table "public"."anggota_keluarga" to "authenticated";

grant select on table "public"."anggota_keluarga" to "authenticated";

grant update on table "public"."anggota_keluarga" to "authenticated";

grant delete on table "public"."anointings" to "anon";

grant insert on table "public"."anointings" to "anon";

grant select on table "public"."anointings" to "anon";

grant update on table "public"."anointings" to "anon";

grant delete on table "public"."anointings" to "authenticated";

grant insert on table "public"."anointings" to "authenticated";

grant select on table "public"."anointings" to "authenticated";

grant update on table "public"."anointings" to "authenticated";

grant delete on table "public"."anomaly_flags" to "anon";

grant insert on table "public"."anomaly_flags" to "anon";

grant select on table "public"."anomaly_flags" to "anon";

grant update on table "public"."anomaly_flags" to "anon";

grant delete on table "public"."anomaly_flags" to "authenticated";

grant insert on table "public"."anomaly_flags" to "authenticated";

grant select on table "public"."anomaly_flags" to "authenticated";

grant update on table "public"."anomaly_flags" to "authenticated";

grant delete on table "public"."api_usage_logs" to "anon";

grant insert on table "public"."api_usage_logs" to "anon";

grant select on table "public"."api_usage_logs" to "anon";

grant update on table "public"."api_usage_logs" to "anon";

grant delete on table "public"."api_usage_logs" to "authenticated";

grant insert on table "public"."api_usage_logs" to "authenticated";

grant update on table "public"."api_usage_logs" to "authenticated";

grant delete on table "public"."aset_paroki" to "anon";

grant insert on table "public"."aset_paroki" to "anon";

grant select on table "public"."aset_paroki" to "anon";

grant update on table "public"."aset_paroki" to "anon";

grant delete on table "public"."aset_paroki" to "authenticated";

grant insert on table "public"."aset_paroki" to "authenticated";

grant select on table "public"."aset_paroki" to "authenticated";

grant update on table "public"."aset_paroki" to "authenticated";

grant delete on table "public"."audit_logs" to "anon";

grant insert on table "public"."audit_logs" to "anon";

grant select on table "public"."audit_logs" to "anon";

grant update on table "public"."audit_logs" to "anon";

grant delete on table "public"."audit_logs" to "authenticated";

grant insert on table "public"."audit_logs" to "authenticated";

grant select on table "public"."audit_logs" to "authenticated";

grant update on table "public"."audit_logs" to "authenticated";

grant delete on table "public"."auth_otps" to "anon";

grant insert on table "public"."auth_otps" to "anon";

grant select on table "public"."auth_otps" to "anon";

grant update on table "public"."auth_otps" to "anon";

grant delete on table "public"."auth_otps" to "authenticated";

grant insert on table "public"."auth_otps" to "authenticated";

grant select on table "public"."auth_otps" to "authenticated";

grant update on table "public"."auth_otps" to "authenticated";

grant delete on table "public"."auth_otps" to "service_role";

grant insert on table "public"."auth_otps" to "service_role";

grant select on table "public"."auth_otps" to "service_role";

grant update on table "public"."auth_otps" to "service_role";

grant delete on table "public"."baptisms" to "anon";

grant insert on table "public"."baptisms" to "anon";

grant select on table "public"."baptisms" to "anon";

grant update on table "public"."baptisms" to "anon";

grant delete on table "public"."baptisms" to "authenticated";

grant insert on table "public"."baptisms" to "authenticated";

grant select on table "public"."baptisms" to "authenticated";

grant update on table "public"."baptisms" to "authenticated";

grant delete on table "public"."batch_kurasi" to "anon";

grant insert on table "public"."batch_kurasi" to "anon";

grant select on table "public"."batch_kurasi" to "anon";

grant update on table "public"."batch_kurasi" to "anon";

grant delete on table "public"."batch_kurasi" to "authenticated";

grant insert on table "public"."batch_kurasi" to "authenticated";

grant select on table "public"."batch_kurasi" to "authenticated";

grant update on table "public"."batch_kurasi" to "authenticated";

grant delete on table "public"."batch_kurasi" to "service_role";

grant insert on table "public"."batch_kurasi" to "service_role";

grant select on table "public"."batch_kurasi" to "service_role";

grant update on table "public"."batch_kurasi" to "service_role";

grant delete on table "public"."bot_configs" to "anon";

grant insert on table "public"."bot_configs" to "anon";

grant select on table "public"."bot_configs" to "anon";

grant update on table "public"."bot_configs" to "anon";

grant delete on table "public"."bot_configs" to "authenticated";

grant insert on table "public"."bot_configs" to "authenticated";

grant select on table "public"."bot_configs" to "authenticated";

grant update on table "public"."bot_configs" to "authenticated";

grant delete on table "public"."bot_configs" to "service_role";

grant insert on table "public"."bot_configs" to "service_role";

grant select on table "public"."bot_configs" to "service_role";

grant update on table "public"."bot_configs" to "service_role";

grant delete on table "public"."bot_context_storage" to "anon";

grant insert on table "public"."bot_context_storage" to "anon";

grant select on table "public"."bot_context_storage" to "anon";

grant update on table "public"."bot_context_storage" to "anon";

grant delete on table "public"."bot_context_storage" to "authenticated";

grant insert on table "public"."bot_context_storage" to "authenticated";

grant select on table "public"."bot_context_storage" to "authenticated";

grant update on table "public"."bot_context_storage" to "authenticated";

grant delete on table "public"."bot_context_storage" to "service_role";

grant insert on table "public"."bot_context_storage" to "service_role";

grant select on table "public"."bot_context_storage" to "service_role";

grant update on table "public"."bot_context_storage" to "service_role";

grant delete on table "public"."bot_conversations" to "anon";

grant insert on table "public"."bot_conversations" to "anon";

grant select on table "public"."bot_conversations" to "anon";

grant update on table "public"."bot_conversations" to "anon";

grant delete on table "public"."bot_conversations" to "authenticated";

grant insert on table "public"."bot_conversations" to "authenticated";

grant select on table "public"."bot_conversations" to "authenticated";

grant update on table "public"."bot_conversations" to "authenticated";

grant delete on table "public"."bot_conversations" to "service_role";

grant insert on table "public"."bot_conversations" to "service_role";

grant select on table "public"."bot_conversations" to "service_role";

grant update on table "public"."bot_conversations" to "service_role";

grant delete on table "public"."bot_interactions" to "anon";

grant insert on table "public"."bot_interactions" to "anon";

grant select on table "public"."bot_interactions" to "anon";

grant update on table "public"."bot_interactions" to "anon";

grant delete on table "public"."bot_interactions" to "authenticated";

grant insert on table "public"."bot_interactions" to "authenticated";

grant select on table "public"."bot_interactions" to "authenticated";

grant update on table "public"."bot_interactions" to "authenticated";

grant delete on table "public"."bot_interactions" to "service_role";

grant insert on table "public"."bot_interactions" to "service_role";

grant select on table "public"."bot_interactions" to "service_role";

grant update on table "public"."bot_interactions" to "service_role";

grant delete on table "public"."cache_liturgi" to "anon";

grant insert on table "public"."cache_liturgi" to "anon";

grant select on table "public"."cache_liturgi" to "anon";

grant update on table "public"."cache_liturgi" to "anon";

grant delete on table "public"."cache_liturgi" to "authenticated";

grant insert on table "public"."cache_liturgi" to "authenticated";

grant select on table "public"."cache_liturgi" to "authenticated";

grant update on table "public"."cache_liturgi" to "authenticated";

grant delete on table "public"."cache_liturgi" to "service_role";

grant insert on table "public"."cache_liturgi" to "service_role";

grant select on table "public"."cache_liturgi" to "service_role";

grant update on table "public"."cache_liturgi" to "service_role";

grant delete on table "public"."charity_requests" to "anon";

grant insert on table "public"."charity_requests" to "anon";

grant select on table "public"."charity_requests" to "anon";

grant update on table "public"."charity_requests" to "anon";

grant delete on table "public"."charity_requests" to "authenticated";

grant insert on table "public"."charity_requests" to "authenticated";

grant select on table "public"."charity_requests" to "authenticated";

grant update on table "public"."charity_requests" to "authenticated";

grant delete on table "public"."charity_services" to "anon";

grant insert on table "public"."charity_services" to "anon";

grant select on table "public"."charity_services" to "anon";

grant update on table "public"."charity_services" to "anon";

grant delete on table "public"."charity_services" to "authenticated";

grant insert on table "public"."charity_services" to "authenticated";

grant select on table "public"."charity_services" to "authenticated";

grant update on table "public"."charity_services" to "authenticated";

grant delete on table "public"."companion_sessions" to "anon";

grant insert on table "public"."companion_sessions" to "anon";

grant select on table "public"."companion_sessions" to "anon";

grant update on table "public"."companion_sessions" to "anon";

grant delete on table "public"."companion_sessions" to "authenticated";

grant insert on table "public"."companion_sessions" to "authenticated";

grant select on table "public"."companion_sessions" to "authenticated";

grant update on table "public"."companion_sessions" to "authenticated";

grant delete on table "public"."companion_transcripts" to "anon";

grant insert on table "public"."companion_transcripts" to "anon";

grant select on table "public"."companion_transcripts" to "anon";

grant update on table "public"."companion_transcripts" to "anon";

grant delete on table "public"."companion_transcripts" to "authenticated";

grant insert on table "public"."companion_transcripts" to "authenticated";

grant select on table "public"."companion_transcripts" to "authenticated";

grant update on table "public"."companion_transcripts" to "authenticated";

grant delete on table "public"."cron_heartbeat" to "anon";

grant insert on table "public"."cron_heartbeat" to "anon";

grant select on table "public"."cron_heartbeat" to "anon";

grant update on table "public"."cron_heartbeat" to "anon";

grant delete on table "public"."cron_heartbeat" to "authenticated";

grant insert on table "public"."cron_heartbeat" to "authenticated";

grant select on table "public"."cron_heartbeat" to "authenticated";

grant update on table "public"."cron_heartbeat" to "authenticated";

grant delete on table "public"."dana_duka_pencairan" to "anon";

grant insert on table "public"."dana_duka_pencairan" to "anon";

grant select on table "public"."dana_duka_pencairan" to "anon";

grant update on table "public"."dana_duka_pencairan" to "anon";

grant delete on table "public"."dana_duka_pencairan" to "authenticated";

grant insert on table "public"."dana_duka_pencairan" to "authenticated";

grant select on table "public"."dana_duka_pencairan" to "authenticated";

grant update on table "public"."dana_duka_pencairan" to "authenticated";

grant delete on table "public"."dana_kasih" to "anon";

grant insert on table "public"."dana_kasih" to "anon";

grant select on table "public"."dana_kasih" to "anon";

grant update on table "public"."dana_kasih" to "anon";

grant delete on table "public"."dana_kasih" to "authenticated";

grant insert on table "public"."dana_kasih" to "authenticated";

grant select on table "public"."dana_kasih" to "authenticated";

grant update on table "public"."dana_kasih" to "authenticated";

grant delete on table "public"."dana_kasih_donors" to "anon";

grant insert on table "public"."dana_kasih_donors" to "anon";

grant select on table "public"."dana_kasih_donors" to "anon";

grant update on table "public"."dana_kasih_donors" to "anon";

grant delete on table "public"."dana_kasih_donors" to "authenticated";

grant insert on table "public"."dana_kasih_donors" to "authenticated";

grant select on table "public"."dana_kasih_donors" to "authenticated";

grant update on table "public"."dana_kasih_donors" to "authenticated";

grant delete on table "public"."dashboard_widgets" to "anon";

grant insert on table "public"."dashboard_widgets" to "anon";

grant select on table "public"."dashboard_widgets" to "anon";

grant update on table "public"."dashboard_widgets" to "anon";

grant delete on table "public"."dashboard_widgets" to "authenticated";

grant insert on table "public"."dashboard_widgets" to "authenticated";

grant select on table "public"."dashboard_widgets" to "authenticated";

grant update on table "public"."dashboard_widgets" to "authenticated";

grant delete on table "public"."data_gakin" to "anon";

grant insert on table "public"."data_gakin" to "anon";

grant select on table "public"."data_gakin" to "anon";

grant update on table "public"."data_gakin" to "anon";

grant delete on table "public"."data_gakin" to "authenticated";

grant insert on table "public"."data_gakin" to "authenticated";

grant select on table "public"."data_gakin" to "authenticated";

grant update on table "public"."data_gakin" to "authenticated";

grant delete on table "public"."digital_vault" to "anon";

grant insert on table "public"."digital_vault" to "anon";

grant select on table "public"."digital_vault" to "anon";

grant update on table "public"."digital_vault" to "anon";

grant delete on table "public"."digital_vault" to "authenticated";

grant insert on table "public"."digital_vault" to "authenticated";

grant select on table "public"."digital_vault" to "authenticated";

grant update on table "public"."digital_vault" to "authenticated";

grant delete on table "public"."donatur_potensial" to "anon";

grant insert on table "public"."donatur_potensial" to "anon";

grant select on table "public"."donatur_potensial" to "anon";

grant update on table "public"."donatur_potensial" to "anon";

grant delete on table "public"."donatur_potensial" to "authenticated";

grant insert on table "public"."donatur_potensial" to "authenticated";

grant select on table "public"."donatur_potensial" to "authenticated";

grant update on table "public"."donatur_potensial" to "authenticated";

grant delete on table "public"."e_signatures" to "anon";

grant insert on table "public"."e_signatures" to "anon";

grant select on table "public"."e_signatures" to "anon";

grant update on table "public"."e_signatures" to "anon";

grant delete on table "public"."e_signatures" to "authenticated";

grant insert on table "public"."e_signatures" to "authenticated";

grant select on table "public"."e_signatures" to "authenticated";

grant update on table "public"."e_signatures" to "authenticated";

grant delete on table "public"."error_logs" to "anon";

grant insert on table "public"."error_logs" to "anon";

grant select on table "public"."error_logs" to "anon";

grant update on table "public"."error_logs" to "anon";

grant delete on table "public"."error_logs" to "authenticated";

grant insert on table "public"."error_logs" to "authenticated";

grant select on table "public"."error_logs" to "authenticated";

grant update on table "public"."error_logs" to "authenticated";

grant delete on table "public"."families" to "anon";

grant insert on table "public"."families" to "anon";

grant select on table "public"."families" to "anon";

grant update on table "public"."families" to "anon";

grant delete on table "public"."families" to "authenticated";

grant insert on table "public"."families" to "authenticated";

grant select on table "public"."families" to "authenticated";

grant update on table "public"."families" to "authenticated";

grant delete on table "public"."family_invitations" to "anon";

grant insert on table "public"."family_invitations" to "anon";

grant select on table "public"."family_invitations" to "anon";

grant update on table "public"."family_invitations" to "anon";

grant delete on table "public"."family_invitations" to "authenticated";

grant insert on table "public"."family_invitations" to "authenticated";

grant select on table "public"."family_invitations" to "authenticated";

grant update on table "public"."family_invitations" to "authenticated";

grant delete on table "public"."financial_transactions" to "anon";

grant insert on table "public"."financial_transactions" to "anon";

grant select on table "public"."financial_transactions" to "anon";

grant update on table "public"."financial_transactions" to "anon";

grant delete on table "public"."financial_transactions" to "authenticated";

grant insert on table "public"."financial_transactions" to "authenticated";

grant select on table "public"."financial_transactions" to "authenticated";

grant update on table "public"."financial_transactions" to "authenticated";

grant delete on table "public"."gakin_approvals" to "anon";

grant insert on table "public"."gakin_approvals" to "anon";

grant select on table "public"."gakin_approvals" to "anon";

grant update on table "public"."gakin_approvals" to "anon";

grant delete on table "public"."gakin_approvals" to "authenticated";

grant insert on table "public"."gakin_approvals" to "authenticated";

grant select on table "public"."gakin_approvals" to "authenticated";

grant update on table "public"."gakin_approvals" to "authenticated";

grant delete on table "public"."governance_evaluasi" to "anon";

grant insert on table "public"."governance_evaluasi" to "anon";

grant select on table "public"."governance_evaluasi" to "anon";

grant update on table "public"."governance_evaluasi" to "anon";

grant delete on table "public"."governance_evaluasi" to "authenticated";

grant insert on table "public"."governance_evaluasi" to "authenticated";

grant select on table "public"."governance_evaluasi" to "authenticated";

grant update on table "public"."governance_evaluasi" to "authenticated";

grant delete on table "public"."governance_keputusan_dpp" to "anon";

grant insert on table "public"."governance_keputusan_dpp" to "anon";

grant select on table "public"."governance_keputusan_dpp" to "anon";

grant update on table "public"."governance_keputusan_dpp" to "anon";

grant delete on table "public"."governance_keputusan_dpp" to "authenticated";

grant insert on table "public"."governance_keputusan_dpp" to "authenticated";

grant select on table "public"."governance_keputusan_dpp" to "authenticated";

grant update on table "public"."governance_keputusan_dpp" to "authenticated";

grant delete on table "public"."governance_kpi" to "anon";

grant insert on table "public"."governance_kpi" to "anon";

grant select on table "public"."governance_kpi" to "anon";

grant update on table "public"."governance_kpi" to "anon";

grant delete on table "public"."governance_kpi" to "authenticated";

grant insert on table "public"."governance_kpi" to "authenticated";

grant select on table "public"."governance_kpi" to "authenticated";

grant update on table "public"."governance_kpi" to "authenticated";

grant delete on table "public"."governance_notulen" to "anon";

grant insert on table "public"."governance_notulen" to "anon";

grant select on table "public"."governance_notulen" to "anon";

grant update on table "public"."governance_notulen" to "anon";

grant delete on table "public"."governance_notulen" to "authenticated";

grant insert on table "public"."governance_notulen" to "authenticated";

grant select on table "public"."governance_notulen" to "authenticated";

grant update on table "public"."governance_notulen" to "authenticated";

grant delete on table "public"."governance_program_kerja" to "anon";

grant insert on table "public"."governance_program_kerja" to "anon";

grant select on table "public"."governance_program_kerja" to "anon";

grant update on table "public"."governance_program_kerja" to "anon";

grant delete on table "public"."governance_program_kerja" to "authenticated";

grant insert on table "public"."governance_program_kerja" to "authenticated";

grant select on table "public"."governance_program_kerja" to "authenticated";

grant update on table "public"."governance_program_kerja" to "authenticated";

grant delete on table "public"."governance_rkap" to "anon";

grant insert on table "public"."governance_rkap" to "anon";

grant select on table "public"."governance_rkap" to "anon";

grant update on table "public"."governance_rkap" to "anon";

grant delete on table "public"."governance_rkap" to "authenticated";

grant insert on table "public"."governance_rkap" to "authenticated";

grant select on table "public"."governance_rkap" to "authenticated";

grant update on table "public"."governance_rkap" to "authenticated";

grant delete on table "public"."health_check" to "anon";

grant insert on table "public"."health_check" to "anon";

grant update on table "public"."health_check" to "anon";

grant delete on table "public"."health_check" to "authenticated";

grant insert on table "public"."health_check" to "authenticated";

grant update on table "public"."health_check" to "authenticated";

grant delete on table "public"."internal_admin_chunks" to "anon";

grant insert on table "public"."internal_admin_chunks" to "anon";

grant select on table "public"."internal_admin_chunks" to "anon";

grant update on table "public"."internal_admin_chunks" to "anon";

grant delete on table "public"."internal_admin_chunks" to "authenticated";

grant insert on table "public"."internal_admin_chunks" to "authenticated";

grant select on table "public"."internal_admin_chunks" to "authenticated";

grant update on table "public"."internal_admin_chunks" to "authenticated";

grant delete on table "public"."internal_admin_chunks" to "service_role";

grant insert on table "public"."internal_admin_chunks" to "service_role";

grant select on table "public"."internal_admin_chunks" to "service_role";

grant update on table "public"."internal_admin_chunks" to "service_role";

grant delete on table "public"."jadwal_misa" to "anon";

grant insert on table "public"."jadwal_misa" to "anon";

grant select on table "public"."jadwal_misa" to "anon";

grant update on table "public"."jadwal_misa" to "anon";

grant delete on table "public"."jadwal_misa" to "authenticated";

grant insert on table "public"."jadwal_misa" to "authenticated";

grant select on table "public"."jadwal_misa" to "authenticated";

grant update on table "public"."jadwal_misa" to "authenticated";

grant delete on table "public"."jadwal_misa" to "service_role";

grant insert on table "public"."jadwal_misa" to "service_role";

grant select on table "public"."jadwal_misa" to "service_role";

grant update on table "public"."jadwal_misa" to "service_role";

grant delete on table "public"."jadwal_petugas" to "anon";

grant insert on table "public"."jadwal_petugas" to "anon";

grant select on table "public"."jadwal_petugas" to "anon";

grant update on table "public"."jadwal_petugas" to "anon";

grant delete on table "public"."jadwal_petugas" to "authenticated";

grant insert on table "public"."jadwal_petugas" to "authenticated";

grant select on table "public"."jadwal_petugas" to "authenticated";

grant update on table "public"."jadwal_petugas" to "authenticated";

grant delete on table "public"."keaktifan" to "anon";

grant insert on table "public"."keaktifan" to "anon";

grant select on table "public"."keaktifan" to "anon";

grant update on table "public"."keaktifan" to "anon";

grant delete on table "public"."keaktifan" to "authenticated";

grant insert on table "public"."keaktifan" to "authenticated";

grant select on table "public"."keaktifan" to "authenticated";

grant update on table "public"."keaktifan" to "authenticated";

grant delete on table "public"."kegiatan" to "anon";

grant insert on table "public"."kegiatan" to "anon";

grant select on table "public"."kegiatan" to "anon";

grant update on table "public"."kegiatan" to "anon";

grant delete on table "public"."kegiatan" to "authenticated";

grant insert on table "public"."kegiatan" to "authenticated";

grant select on table "public"."kegiatan" to "authenticated";

grant update on table "public"."kegiatan" to "authenticated";

grant delete on table "public"."kegiatan_approvals" to "anon";

grant insert on table "public"."kegiatan_approvals" to "anon";

grant select on table "public"."kegiatan_approvals" to "anon";

grant update on table "public"."kegiatan_approvals" to "anon";

grant delete on table "public"."kegiatan_approvals" to "authenticated";

grant insert on table "public"."kegiatan_approvals" to "authenticated";

grant select on table "public"."kegiatan_approvals" to "authenticated";

grant update on table "public"."kegiatan_approvals" to "authenticated";

grant delete on table "public"."kegiatan_paroki" to "anon";

grant insert on table "public"."kegiatan_paroki" to "anon";

grant select on table "public"."kegiatan_paroki" to "anon";

grant update on table "public"."kegiatan_paroki" to "anon";

grant delete on table "public"."kegiatan_paroki" to "authenticated";

grant insert on table "public"."kegiatan_paroki" to "authenticated";

grant select on table "public"."kegiatan_paroki" to "authenticated";

grant update on table "public"."kegiatan_paroki" to "authenticated";

grant delete on table "public"."kegiatan_paroki" to "service_role";

grant insert on table "public"."kegiatan_paroki" to "service_role";

grant select on table "public"."kegiatan_paroki" to "service_role";

grant update on table "public"."kegiatan_paroki" to "service_role";

grant delete on table "public"."keluarga" to "anon";

grant insert on table "public"."keluarga" to "anon";

grant select on table "public"."keluarga" to "anon";

grant update on table "public"."keluarga" to "anon";

grant delete on table "public"."keluarga" to "authenticated";

grant insert on table "public"."keluarga" to "authenticated";

grant select on table "public"."keluarga" to "authenticated";

grant update on table "public"."keluarga" to "authenticated";

grant delete on table "public"."kolekte_entries" to "anon";

grant insert on table "public"."kolekte_entries" to "anon";

grant select on table "public"."kolekte_entries" to "anon";

grant update on table "public"."kolekte_entries" to "anon";

grant delete on table "public"."kolekte_entries" to "authenticated";

grant insert on table "public"."kolekte_entries" to "authenticated";

grant select on table "public"."kolekte_entries" to "authenticated";

grant update on table "public"."kolekte_entries" to "authenticated";

grant delete on table "public"."kolekte_reconciliations" to "anon";

grant insert on table "public"."kolekte_reconciliations" to "anon";

grant select on table "public"."kolekte_reconciliations" to "anon";

grant update on table "public"."kolekte_reconciliations" to "anon";

grant delete on table "public"."kolekte_reconciliations" to "authenticated";

grant insert on table "public"."kolekte_reconciliations" to "authenticated";

grant select on table "public"."kolekte_reconciliations" to "authenticated";

grant update on table "public"."kolekte_reconciliations" to "authenticated";

grant delete on table "public"."kolekte_reconciliations" to "service_role";

grant insert on table "public"."kolekte_reconciliations" to "service_role";

grant select on table "public"."kolekte_reconciliations" to "service_role";

grant update on table "public"."kolekte_reconciliations" to "service_role";

grant delete on table "public"."laporan_seksi" to "anon";

grant insert on table "public"."laporan_seksi" to "anon";

grant select on table "public"."laporan_seksi" to "anon";

grant update on table "public"."laporan_seksi" to "anon";

grant delete on table "public"."laporan_seksi" to "authenticated";

grant insert on table "public"."laporan_seksi" to "authenticated";

grant select on table "public"."laporan_seksi" to "authenticated";

grant update on table "public"."laporan_seksi" to "authenticated";

grant delete on table "public"."laporan_templates" to "anon";

grant insert on table "public"."laporan_templates" to "anon";

grant select on table "public"."laporan_templates" to "anon";

grant update on table "public"."laporan_templates" to "anon";

grant delete on table "public"."laporan_templates" to "authenticated";

grant insert on table "public"."laporan_templates" to "authenticated";

grant select on table "public"."laporan_templates" to "authenticated";

grant update on table "public"."laporan_templates" to "authenticated";

grant delete on table "public"."learning_content" to "anon";

grant insert on table "public"."learning_content" to "anon";

grant select on table "public"."learning_content" to "anon";

grant update on table "public"."learning_content" to "anon";

grant delete on table "public"."learning_content" to "authenticated";

grant insert on table "public"."learning_content" to "authenticated";

grant select on table "public"."learning_content" to "authenticated";

grant update on table "public"."learning_content" to "authenticated";

grant delete on table "public"."learning_modules" to "anon";

grant insert on table "public"."learning_modules" to "anon";

grant select on table "public"."learning_modules" to "anon";

grant update on table "public"."learning_modules" to "anon";

grant delete on table "public"."learning_modules" to "authenticated";

grant insert on table "public"."learning_modules" to "authenticated";

grant select on table "public"."learning_modules" to "authenticated";

grant update on table "public"."learning_modules" to "authenticated";

grant delete on table "public"."learning_qa_context" to "anon";

grant insert on table "public"."learning_qa_context" to "anon";

grant select on table "public"."learning_qa_context" to "anon";

grant update on table "public"."learning_qa_context" to "anon";

grant delete on table "public"."learning_qa_context" to "authenticated";

grant insert on table "public"."learning_qa_context" to "authenticated";

grant select on table "public"."learning_qa_context" to "authenticated";

grant update on table "public"."learning_qa_context" to "authenticated";

grant delete on table "public"."lingkungan" to "anon";

grant insert on table "public"."lingkungan" to "anon";

grant select on table "public"."lingkungan" to "anon";

grant update on table "public"."lingkungan" to "anon";

grant delete on table "public"."lingkungan" to "authenticated";

grant insert on table "public"."lingkungan" to "authenticated";

grant select on table "public"."lingkungan" to "authenticated";

grant update on table "public"."lingkungan" to "authenticated";

grant delete on table "public"."liturgical_calendar" to "anon";

grant insert on table "public"."liturgical_calendar" to "anon";

grant select on table "public"."liturgical_calendar" to "anon";

grant update on table "public"."liturgical_calendar" to "anon";

grant delete on table "public"."liturgical_calendar" to "authenticated";

grant insert on table "public"."liturgical_calendar" to "authenticated";

grant select on table "public"."liturgical_calendar" to "authenticated";

grant update on table "public"."liturgical_calendar" to "authenticated";

grant delete on table "public"."liturgical_calendar_cache" to "anon";

grant insert on table "public"."liturgical_calendar_cache" to "anon";

grant select on table "public"."liturgical_calendar_cache" to "anon";

grant update on table "public"."liturgical_calendar_cache" to "anon";

grant delete on table "public"."liturgical_calendar_cache" to "authenticated";

grant insert on table "public"."liturgical_calendar_cache" to "authenticated";

grant select on table "public"."liturgical_calendar_cache" to "authenticated";

grant update on table "public"."liturgical_calendar_cache" to "authenticated";

grant delete on table "public"."lowongan_kerja" to "anon";

grant insert on table "public"."lowongan_kerja" to "anon";

grant select on table "public"."lowongan_kerja" to "anon";

grant update on table "public"."lowongan_kerja" to "anon";

grant delete on table "public"."lowongan_kerja" to "authenticated";

grant insert on table "public"."lowongan_kerja" to "authenticated";

grant select on table "public"."lowongan_kerja" to "authenticated";

grant update on table "public"."lowongan_kerja" to "authenticated";

grant delete on table "public"."lowongan_lamaran" to "anon";

grant insert on table "public"."lowongan_lamaran" to "anon";

grant select on table "public"."lowongan_lamaran" to "anon";

grant update on table "public"."lowongan_lamaran" to "anon";

grant delete on table "public"."lowongan_lamaran" to "authenticated";

grant insert on table "public"."lowongan_lamaran" to "authenticated";

grant select on table "public"."lowongan_lamaran" to "authenticated";

grant update on table "public"."lowongan_lamaran" to "authenticated";

grant delete on table "public"."marketplace_orders" to "anon";

grant insert on table "public"."marketplace_orders" to "anon";

grant select on table "public"."marketplace_orders" to "anon";

grant update on table "public"."marketplace_orders" to "anon";

grant delete on table "public"."marketplace_products" to "anon";

grant insert on table "public"."marketplace_products" to "anon";

grant select on table "public"."marketplace_products" to "anon";

grant update on table "public"."marketplace_products" to "anon";

grant delete on table "public"."marriages" to "anon";

grant insert on table "public"."marriages" to "anon";

grant select on table "public"."marriages" to "anon";

grant update on table "public"."marriages" to "anon";

grant delete on table "public"."marriages" to "authenticated";

grant insert on table "public"."marriages" to "authenticated";

grant select on table "public"."marriages" to "authenticated";

grant update on table "public"."marriages" to "authenticated";

grant delete on table "public"."match_feedback" to "anon";

grant insert on table "public"."match_feedback" to "anon";

grant select on table "public"."match_feedback" to "anon";

grant update on table "public"."match_feedback" to "anon";

grant delete on table "public"."match_feedback" to "authenticated";

grant insert on table "public"."match_feedback" to "authenticated";

grant select on table "public"."match_feedback" to "authenticated";

grant update on table "public"."match_feedback" to "authenticated";

grant delete on table "public"."match_feedback" to "service_role";

grant insert on table "public"."match_feedback" to "service_role";

grant select on table "public"."match_feedback" to "service_role";

grant update on table "public"."match_feedback" to "service_role";

grant delete on table "public"."misa_schedules" to "anon";

grant insert on table "public"."misa_schedules" to "anon";

grant select on table "public"."misa_schedules" to "anon";

grant update on table "public"."misa_schedules" to "anon";

grant delete on table "public"."misa_schedules" to "authenticated";

grant insert on table "public"."misa_schedules" to "authenticated";

grant select on table "public"."misa_schedules" to "authenticated";

grant update on table "public"."misa_schedules" to "authenticated";

grant delete on table "public"."morning_check_logs" to "anon";

grant insert on table "public"."morning_check_logs" to "anon";

grant select on table "public"."morning_check_logs" to "anon";

grant update on table "public"."morning_check_logs" to "anon";

grant delete on table "public"."morning_check_logs" to "authenticated";

grant insert on table "public"."morning_check_logs" to "authenticated";

grant select on table "public"."morning_check_logs" to "authenticated";

grant update on table "public"."morning_check_logs" to "authenticated";

grant delete on table "public"."multi_signature_approvals" to "anon";

grant insert on table "public"."multi_signature_approvals" to "anon";

grant select on table "public"."multi_signature_approvals" to "anon";

grant update on table "public"."multi_signature_approvals" to "anon";

grant delete on table "public"."multi_signature_approvals" to "authenticated";

grant insert on table "public"."multi_signature_approvals" to "authenticated";

grant select on table "public"."multi_signature_approvals" to "authenticated";

grant update on table "public"."multi_signature_approvals" to "authenticated";

grant delete on table "public"."notification_templates" to "anon";

grant insert on table "public"."notification_templates" to "anon";

grant select on table "public"."notification_templates" to "anon";

grant update on table "public"."notification_templates" to "anon";

grant delete on table "public"."notification_templates" to "authenticated";

grant insert on table "public"."notification_templates" to "authenticated";

grant select on table "public"."notification_templates" to "authenticated";

grant update on table "public"."notification_templates" to "authenticated";

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."ocr_scan_results" to "anon";

grant insert on table "public"."ocr_scan_results" to "anon";

grant select on table "public"."ocr_scan_results" to "anon";

grant update on table "public"."ocr_scan_results" to "anon";

grant delete on table "public"."ocr_scan_results" to "service_role";

grant insert on table "public"."ocr_scan_results" to "service_role";

grant select on table "public"."ocr_scan_results" to "service_role";

grant update on table "public"."ocr_scan_results" to "service_role";

grant delete on table "public"."ojek_drivers" to "anon";

grant insert on table "public"."ojek_drivers" to "anon";

grant select on table "public"."ojek_drivers" to "anon";

grant update on table "public"."ojek_drivers" to "anon";

grant delete on table "public"."ojek_orders" to "anon";

grant insert on table "public"."ojek_orders" to "anon";

grant select on table "public"."ojek_orders" to "anon";

grant update on table "public"."ojek_orders" to "anon";

grant delete on table "public"."operational_chunks" to "anon";

grant insert on table "public"."operational_chunks" to "anon";

grant select on table "public"."operational_chunks" to "anon";

grant update on table "public"."operational_chunks" to "anon";

grant delete on table "public"."operational_chunks" to "authenticated";

grant insert on table "public"."operational_chunks" to "authenticated";

grant select on table "public"."operational_chunks" to "authenticated";

grant update on table "public"."operational_chunks" to "authenticated";

grant delete on table "public"."operational_chunks" to "service_role";

grant insert on table "public"."operational_chunks" to "service_role";

grant select on table "public"."operational_chunks" to "service_role";

grant update on table "public"."operational_chunks" to "service_role";

grant delete on table "public"."otp_verification" to "anon";

grant insert on table "public"."otp_verification" to "anon";

grant select on table "public"."otp_verification" to "anon";

grant update on table "public"."otp_verification" to "anon";

grant delete on table "public"."otp_verification" to "authenticated";

grant insert on table "public"."otp_verification" to "authenticated";

grant select on table "public"."otp_verification" to "authenticated";

grant update on table "public"."otp_verification" to "authenticated";

grant delete on table "public"."parish_profile" to "anon";

grant insert on table "public"."parish_profile" to "anon";

grant select on table "public"."parish_profile" to "anon";

grant update on table "public"."parish_profile" to "anon";

grant delete on table "public"."parish_profile" to "authenticated";

grant insert on table "public"."parish_profile" to "authenticated";

grant select on table "public"."parish_profile" to "authenticated";

grant update on table "public"."parish_profile" to "authenticated";

grant delete on table "public"."pastoral_sessions" to "anon";

grant insert on table "public"."pastoral_sessions" to "anon";

grant select on table "public"."pastoral_sessions" to "anon";

grant update on table "public"."pastoral_sessions" to "anon";

grant delete on table "public"."pastoral_sessions" to "authenticated";

grant insert on table "public"."pastoral_sessions" to "authenticated";

grant select on table "public"."pastoral_sessions" to "authenticated";

grant update on table "public"."pastoral_sessions" to "authenticated";

grant delete on table "public"."pastoral_sessions" to "service_role";

grant insert on table "public"."pastoral_sessions" to "service_role";

grant select on table "public"."pastoral_sessions" to "service_role";

grant update on table "public"."pastoral_sessions" to "service_role";

grant delete on table "public"."pastoral_sos" to "anon";

grant insert on table "public"."pastoral_sos" to "anon";

grant select on table "public"."pastoral_sos" to "anon";

grant update on table "public"."pastoral_sos" to "anon";

grant delete on table "public"."pastoral_sos" to "authenticated";

grant insert on table "public"."pastoral_sos" to "authenticated";

grant select on table "public"."pastoral_sos" to "authenticated";

grant update on table "public"."pastoral_sos" to "authenticated";

grant delete on table "public"."phone_change_logs" to "anon";

grant insert on table "public"."phone_change_logs" to "anon";

grant select on table "public"."phone_change_logs" to "anon";

grant update on table "public"."phone_change_logs" to "anon";

grant delete on table "public"."prayers_collection" to "anon";

grant insert on table "public"."prayers_collection" to "anon";

grant update on table "public"."prayers_collection" to "anon";

grant delete on table "public"."prayers_collection" to "authenticated";

grant insert on table "public"."prayers_collection" to "authenticated";

grant update on table "public"."prayers_collection" to "authenticated";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."public_faq" to "anon";

grant insert on table "public"."public_faq" to "anon";

grant select on table "public"."public_faq" to "anon";

grant update on table "public"."public_faq" to "anon";

grant delete on table "public"."public_faq" to "authenticated";

grant insert on table "public"."public_faq" to "authenticated";

grant select on table "public"."public_faq" to "authenticated";

grant update on table "public"."public_faq" to "authenticated";

grant delete on table "public"."public_info" to "anon";

grant insert on table "public"."public_info" to "anon";

grant select on table "public"."public_info" to "anon";

grant update on table "public"."public_info" to "anon";

grant delete on table "public"."public_info" to "authenticated";

grant insert on table "public"."public_info" to "authenticated";

grant select on table "public"."public_info" to "authenticated";

grant update on table "public"."public_info" to "authenticated";

grant delete on table "public"."qa_pairs" to "anon";

grant insert on table "public"."qa_pairs" to "anon";

grant select on table "public"."qa_pairs" to "anon";

grant update on table "public"."qa_pairs" to "anon";

grant delete on table "public"."qa_pairs" to "authenticated";

grant insert on table "public"."qa_pairs" to "authenticated";

grant select on table "public"."qa_pairs" to "authenticated";

grant update on table "public"."qa_pairs" to "authenticated";

grant delete on table "public"."qa_pairs" to "service_role";

grant insert on table "public"."qa_pairs" to "service_role";

grant select on table "public"."qa_pairs" to "service_role";

grant update on table "public"."qa_pairs" to "service_role";

grant delete on table "public"."rekenings" to "anon";

grant insert on table "public"."rekenings" to "anon";

grant select on table "public"."rekenings" to "anon";

grant update on table "public"."rekenings" to "anon";

grant delete on table "public"."rekenings" to "authenticated";

grant insert on table "public"."rekenings" to "authenticated";

grant select on table "public"."rekenings" to "authenticated";

grant update on table "public"."rekenings" to "authenticated";

grant delete on table "public"."renungan_harian" to "anon";

grant insert on table "public"."renungan_harian" to "anon";

grant select on table "public"."renungan_harian" to "anon";

grant update on table "public"."renungan_harian" to "anon";

grant delete on table "public"."renungan_harian" to "authenticated";

grant insert on table "public"."renungan_harian" to "authenticated";

grant select on table "public"."renungan_harian" to "authenticated";

grant update on table "public"."renungan_harian" to "authenticated";

grant delete on table "public"."renungan_harian" to "service_role";

grant insert on table "public"."renungan_harian" to "service_role";

grant select on table "public"."renungan_harian" to "service_role";

grant update on table "public"."renungan_harian" to "service_role";

grant delete on table "public"."renungan_log_validasi" to "anon";

grant insert on table "public"."renungan_log_validasi" to "anon";

grant select on table "public"."renungan_log_validasi" to "anon";

grant update on table "public"."renungan_log_validasi" to "anon";

grant delete on table "public"."renungan_log_validasi" to "authenticated";

grant insert on table "public"."renungan_log_validasi" to "authenticated";

grant select on table "public"."renungan_log_validasi" to "authenticated";

grant update on table "public"."renungan_log_validasi" to "authenticated";

grant delete on table "public"."renungan_log_validasi" to "service_role";

grant insert on table "public"."renungan_log_validasi" to "service_role";

grant select on table "public"."renungan_log_validasi" to "service_role";

grant update on table "public"."renungan_log_validasi" to "service_role";

grant delete on table "public"."renungan_revisi" to "anon";

grant insert on table "public"."renungan_revisi" to "anon";

grant select on table "public"."renungan_revisi" to "anon";

grant update on table "public"."renungan_revisi" to "anon";

grant delete on table "public"."renungan_revisi" to "authenticated";

grant insert on table "public"."renungan_revisi" to "authenticated";

grant select on table "public"."renungan_revisi" to "authenticated";

grant update on table "public"."renungan_revisi" to "authenticated";

grant delete on table "public"."renungan_revisi" to "service_role";

grant insert on table "public"."renungan_revisi" to "service_role";

grant select on table "public"."renungan_revisi" to "service_role";

grant update on table "public"."renungan_revisi" to "service_role";

grant delete on table "public"."rk3_transactions" to "anon";

grant insert on table "public"."rk3_transactions" to "anon";

grant select on table "public"."rk3_transactions" to "anon";

grant update on table "public"."rk3_transactions" to "anon";

grant delete on table "public"."rk3_transactions" to "authenticated";

grant insert on table "public"."rk3_transactions" to "authenticated";

grant select on table "public"."rk3_transactions" to "authenticated";

grant update on table "public"."rk3_transactions" to "authenticated";

grant delete on table "public"."roles" to "anon";

grant insert on table "public"."roles" to "anon";

grant select on table "public"."roles" to "anon";

grant update on table "public"."roles" to "anon";

grant delete on table "public"."sakramen_applications" to "anon";

grant insert on table "public"."sakramen_applications" to "anon";

grant select on table "public"."sakramen_applications" to "anon";

grant update on table "public"."sakramen_applications" to "anon";

grant delete on table "public"."sakramen_applications" to "authenticated";

grant insert on table "public"."sakramen_applications" to "authenticated";

grant select on table "public"."sakramen_applications" to "authenticated";

grant update on table "public"."sakramen_applications" to "authenticated";

grant delete on table "public"."sakramen_applications" to "service_role";

grant insert on table "public"."sakramen_applications" to "service_role";

grant select on table "public"."sakramen_applications" to "service_role";

grant update on table "public"."sakramen_applications" to "service_role";

grant delete on table "public"."sakramen_documents" to "anon";

grant insert on table "public"."sakramen_documents" to "anon";

grant select on table "public"."sakramen_documents" to "anon";

grant update on table "public"."sakramen_documents" to "anon";

grant delete on table "public"."sakramen_documents" to "authenticated";

grant insert on table "public"."sakramen_documents" to "authenticated";

grant select on table "public"."sakramen_documents" to "authenticated";

grant update on table "public"."sakramen_documents" to "authenticated";

grant delete on table "public"."sakramen_documents" to "service_role";

grant insert on table "public"."sakramen_documents" to "service_role";

grant select on table "public"."sakramen_documents" to "service_role";

grant update on table "public"."sakramen_documents" to "service_role";

grant delete on table "public"."sakramen_records" to "anon";

grant insert on table "public"."sakramen_records" to "anon";

grant select on table "public"."sakramen_records" to "anon";

grant update on table "public"."sakramen_records" to "anon";

grant delete on table "public"."sakramen_records" to "authenticated";

grant insert on table "public"."sakramen_records" to "authenticated";

grant select on table "public"."sakramen_records" to "authenticated";

grant update on table "public"."sakramen_records" to "authenticated";

grant delete on table "public"."sakramen_records" to "service_role";

grant insert on table "public"."sakramen_records" to "service_role";

grant select on table "public"."sakramen_records" to "service_role";

grant update on table "public"."sakramen_records" to "service_role";

grant delete on table "public"."sakramen_registrations" to "anon";

grant insert on table "public"."sakramen_registrations" to "anon";

grant select on table "public"."sakramen_registrations" to "anon";

grant update on table "public"."sakramen_registrations" to "anon";

grant delete on table "public"."sakramen_registrations" to "authenticated";

grant insert on table "public"."sakramen_registrations" to "authenticated";

grant select on table "public"."sakramen_registrations" to "authenticated";

grant update on table "public"."sakramen_registrations" to "authenticated";

grant delete on table "public"."sakramen_user" to "anon";

grant insert on table "public"."sakramen_user" to "anon";

grant select on table "public"."sakramen_user" to "anon";

grant update on table "public"."sakramen_user" to "anon";

grant delete on table "public"."sakramen_user" to "authenticated";

grant insert on table "public"."sakramen_user" to "authenticated";

grant select on table "public"."sakramen_user" to "authenticated";

grant update on table "public"."sakramen_user" to "authenticated";

grant delete on table "public"."social_media_links" to "anon";

grant insert on table "public"."social_media_links" to "anon";

grant select on table "public"."social_media_links" to "anon";

grant update on table "public"."social_media_links" to "anon";

grant delete on table "public"."social_media_links" to "authenticated";

grant insert on table "public"."social_media_links" to "authenticated";

grant select on table "public"."social_media_links" to "authenticated";

grant update on table "public"."social_media_links" to "authenticated";

grant delete on table "public"."social_media_links" to "service_role";

grant insert on table "public"."social_media_links" to "service_role";

grant select on table "public"."social_media_links" to "service_role";

grant update on table "public"."social_media_links" to "service_role";

grant delete on table "public"."sos_abuse_tracker" to "anon";

grant insert on table "public"."sos_abuse_tracker" to "anon";

grant select on table "public"."sos_abuse_tracker" to "anon";

grant update on table "public"."sos_abuse_tracker" to "anon";

grant delete on table "public"."sos_abuse_tracker" to "authenticated";

grant insert on table "public"."sos_abuse_tracker" to "authenticated";

grant select on table "public"."sos_abuse_tracker" to "authenticated";

grant update on table "public"."sos_abuse_tracker" to "authenticated";

grant delete on table "public"."sos_escalation_timers" to "anon";

grant insert on table "public"."sos_escalation_timers" to "anon";

grant select on table "public"."sos_escalation_timers" to "anon";

grant update on table "public"."sos_escalation_timers" to "anon";

grant delete on table "public"."sos_escalation_timers" to "authenticated";

grant insert on table "public"."sos_escalation_timers" to "authenticated";

grant select on table "public"."sos_escalation_timers" to "authenticated";

grant update on table "public"."sos_escalation_timers" to "authenticated";

grant delete on table "public"."sos_escalation_timers" to "service_role";

grant insert on table "public"."sos_escalation_timers" to "service_role";

grant select on table "public"."sos_escalation_timers" to "service_role";

grant update on table "public"."sos_escalation_timers" to "service_role";

grant delete on table "public"."sos_notification_log" to "anon";

grant insert on table "public"."sos_notification_log" to "anon";

grant select on table "public"."sos_notification_log" to "anon";

grant update on table "public"."sos_notification_log" to "anon";

grant delete on table "public"."sos_notification_log" to "authenticated";

grant insert on table "public"."sos_notification_log" to "authenticated";

grant select on table "public"."sos_notification_log" to "authenticated";

grant update on table "public"."sos_notification_log" to "authenticated";

grant delete on table "public"."sos_notification_log" to "service_role";

grant insert on table "public"."sos_notification_log" to "service_role";

grant select on table "public"."sos_notification_log" to "service_role";

grant update on table "public"."sos_notification_log" to "service_role";

grant delete on table "public"."sos_prayer_guides" to "anon";

grant insert on table "public"."sos_prayer_guides" to "anon";

grant select on table "public"."sos_prayer_guides" to "anon";

grant update on table "public"."sos_prayer_guides" to "anon";

grant delete on table "public"."sos_prayer_guides" to "authenticated";

grant insert on table "public"."sos_prayer_guides" to "authenticated";

grant select on table "public"."sos_prayer_guides" to "authenticated";

grant update on table "public"."sos_prayer_guides" to "authenticated";

grant delete on table "public"."sos_prayer_guides" to "service_role";

grant insert on table "public"."sos_prayer_guides" to "service_role";

grant select on table "public"."sos_prayer_guides" to "service_role";

grant update on table "public"."sos_prayer_guides" to "service_role";

grant delete on table "public"."sos_responses" to "anon";

grant insert on table "public"."sos_responses" to "anon";

grant select on table "public"."sos_responses" to "anon";

grant update on table "public"."sos_responses" to "anon";

grant delete on table "public"."sos_responses" to "authenticated";

grant insert on table "public"."sos_responses" to "authenticated";

grant select on table "public"."sos_responses" to "authenticated";

grant update on table "public"."sos_responses" to "authenticated";

grant delete on table "public"."structured_entity_chunks" to "anon";

grant insert on table "public"."structured_entity_chunks" to "anon";

grant select on table "public"."structured_entity_chunks" to "anon";

grant update on table "public"."structured_entity_chunks" to "anon";

grant delete on table "public"."structured_entity_chunks" to "authenticated";

grant insert on table "public"."structured_entity_chunks" to "authenticated";

grant select on table "public"."structured_entity_chunks" to "authenticated";

grant update on table "public"."structured_entity_chunks" to "authenticated";

grant delete on table "public"."structured_entity_chunks" to "service_role";

grant insert on table "public"."structured_entity_chunks" to "service_role";

grant select on table "public"."structured_entity_chunks" to "service_role";

grant update on table "public"."structured_entity_chunks" to "service_role";

grant delete on table "public"."super_admin_credentials" to "anon";

grant insert on table "public"."super_admin_credentials" to "anon";

grant select on table "public"."super_admin_credentials" to "anon";

grant update on table "public"."super_admin_credentials" to "anon";

grant delete on table "public"."super_admin_credentials" to "authenticated";

grant insert on table "public"."super_admin_credentials" to "authenticated";

grant select on table "public"."super_admin_credentials" to "authenticated";

grant update on table "public"."super_admin_credentials" to "authenticated";

grant delete on table "public"."super_admin_logs" to "anon";

grant insert on table "public"."super_admin_logs" to "anon";

grant select on table "public"."super_admin_logs" to "anon";

grant update on table "public"."super_admin_logs" to "anon";

grant delete on table "public"."super_admin_logs" to "authenticated";

grant insert on table "public"."super_admin_logs" to "authenticated";

grant select on table "public"."super_admin_logs" to "authenticated";

grant update on table "public"."super_admin_logs" to "authenticated";

grant delete on table "public"."surat_pastoral" to "anon";

grant insert on table "public"."surat_pastoral" to "anon";

grant select on table "public"."surat_pastoral" to "anon";

grant update on table "public"."surat_pastoral" to "anon";

grant delete on table "public"."surat_pastoral" to "authenticated";

grant insert on table "public"."surat_pastoral" to "authenticated";

grant select on table "public"."surat_pastoral" to "authenticated";

grant update on table "public"."surat_pastoral" to "authenticated";

grant delete on table "public"."system_notifications" to "anon";

grant insert on table "public"."system_notifications" to "anon";

grant select on table "public"."system_notifications" to "anon";

grant update on table "public"."system_notifications" to "anon";

grant delete on table "public"."system_notifications" to "authenticated";

grant insert on table "public"."system_notifications" to "authenticated";

grant select on table "public"."system_notifications" to "authenticated";

grant update on table "public"."system_notifications" to "authenticated";

grant delete on table "public"."tenaga_kerja" to "anon";

grant insert on table "public"."tenaga_kerja" to "anon";

grant select on table "public"."tenaga_kerja" to "anon";

grant update on table "public"."tenaga_kerja" to "anon";

grant delete on table "public"."tenaga_kerja" to "authenticated";

grant insert on table "public"."tenaga_kerja" to "authenticated";

grant select on table "public"."tenaga_kerja" to "authenticated";

grant update on table "public"."tenaga_kerja" to "authenticated";

grant delete on table "public"."theological_chunks" to "anon";

grant insert on table "public"."theological_chunks" to "anon";

grant select on table "public"."theological_chunks" to "anon";

grant update on table "public"."theological_chunks" to "anon";

grant delete on table "public"."theological_chunks" to "authenticated";

grant insert on table "public"."theological_chunks" to "authenticated";

grant select on table "public"."theological_chunks" to "authenticated";

grant update on table "public"."theological_chunks" to "authenticated";

grant delete on table "public"."theological_chunks" to "service_role";

grant insert on table "public"."theological_chunks" to "service_role";

grant select on table "public"."theological_chunks" to "service_role";

grant update on table "public"."theological_chunks" to "service_role";

grant delete on table "public"."umat_details" to "anon";

grant insert on table "public"."umat_details" to "anon";

grant select on table "public"."umat_details" to "anon";

grant update on table "public"."umat_details" to "anon";

grant delete on table "public"."umat_details" to "authenticated";

grant insert on table "public"."umat_details" to "authenticated";

grant select on table "public"."umat_details" to "authenticated";

grant update on table "public"."umat_details" to "authenticated";

grant delete on table "public"."umat_details" to "service_role";

grant insert on table "public"."umat_details" to "service_role";

grant select on table "public"."umat_details" to "service_role";

grant update on table "public"."umat_details" to "service_role";

grant delete on table "public"."umat_needs" to "anon";

grant insert on table "public"."umat_needs" to "anon";

grant select on table "public"."umat_needs" to "anon";

grant update on table "public"."umat_needs" to "anon";

grant delete on table "public"."umat_needs" to "authenticated";

grant insert on table "public"."umat_needs" to "authenticated";

grant select on table "public"."umat_needs" to "authenticated";

grant update on table "public"."umat_needs" to "authenticated";

grant delete on table "public"."umat_staging" to "anon";

grant insert on table "public"."umat_staging" to "anon";

grant select on table "public"."umat_staging" to "anon";

grant update on table "public"."umat_staging" to "anon";

grant delete on table "public"."umat_staging" to "authenticated";

grant insert on table "public"."umat_staging" to "authenticated";

grant select on table "public"."umat_staging" to "authenticated";

grant update on table "public"."umat_staging" to "authenticated";

grant delete on table "public"."umat_staging" to "service_role";

grant insert on table "public"."umat_staging" to "service_role";

grant select on table "public"."umat_staging" to "service_role";

grant update on table "public"."umat_staging" to "service_role";

grant delete on table "public"."usaha_umat" to "anon";

grant insert on table "public"."usaha_umat" to "anon";

grant select on table "public"."usaha_umat" to "anon";

grant update on table "public"."usaha_umat" to "anon";

grant delete on table "public"."usaha_umat" to "authenticated";

grant insert on table "public"."usaha_umat" to "authenticated";

grant select on table "public"."usaha_umat" to "authenticated";

grant update on table "public"."usaha_umat" to "authenticated";

grant delete on table "public"."user_ai_recommendations" to "anon";

grant insert on table "public"."user_ai_recommendations" to "anon";

grant references on table "public"."user_ai_recommendations" to "anon";

grant select on table "public"."user_ai_recommendations" to "anon";

grant trigger on table "public"."user_ai_recommendations" to "anon";

grant truncate on table "public"."user_ai_recommendations" to "anon";

grant update on table "public"."user_ai_recommendations" to "anon";

grant delete on table "public"."user_ai_recommendations" to "authenticated";

grant insert on table "public"."user_ai_recommendations" to "authenticated";

grant references on table "public"."user_ai_recommendations" to "authenticated";

grant select on table "public"."user_ai_recommendations" to "authenticated";

grant trigger on table "public"."user_ai_recommendations" to "authenticated";

grant truncate on table "public"."user_ai_recommendations" to "authenticated";

grant update on table "public"."user_ai_recommendations" to "authenticated";

grant delete on table "public"."user_ai_recommendations" to "service_role";

grant insert on table "public"."user_ai_recommendations" to "service_role";

grant references on table "public"."user_ai_recommendations" to "service_role";

grant select on table "public"."user_ai_recommendations" to "service_role";

grant trigger on table "public"."user_ai_recommendations" to "service_role";

grant truncate on table "public"."user_ai_recommendations" to "service_role";

grant update on table "public"."user_ai_recommendations" to "service_role";

grant delete on table "public"."user_ai_settings" to "anon";

grant insert on table "public"."user_ai_settings" to "anon";

grant select on table "public"."user_ai_settings" to "anon";

grant update on table "public"."user_ai_settings" to "anon";

grant delete on table "public"."user_ai_settings" to "authenticated";

grant insert on table "public"."user_ai_settings" to "authenticated";

grant select on table "public"."user_ai_settings" to "authenticated";

grant update on table "public"."user_ai_settings" to "authenticated";

grant delete on table "public"."user_api_keys" to "anon";

grant insert on table "public"."user_api_keys" to "anon";

grant select on table "public"."user_api_keys" to "anon";

grant update on table "public"."user_api_keys" to "anon";

grant delete on table "public"."user_learning_progress" to "anon";

grant insert on table "public"."user_learning_progress" to "anon";

grant select on table "public"."user_learning_progress" to "anon";

grant update on table "public"."user_learning_progress" to "anon";

grant delete on table "public"."user_learning_progress" to "authenticated";

grant insert on table "public"."user_learning_progress" to "authenticated";

grant select on table "public"."user_learning_progress" to "authenticated";

grant update on table "public"."user_learning_progress" to "authenticated";

grant delete on table "public"."user_roles" to "anon";

grant insert on table "public"."user_roles" to "anon";

grant select on table "public"."user_roles" to "anon";

grant update on table "public"."user_roles" to "anon";

grant delete on table "public"."user_roles" to "authenticated";

grant insert on table "public"."user_roles" to "authenticated";

grant select on table "public"."user_roles" to "authenticated";

grant update on table "public"."user_roles" to "authenticated";

grant delete on table "public"."user_settings" to "anon";

grant insert on table "public"."user_settings" to "anon";

grant select on table "public"."user_settings" to "anon";

grant update on table "public"."user_settings" to "anon";

grant delete on table "public"."user_skills" to "anon";

grant insert on table "public"."user_skills" to "anon";

grant select on table "public"."user_skills" to "anon";

grant update on table "public"."user_skills" to "anon";

grant delete on table "public"."user_skills" to "authenticated";

grant insert on table "public"."user_skills" to "authenticated";

grant select on table "public"."user_skills" to "authenticated";

grant update on table "public"."user_skills" to "authenticated";

grant delete on table "public"."wali_digital_lepaskan" to "anon";

grant insert on table "public"."wali_digital_lepaskan" to "anon";

grant select on table "public"."wali_digital_lepaskan" to "anon";

grant update on table "public"."wali_digital_lepaskan" to "anon";

grant delete on table "public"."wali_digital_lepaskan" to "authenticated";

grant insert on table "public"."wali_digital_lepaskan" to "authenticated";

grant select on table "public"."wali_digital_lepaskan" to "authenticated";

grant update on table "public"."wali_digital_lepaskan" to "authenticated";

grant delete on table "public"."wali_digital_lepaskan" to "service_role";

grant insert on table "public"."wali_digital_lepaskan" to "service_role";

grant select on table "public"."wali_digital_lepaskan" to "service_role";

grant update on table "public"."wali_digital_lepaskan" to "service_role";

grant delete on table "public"."wali_digital_log" to "anon";

grant insert on table "public"."wali_digital_log" to "anon";

grant select on table "public"."wali_digital_log" to "anon";

grant update on table "public"."wali_digital_log" to "anon";

grant delete on table "public"."wali_digital_log" to "authenticated";

grant insert on table "public"."wali_digital_log" to "authenticated";

grant select on table "public"."wali_digital_log" to "authenticated";

grant update on table "public"."wali_digital_log" to "authenticated";

grant delete on table "public"."wali_digital_log" to "service_role";

grant insert on table "public"."wali_digital_log" to "service_role";

grant select on table "public"."wali_digital_log" to "service_role";

grant update on table "public"."wali_digital_log" to "service_role";

grant delete on table "public"."warta_paroki" to "anon";

grant insert on table "public"."warta_paroki" to "anon";

grant select on table "public"."warta_paroki" to "anon";

grant update on table "public"."warta_paroki" to "anon";

grant delete on table "public"."warta_paroki" to "authenticated";

grant insert on table "public"."warta_paroki" to "authenticated";

grant select on table "public"."warta_paroki" to "authenticated";

grant update on table "public"."warta_paroki" to "authenticated";

grant delete on table "public"."warta_paroki" to "service_role";

grant insert on table "public"."warta_paroki" to "service_role";

grant select on table "public"."warta_paroki" to "service_role";

grant update on table "public"."warta_paroki" to "service_role";

grant delete on table "public"."wdl_access_log" to "anon";

grant insert on table "public"."wdl_access_log" to "anon";

grant select on table "public"."wdl_access_log" to "anon";

grant update on table "public"."wdl_access_log" to "anon";

grant delete on table "public"."wdl_access_log" to "authenticated";

grant insert on table "public"."wdl_access_log" to "authenticated";

grant select on table "public"."wdl_access_log" to "authenticated";

grant update on table "public"."wdl_access_log" to "authenticated";

grant delete on table "public"."wdl_consent" to "anon";

grant insert on table "public"."wdl_consent" to "anon";

grant select on table "public"."wdl_consent" to "anon";

grant update on table "public"."wdl_consent" to "anon";

grant delete on table "public"."wdl_consent" to "authenticated";

grant insert on table "public"."wdl_consent" to "authenticated";

grant select on table "public"."wdl_consent" to "authenticated";

grant update on table "public"."wdl_consent" to "authenticated";

grant delete on table "public"."whatsapp_logs" to "anon";

grant insert on table "public"."whatsapp_logs" to "anon";

grant select on table "public"."whatsapp_logs" to "anon";

grant update on table "public"."whatsapp_logs" to "anon";

grant delete on table "public"."whatsapp_logs" to "authenticated";

grant insert on table "public"."whatsapp_logs" to "authenticated";

grant select on table "public"."whatsapp_logs" to "authenticated";

grant update on table "public"."whatsapp_logs" to "authenticated";

grant delete on table "public"."whistleblower_reports" to "anon";

grant insert on table "public"."whistleblower_reports" to "anon";

grant select on table "public"."whistleblower_reports" to "anon";

grant update on table "public"."whistleblower_reports" to "anon";

grant delete on table "public"."whistleblower_reports" to "authenticated";

grant insert on table "public"."whistleblower_reports" to "authenticated";

grant select on table "public"."whistleblower_reports" to "authenticated";

grant update on table "public"."whistleblower_reports" to "authenticated";

grant delete on table "public"."wilayah" to "anon";

grant insert on table "public"."wilayah" to "anon";

grant select on table "public"."wilayah" to "anon";

grant update on table "public"."wilayah" to "anon";

grant delete on table "public"."wilayah" to "authenticated";

grant insert on table "public"."wilayah" to "authenticated";

grant select on table "public"."wilayah" to "authenticated";

grant update on table "public"."wilayah" to "authenticated";


  create policy "user_ai_recommendations_read_own"
  on "public"."user_ai_recommendations"
  as permissive
  for select
  to authenticated
using ((user_id = auth.uid()));



  create policy "user_ai_recommendations_update_own"
  on "public"."user_ai_recommendations"
  as permissive
  for update
  to authenticated
using ((user_id = auth.uid()));



  create policy "user_ai_recommendations_write_own"
  on "public"."user_ai_recommendations"
  as permissive
  for insert
  to authenticated
with check ((user_id = auth.uid()));



  create policy "Admin Lingkungan hanya bisa lihat profil lingkungan sendiri"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles p2
  WHERE ((p2.id = auth.uid()) AND (p2.role = 'admin_lingkungan'::text) AND ((profiles.lingkungan_slug = p2.lingkungan_slug) OR (profiles.id = auth.uid()))))));


CREATE TRIGGER trg_prayer_content_changed BEFORE UPDATE ON public.prayers_collection FOR EACH ROW EXECUTE FUNCTION public.mark_prayer_embedding_outdated();


