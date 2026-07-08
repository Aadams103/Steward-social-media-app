-- Steward schema foundation (part 1): enums and reusable RLS helper functions.
-- Additive only. Safe to apply on live Steward-prod.

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.steward_platform as enum (
    'facebook', 'instagram', 'tiktok', 'youtube', 'linkedin', 'x',
    'threads', 'pinterest', 'bluesky', 'google_business_profile',
    'reddit', 'slack', 'notion', 'other'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.steward_post_status as enum (
    'idea', 'draft', 'generated', 'needs_review', 'needs_approval',
    'approved', 'scheduled', 'publishing', 'published', 'failed', 'archived'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.steward_publish_job_status as enum (
    'queued', 'locked', 'processing', 'publishing', 'completed', 'succeeded',
    'failed', 'retrying', 'canceled', 'skipped'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.steward_approval_status as enum (
    'pending', 'in_review', 'approved', 'rejected', 'revision_requested', 'canceled'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.steward_asset_type as enum (
    'image', 'video', 'generated_image', 'generated_video', 'thumbnail',
    'raw_footage', 'edited_media', 'document', 'note', 'audio', 'caption',
    'transcript', 'ai_analysis', 'template', 'hashtags'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.steward_organization_role as enum (
    'owner', 'admin', 'strategist', 'editor', 'approver', 'viewer', 'client', 'service', 'member', 'manager', 'publisher', 'analyst'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.steward_ai_job_status as enum (
    'queued', 'running', 'succeeded', 'failed', 'canceled'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.steward_ai_job_type as enum (
    'caption_generation', 'content_repurposing', 'hashtag_generation', 'image_analysis',
    'video_analysis', 'transcription', 'scheduling_recommendation', 'performance_analysis',
    'brand_voice_training', 'content_scoring', 'post_idea_generation', 'variant_generation'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.steward_content_intake_source_type as enum (
    'user_upload', 'imported_post', 'pasted_caption', 'uploaded_video', 'uploaded_image',
    'external_url', 'rss_import', 'newsletter_import', 'content_idea', 'ai_draft',
    'recurring_source', 'api_ingest'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.steward_content_intake_status as enum (
    'new', 'processing', 'processed', 'failed', 'archived'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.steward_automation_trigger_type as enum (
    'schedule_cron', 'asset_uploaded', 'intake_received', 'class_schedule',
    'event_upcoming', 'post_published', 'approval_completed', 'manual'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.steward_automation_action_type as enum (
    'create_draft', 'generate_captions', 'generate_variants', 'schedule_post',
    'require_approval', 'publish_post', 'recycle_post', 'notify_team', 'run_ai_job'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.steward_notification_type as enum (
    'publish_failed', 'content_needs_review', 'ai_draft_ready', 'account_disconnected',
    'post_published', 'analytics_milestone', 'subscription_issue', 'approval_requested',
    'approval_decision', 'automation_run'
  );
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- RLS HELPERS (security definer, search_path locked)
-- ---------------------------------------------------------------------------
create or replace function public.is_org_member(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organizations o
    where o.id = p_org_id
      and (
        o.owner_id = auth.uid()
        or exists (
          select 1
          from public.organization_members om
          where om.organization_id = o.id
            and om.user_id = auth.uid()
        )
      )
  );
$$;

create or replace function public.get_org_role(p_org_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when exists (
      select 1 from public.organizations o
      where o.id = p_org_id and o.owner_id = auth.uid()
    ) then 'owner'
    else (
      select om.role
      from public.organization_members om
      where om.organization_id = p_org_id
        and om.user_id = auth.uid()
      limit 1
    )
  end;
$$;

create or replace function public.has_org_role(p_org_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.get_org_role(p_org_id), '') = any (p_roles);
$$;

create or replace function public.can_edit_org_content(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_org_role(
    p_org_id,
    array['owner','admin','strategist','editor','manager','publisher']
  );
$$;

create or replace function public.can_approve_org_content(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_org_role(
    p_org_id,
    array['owner','admin','approver','manager']
  );
$$;

create or replace function public.can_manage_org_settings(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_org_role(p_org_id, array['owner','admin']);
$$;

create or replace function public.is_brand_in_user_org(p_brand_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.brands b
    where b.id = p_brand_id
      and public.is_org_member(b.organization_id)
  );
$$;

revoke all on function public.is_org_member(uuid) from public;
revoke all on function public.get_org_role(uuid) from public;
revoke all on function public.has_org_role(uuid, text[]) from public;
revoke all on function public.can_edit_org_content(uuid) from public;
revoke all on function public.can_approve_org_content(uuid) from public;
revoke all on function public.can_manage_org_settings(uuid) from public;
revoke all on function public.is_brand_in_user_org(uuid) from public;

grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.get_org_role(uuid) to authenticated;
grant execute on function public.has_org_role(uuid, text[]) to authenticated;
grant execute on function public.can_edit_org_content(uuid) to authenticated;
grant execute on function public.can_approve_org_content(uuid) to authenticated;
grant execute on function public.can_manage_org_settings(uuid) to authenticated;
grant execute on function public.is_brand_in_user_org(uuid) to authenticated;
