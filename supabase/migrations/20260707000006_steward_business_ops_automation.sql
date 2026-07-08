-- Steward schema foundation (part 6): business ops, automation, audit, notifications.

-- ---------------------------------------------------------------------------
-- BUSINESS OPERATIONAL DATA
-- ---------------------------------------------------------------------------
create table if not exists public.business_locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  address text,
  city text,
  state text,
  postal_code text,
  country text,
  phone text,
  email text,
  timezone text not null default 'America/New_York',
  is_primary boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recurring_schedules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  location_id uuid references public.business_locations(id) on delete set null,
  name text not null,
  slug text not null,
  schedule_type text not null default 'class',
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time,
  timezone text not null default 'America/New_York',
  instructor_name text,
  audience_segment text,
  description text,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, slug)
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  location_id uuid references public.business_locations(id) on delete set null,
  name text not null,
  slug text not null,
  event_type text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  description text,
  registration_url text,
  is_promoted boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, slug)
);

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  slug text not null,
  offer_code text,
  headline text not null,
  description text,
  cta_text text,
  cta_url text,
  cta_phone text,
  valid_from timestamptz,
  valid_until timestamptz,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, slug)
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  author_name text not null,
  author_role text,
  quote text not null,
  rating numeric(2,1),
  is_featured boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  role_title text,
  bio text,
  photo_asset_id uuid references public.assets(id) on delete set null,
  is_public boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reusable_snippets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  slug text not null,
  snippet_type text not null,
  content text not null,
  tags jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, slug)
);

-- ---------------------------------------------------------------------------
-- AUTOMATION
-- ---------------------------------------------------------------------------
create table if not exists public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  trigger_type public.steward_automation_trigger_type not null,
  trigger_config jsonb not null default '{}'::jsonb,
  action_type public.steward_automation_action_type not null,
  action_config jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- AUDIT LOGS
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_type text not null default 'user',
  action text not null,
  entity_type text not null,
  entity_id text,
  before_state jsonb,
  after_state jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete set null,
  notification_type public.steward_notification_type not null,
  title text not null,
  body text,
  entity_type text,
  entity_id text,
  is_read boolean not null default false,
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists business_locations_brand_id_idx on public.business_locations (brand_id);
create index if not exists recurring_schedules_brand_day_idx on public.recurring_schedules (brand_id, day_of_week);
create index if not exists events_brand_starts_at_idx on public.events (brand_id, starts_at);
create index if not exists offers_brand_active_idx on public.offers (brand_id, is_active);
create index if not exists testimonials_brand_id_idx on public.testimonials (brand_id);
create index if not exists team_members_brand_id_idx on public.team_members (brand_id);
create index if not exists reusable_snippets_brand_type_idx on public.reusable_snippets (brand_id, snippet_type);
create index if not exists automation_rules_brand_enabled_idx on public.automation_rules (brand_id, enabled);
create index if not exists automation_rules_next_run_at_idx on public.automation_rules (next_run_at);
create index if not exists audit_logs_org_created_at_idx on public.audit_logs (organization_id, created_at desc);
create index if not exists notifications_user_read_idx on public.notifications (user_id, is_read, created_at desc);

create trigger business_locations_updated_at before update on public.business_locations for each row execute function public.set_updated_at();
create trigger recurring_schedules_updated_at before update on public.recurring_schedules for each row execute function public.set_updated_at();
create trigger events_updated_at before update on public.events for each row execute function public.set_updated_at();
create trigger offers_updated_at before update on public.offers for each row execute function public.set_updated_at();
create trigger testimonials_updated_at before update on public.testimonials for each row execute function public.set_updated_at();
create trigger team_members_updated_at before update on public.team_members for each row execute function public.set_updated_at();
create trigger reusable_snippets_updated_at before update on public.reusable_snippets for each row execute function public.set_updated_at();
create trigger automation_rules_updated_at before update on public.automation_rules for each row execute function public.set_updated_at();
