-- Steward Brand Intelligence (part 2): AI memory, context snapshots, feedback, safety reviews.

-- ---------------------------------------------------------------------------
-- AI MEMORY FACTS
-- ---------------------------------------------------------------------------
create table if not exists public.ai_memory_facts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  fact_type public.steward_memory_fact_type not null,
  fact_key text not null,
  fact_value jsonb not null default '{}'::jsonb,
  confidence numeric(5,4) not null default 0.5,
  source text not null default 'system',
  source_record_type text,
  source_record_id text,
  approved boolean not null default false,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create unique index if not exists ai_memory_facts_brand_key_active_idx
  on public.ai_memory_facts (brand_id, fact_type, fact_key)
  where archived_at is null;

-- ---------------------------------------------------------------------------
-- AI CONTEXT SNAPSHOTS
-- ---------------------------------------------------------------------------
create table if not exists public.ai_context_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  ai_job_id uuid references public.ai_jobs(id) on delete set null,
  operation text not null,
  context_json jsonb not null default '{}'::jsonb,
  context_hash text not null,
  prompt_version text,
  created_at timestamptz not null default now()
);

create index if not exists ai_context_snapshots_job_idx on public.ai_context_snapshots (ai_job_id);
create index if not exists ai_context_snapshots_brand_created_idx on public.ai_context_snapshots (brand_id, created_at desc);

-- ---------------------------------------------------------------------------
-- AI DECISION LOGS
-- ---------------------------------------------------------------------------
create table if not exists public.ai_decision_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  ai_job_id uuid references public.ai_jobs(id) on delete set null,
  decision_type text not null,
  recommendation jsonb not null default '{}'::jsonb,
  reasoning_summary text,
  confidence numeric(5,4),
  accepted_by_user boolean,
  rejected_by_user boolean,
  user_feedback text,
  resulting_record_type text,
  resulting_record_id text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- CONTENT FEEDBACK
-- ---------------------------------------------------------------------------
create table if not exists public.content_feedback (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid references public.posts(id) on delete set null,
  ai_job_id uuid references public.ai_jobs(id) on delete set null,
  feedback_type public.steward_content_feedback_type not null,
  rating int check (rating between 1 and 5),
  comment text,
  selected_reason text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- CONTENT SAFETY REVIEWS
-- ---------------------------------------------------------------------------
create table if not exists public.content_safety_reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  post_id uuid references public.posts(id) on delete set null,
  asset_id uuid references public.assets(id) on delete set null,
  ai_job_id uuid references public.ai_jobs(id) on delete set null,
  risk_level text not null default 'low',
  approved boolean not null default false,
  human_review_required boolean not null default false,
  policy_flags jsonb not null default '[]'::jsonb,
  brand_rule_flags jsonb not null default '[]'::jsonb,
  platform_flags jsonb not null default '[]'::jsonb,
  notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Extend ai_jobs with context snapshot + validation fields
alter table public.ai_jobs
  add column if not exists context_snapshot_id uuid references public.ai_context_snapshots(id) on delete set null,
  add column if not exists prompt_name text,
  add column if not exists validation_status text,
  add column if not exists validation_errors jsonb not null default '[]'::jsonb;

create index if not exists ai_memory_facts_brand_approved_idx on public.ai_memory_facts (brand_id, approved) where archived_at is null;
create index if not exists content_feedback_brand_idx on public.content_feedback (brand_id, created_at desc);
create index if not exists content_safety_reviews_post_idx on public.content_safety_reviews (post_id);
create index if not exists ai_decision_logs_job_idx on public.ai_decision_logs (ai_job_id);

create trigger ai_memory_facts_updated_at before update on public.ai_memory_facts for each row execute function public.set_updated_at();
