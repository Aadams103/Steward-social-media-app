-- Steward Brand Intelligence (part 1): core identity, preferences, hashtags, CTAs, rules, platform strategy.

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.steward_brand_rule_type as enum (
    'required', 'forbidden', 'approval_required', 'tone', 'safety', 'compliance',
    'kids_content', 'claims', 'platform', 'publishing'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.steward_rule_severity as enum ('info', 'warning', 'block');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.steward_cta_type as enum (
    'free_trial', 'website', 'phone_call', 'dm', 'booking', 'newsletter',
    'signup', 'purchase', 'visit_location', 'learn_more', 'other'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.steward_memory_fact_type as enum (
    'business_fact', 'brand_preference', 'user_preference', 'audience_fact',
    'content_rule', 'platform_preference', 'learned_insight', 'schedule_fact', 'offer_fact'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.steward_content_feedback_type as enum (
    'liked', 'disliked', 'too_generic', 'wrong_tone', 'wrong_fact', 'too_long',
    'too_short', 'good_hook', 'bad_hook', 'wrong_audience', 'unsafe', 'off_brand'
  );
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- BRAND PROFILES (deep identity — complements brands table)
-- ---------------------------------------------------------------------------
create table if not exists public.brand_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid not null unique references public.brands(id) on delete cascade,
  business_name text,
  public_brand_name text,
  business_type text,
  industry text,
  niche text,
  website_url text,
  phone text,
  public_email text,
  address_line_1 text,
  address_line_2 text,
  city text,
  state text,
  postal_code text,
  country text,
  timezone text not null default 'America/Chicago',
  short_description text,
  long_description text,
  origin_story text,
  mission_statement text,
  values jsonb not null default '[]'::jsonb,
  unique_selling_points jsonb not null default '[]'::jsonb,
  primary_goals jsonb not null default '[]'::jsonb,
  secondary_goals jsonb not null default '[]'::jsonb,
  brand_voice_summary text,
  default_tone text,
  personality_traits jsonb not null default '[]'::jsonb,
  words_to_use jsonb not null default '[]'::jsonb,
  words_to_avoid jsonb not null default '[]'::jsonb,
  phrases_to_use jsonb not null default '[]'::jsonb,
  phrases_to_avoid jsonb not null default '[]'::jsonb,
  compliance_notes text,
  safety_notes text,
  ai_system_notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

-- ---------------------------------------------------------------------------
-- USER BRAND PREFERENCES
-- ---------------------------------------------------------------------------
create table if not exists public.user_brand_preferences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  preferred_tone text,
  preferred_caption_length text,
  preferred_hashtag_count int,
  preferred_cta_style text,
  preferred_emoji_level text,
  preferred_formality text,
  approval_strictness text not null default 'normal',
  auto_generation_enabled boolean not null default true,
  auto_schedule_enabled boolean not null default false,
  auto_publish_enabled boolean not null default false,
  always_require_review boolean not null default true,
  personal_phrases jsonb not null default '[]'::jsonb,
  personal_hashtags jsonb not null default '[]'::jsonb,
  disliked_phrases jsonb not null default '[]'::jsonb,
  disliked_styles jsonb not null default '[]'::jsonb,
  notes text,
  learned_preferences_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, user_id)
);

-- ---------------------------------------------------------------------------
-- BRAND HASHTAGS
-- ---------------------------------------------------------------------------
create table if not exists public.brand_hashtags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  hashtag text not null,
  category text,
  platform text,
  priority int not null default 0,
  usage_count int not null default 0,
  last_used_at timestamptz,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, hashtag)
);

-- ---------------------------------------------------------------------------
-- BRAND CTAS
-- ---------------------------------------------------------------------------
create table if not exists public.brand_ctas (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  label text not null,
  cta_text text not null,
  cta_type public.steward_cta_type not null default 'learn_more',
  destination_url text,
  phone text,
  platform text,
  priority int not null default 0,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- BRAND RULES
-- ---------------------------------------------------------------------------
create table if not exists public.brand_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  rule_type public.steward_brand_rule_type not null,
  rule_name text not null,
  rule_description text not null,
  severity public.steward_rule_severity not null default 'warning',
  applies_to_platforms jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- PLATFORM STRATEGY
-- ---------------------------------------------------------------------------
create table if not exists public.platform_strategy (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  platform public.steward_platform not null,
  enabled boolean not null default true,
  priority int not null default 0,
  target_audience text,
  content_types jsonb not null default '[]'::jsonb,
  posting_frequency_goal int,
  preferred_posting_windows jsonb not null default '[]'::jsonb,
  caption_style text,
  hashtag_strategy text,
  media_requirements jsonb not null default '{}'::jsonb,
  approval_required boolean not null default true,
  auto_publish_allowed boolean not null default false,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, platform)
);

create index if not exists brand_profiles_org_idx on public.brand_profiles (organization_id);
create index if not exists user_brand_preferences_user_idx on public.user_brand_preferences (user_id, brand_id);
create index if not exists brand_hashtags_brand_active_idx on public.brand_hashtags (brand_id, active);
create index if not exists brand_ctas_brand_active_idx on public.brand_ctas (brand_id, active);
create index if not exists brand_rules_brand_active_idx on public.brand_rules (brand_id, active);
create index if not exists platform_strategy_brand_idx on public.platform_strategy (brand_id);

create trigger brand_profiles_updated_at before update on public.brand_profiles for each row execute function public.set_updated_at();
create trigger user_brand_preferences_updated_at before update on public.user_brand_preferences for each row execute function public.set_updated_at();
create trigger brand_hashtags_updated_at before update on public.brand_hashtags for each row execute function public.set_updated_at();
create trigger brand_ctas_updated_at before update on public.brand_ctas for each row execute function public.set_updated_at();
create trigger brand_rules_updated_at before update on public.brand_rules for each row execute function public.set_updated_at();
create trigger platform_strategy_updated_at before update on public.platform_strategy for each row execute function public.set_updated_at();
