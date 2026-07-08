-- Steward AI Gateway: extend ai_jobs for structured logging, cost tracking, and new operations.

-- Add blocked status
alter type public.steward_ai_job_status add value if not exists 'blocked';

-- Extend operation types for AI Gateway
alter type public.steward_ai_job_type add value if not exists 'media_analysis';
alter type public.steward_ai_job_type add value if not exists 'post_draft_generation';
alter type public.steward_ai_job_type add value if not exists 'platform_variant_generation';
alter type public.steward_ai_job_type add value if not exists 'schedule_recommendation';
alter type public.steward_ai_job_type add value if not exists 'content_score';
alter type public.steward_ai_job_type add value if not exists 'brand_summary';
alter type public.steward_ai_job_type add value if not exists 'moderation_check';
alter type public.steward_ai_job_type add value if not exists 'automation_decision';

alter table public.ai_jobs
  add column if not exists operation text,
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists model text,
  add column if not exists request_input_json jsonb not null default '{}'::jsonb,
  add column if not exists response_output_json jsonb not null default '{}'::jsonb,
  add column if not exists structured_output_json jsonb not null default '{}'::jsonb,
  add column if not exists error_code text,
  add column if not exists prompt_version text,
  add column if not exists input_tokens int not null default 0,
  add column if not exists output_tokens int not null default 0,
  add column if not exists total_tokens int not null default 0,
  add column if not exists estimated_cost_cents int not null default 0;

-- Backfill from existing columns
update public.ai_jobs
set
  operation = coalesce(operation, job_type::text),
  user_id = coalesce(user_id, created_by),
  model = coalesce(model, model_name),
  request_input_json = case when request_input_json = '{}'::jsonb then input else request_input_json end,
  response_output_json = case when response_output_json = '{}'::jsonb then output else response_output_json end
where operation is null or user_id is null;

create index if not exists ai_jobs_user_id_idx on public.ai_jobs (user_id);
create index if not exists ai_jobs_operation_idx on public.ai_jobs (operation);
create index if not exists ai_jobs_org_created_at_idx on public.ai_jobs (organization_id, created_at desc);
create index if not exists ai_jobs_org_estimated_cost_idx on public.ai_jobs (organization_id, created_at, estimated_cost_cents);

-- Safe client view: hide raw request payloads from non-admin readers
create or replace view public.ai_jobs_safe as
select
  id, organization_id, brand_id, user_id, operation, job_type, status, model,
  model_provider, model_name, structured_output_json, error_code, error_message,
  prompt_version, input_tokens, output_tokens, total_tokens, estimated_cost_cents,
  started_at, completed_at, related_post_id, related_asset_id,
  metadata, created_at, updated_at
from public.ai_jobs;

grant select on public.ai_jobs_safe to authenticated;

comment on view public.ai_jobs_safe is
  'Client-safe AI job view excluding raw request/response prompt payloads.';
