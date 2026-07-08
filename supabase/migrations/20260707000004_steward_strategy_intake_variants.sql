-- Steward schema foundation (part 4): strategy, intake, variants, scheduling.

-- ---------------------------------------------------------------------------
-- CONTENT STRATEGY
-- ---------------------------------------------------------------------------
create table if not exists public.content_pillars (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  color text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, slug)
);

create table if not exists public.content_topics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  pillar_id uuid references public.content_pillars(id) on delete set null,
  name text not null,
  slug text not null,
  description text,
  keywords jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, slug)
);

create table if not exists public.audience_segments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  demographics jsonb not null default '{}'::jsonb,
  interests jsonb not null default '[]'::jsonb,
  pain_points jsonb not null default '[]'::jsonb,
  preferred_platforms jsonb not null default '[]'::jsonb,
  is_primary boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, slug)
);

create table if not exists public.brand_offers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  slug text not null,
  offer_type text,
  headline text,
  description text,
  cta_text text,
  cta_url text,
  valid_from date,
  valid_until date,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, slug)
);

create table if not exists public.content_goals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  goal_type text not null,
  target_metric text,
  target_value numeric,
  period_start date,
  period_end date,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- FK posts -> pillars/topics (deferred until tables exist)
alter table public.posts
  drop constraint if exists posts_content_pillar_id_fkey;
alter table public.posts
  add constraint posts_content_pillar_id_fkey
  foreign key (content_pillar_id) references public.content_pillars(id) on delete set null;

alter table public.posts
  drop constraint if exists posts_topic_id_fkey;
alter table public.posts
  add constraint posts_topic_id_fkey
  foreign key (topic_id) references public.content_topics(id) on delete set null;

-- ---------------------------------------------------------------------------
-- CONTENT INTAKE
-- ---------------------------------------------------------------------------
create table if not exists public.content_intake_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete set null,
  ingested_post_id uuid references public.ingested_posts(id) on delete set null,
  source_type public.steward_content_intake_source_type not null,
  source_platform public.steward_platform,
  source_url text,
  raw_text text,
  media_asset_ids jsonb not null default '[]'::jsonb,
  detected_topic text,
  detected_audience text,
  detected_content_type text,
  ai_summary text,
  ai_recommendations jsonb not null default '{}'::jsonb,
  status public.steward_content_intake_status not null default 'new',
  processed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- POST VARIANTS
-- ---------------------------------------------------------------------------
create table if not exists public.post_variants (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete set null,
  platform public.steward_platform not null,
  caption text,
  hook text,
  hashtags jsonb not null default '[]'::jsonb,
  title text,
  description text,
  first_comment text,
  thumbnail_asset_id uuid references public.assets(id) on delete set null,
  media_asset_ids jsonb not null default '[]'::jsonb,
  character_count int,
  platform_validation_status text not null default 'pending',
  ai_notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (post_id, platform)
);

alter table public.publish_jobs
  drop constraint if exists publish_jobs_post_variant_id_fkey;
alter table public.publish_jobs
  add constraint publish_jobs_post_variant_id_fkey
  foreign key (post_variant_id) references public.post_variants(id) on delete set null;

-- ---------------------------------------------------------------------------
-- SCHEDULING / CALENDAR
-- ---------------------------------------------------------------------------
create table if not exists public.content_calendar_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  post_id uuid references public.posts(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  title text not null,
  scheduled_for timestamptz not null,
  timezone text not null default 'America/New_York',
  platform public.steward_platform,
  status text not null default 'planned',
  requires_approval boolean not null default true,
  queue_order int not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recurring_content_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  cron_expression text,
  day_of_week int[],
  time_of_day time,
  timezone text not null default 'America/New_York',
  platform public.steward_platform,
  content_pillar_id uuid references public.content_pillars(id) on delete set null,
  template_config jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blackout_dates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists content_pillars_brand_id_idx on public.content_pillars (brand_id);
create index if not exists content_topics_brand_id_idx on public.content_topics (brand_id);
create index if not exists content_topics_pillar_id_idx on public.content_topics (pillar_id);
create index if not exists audience_segments_brand_id_idx on public.audience_segments (brand_id);
create index if not exists brand_offers_brand_id_idx on public.brand_offers (brand_id);
create index if not exists content_goals_brand_id_idx on public.content_goals (brand_id);
create index if not exists content_intake_items_org_status_idx on public.content_intake_items (organization_id, status);
create index if not exists content_intake_items_brand_id_idx on public.content_intake_items (brand_id);
create index if not exists post_variants_post_id_idx on public.post_variants (post_id);
create index if not exists post_variants_platform_idx on public.post_variants (platform);
create index if not exists content_calendar_entries_scheduled_for_idx on public.content_calendar_entries (scheduled_for);
create index if not exists content_calendar_entries_brand_id_idx on public.content_calendar_entries (brand_id);
create index if not exists recurring_content_rules_next_run_at_idx on public.recurring_content_rules (next_run_at);
create index if not exists blackout_dates_org_starts_at_idx on public.blackout_dates (organization_id, starts_at);

-- updated_at triggers
create trigger content_pillars_updated_at before update on public.content_pillars for each row execute function public.set_updated_at();
create trigger content_topics_updated_at before update on public.content_topics for each row execute function public.set_updated_at();
create trigger audience_segments_updated_at before update on public.audience_segments for each row execute function public.set_updated_at();
create trigger brand_offers_updated_at before update on public.brand_offers for each row execute function public.set_updated_at();
create trigger content_goals_updated_at before update on public.content_goals for each row execute function public.set_updated_at();
create trigger content_intake_items_updated_at before update on public.content_intake_items for each row execute function public.set_updated_at();
create trigger post_variants_updated_at before update on public.post_variants for each row execute function public.set_updated_at();
create trigger content_calendar_entries_updated_at before update on public.content_calendar_entries for each row execute function public.set_updated_at();
create trigger recurring_content_rules_updated_at before update on public.recurring_content_rules for each row execute function public.set_updated_at();
