-- Steward schema foundation (part 5): AI jobs, approvals, analytics, learning.

-- ---------------------------------------------------------------------------
-- AI JOBS
-- ---------------------------------------------------------------------------
create table if not exists public.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete set null,
  job_type public.steward_ai_job_type not null,
  model_provider text,
  model_name text,
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  status public.steward_ai_job_status not null default 'queued',
  error_message text,
  token_usage jsonb not null default '{}'::jsonb,
  cost_estimate numeric(12,6),
  created_by uuid references auth.users(id) on delete set null,
  related_post_id uuid references public.posts(id) on delete set null,
  related_asset_id uuid references public.assets(id) on delete set null,
  started_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- APPROVAL WORKFLOW
-- ---------------------------------------------------------------------------
create table if not exists public.content_approvals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete set null,
  post_id uuid not null references public.posts(id) on delete cascade,
  status public.steward_approval_status not null default 'pending',
  requested_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  revision_notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.approval_steps (
  id uuid primary key default gen_random_uuid(),
  approval_id uuid not null references public.content_approvals(id) on delete cascade,
  step_order int not null default 1,
  approver_role text,
  assigned_to uuid references auth.users(id) on delete set null,
  status public.steward_approval_status not null default 'pending',
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.approval_comments (
  id uuid primary key default gen_random_uuid(),
  approval_id uuid not null references public.content_approvals(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- ANALYTICS
-- ---------------------------------------------------------------------------
create table if not exists public.social_post_publications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete set null,
  post_id uuid references public.posts(id) on delete set null,
  post_variant_id uuid references public.post_variants(id) on delete set null,
  publish_job_id uuid references public.publish_jobs(id) on delete set null,
  social_account_id uuid references public.social_accounts(id) on delete set null,
  platform public.steward_platform not null,
  platform_post_id text,
  platform_url text,
  published_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.post_metrics_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  publication_id uuid not null references public.social_post_publications(id) on delete cascade,
  collected_at timestamptz not null default now(),
  impressions bigint not null default 0,
  reach bigint not null default 0,
  likes bigint not null default 0,
  comments bigint not null default 0,
  shares bigint not null default 0,
  saves bigint not null default 0,
  clicks bigint not null default 0,
  video_views bigint not null default 0,
  watch_time_seconds bigint not null default 0,
  profile_visits bigint not null default 0,
  followers_gained bigint not null default 0,
  engagement_rate numeric(8,4),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.platform_account_metrics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  social_account_id uuid not null references public.social_accounts(id) on delete cascade,
  collected_at timestamptz not null default now(),
  followers bigint,
  following bigint,
  posts_count bigint,
  impressions bigint,
  reach bigint,
  engagement_rate numeric(8,4),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.audience_growth_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete set null,
  social_account_id uuid references public.social_accounts(id) on delete set null,
  collected_at timestamptz not null default now(),
  followers bigint not null default 0,
  followers_gained bigint not null default 0,
  unfollows bigint not null default 0,
  metadata jsonb not null default '{}'::jsonb
);

-- ---------------------------------------------------------------------------
-- LEARNING / INSIGHTS
-- ---------------------------------------------------------------------------
create table if not exists public.content_insights (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  insight_type text not null,
  insight_key text not null,
  insight_value jsonb not null default '{}'::jsonb,
  confidence numeric(5,4),
  sample_size int,
  period_start timestamptz,
  period_end timestamptz,
  recommended_actions jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_jobs_org_status_idx on public.ai_jobs (organization_id, status);
create index if not exists ai_jobs_job_type_idx on public.ai_jobs (job_type);
create index if not exists content_approvals_post_id_idx on public.content_approvals (post_id);
create index if not exists content_approvals_status_idx on public.content_approvals (status);
create index if not exists approval_steps_approval_id_idx on public.approval_steps (approval_id);
create index if not exists social_post_publications_post_id_idx on public.social_post_publications (post_id);
create index if not exists post_metrics_snapshots_publication_id_idx on public.post_metrics_snapshots (publication_id);
create index if not exists post_metrics_snapshots_collected_at_idx on public.post_metrics_snapshots (collected_at desc);
create index if not exists platform_account_metrics_account_id_idx on public.platform_account_metrics (social_account_id, collected_at desc);
create index if not exists audience_growth_snapshots_brand_id_idx on public.audience_growth_snapshots (brand_id, collected_at desc);
create index if not exists content_insights_brand_type_idx on public.content_insights (brand_id, insight_type);

create trigger ai_jobs_updated_at before update on public.ai_jobs for each row execute function public.set_updated_at();
create trigger content_approvals_updated_at before update on public.content_approvals for each row execute function public.set_updated_at();
create trigger approval_steps_updated_at before update on public.approval_steps for each row execute function public.set_updated_at();
create trigger content_insights_updated_at before update on public.content_insights for each row execute function public.set_updated_at();
