-- Steward schema foundation (part 2): extend organizations, brands, members, profiles.

-- ---------------------------------------------------------------------------
-- ORGANIZATIONS
-- ---------------------------------------------------------------------------
alter table public.organizations
  add column if not exists org_type text,
  add column if not exists business_category text,
  add column if not exists timezone text not null default 'America/New_York',
  add column if not exists default_locale text not null default 'en-US',
  add column if not exists subscription_tier text,
  add column if not exists onboarding_status text not null default 'not_started',
  add column if not exists default_brand_id uuid references public.brands(id) on delete set null,
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists archived_at timestamptz;

create index if not exists organizations_onboarding_status_idx on public.organizations (onboarding_status);
create index if not exists organizations_archived_at_idx on public.organizations (archived_at) where archived_at is not null;

-- ---------------------------------------------------------------------------
-- ORGANIZATION MEMBERS
-- ---------------------------------------------------------------------------
alter table public.organization_members
  add column if not exists invited_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists organization_members_user_id_idx on public.organization_members (user_id);
create index if not exists organization_members_role_idx on public.organization_members (role);

drop trigger if exists organization_members_updated_at on public.organization_members;
create trigger organization_members_updated_at
  before update on public.organization_members
  for each row execute function public.set_updated_at();

-- Expand member management policies (additive)
drop policy if exists "Admins can manage org members" on public.organization_members;
create policy "Admins can manage org members"
  on public.organization_members for all
  using (public.can_manage_org_settings(organization_id))
  with check (public.can_manage_org_settings(organization_id));

-- ---------------------------------------------------------------------------
-- PROFILES (align with frontend updateMyProfile)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists username text,
  add column if not exists bio text;

create unique index if not exists profiles_username_unique_idx
  on public.profiles (lower(username))
  where username is not null;

-- ---------------------------------------------------------------------------
-- BRANDS (full brand profile)
-- ---------------------------------------------------------------------------
alter table public.brands
  add column if not exists business_name text,
  add column if not exists website text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists country text,
  add column if not exists industry text,
  add column if not exists audience_description text,
  add column if not exists ideal_customer_profiles jsonb not null default '[]'::jsonb,
  add column if not exists brand_voice text,
  add column if not exists words_to_use jsonb not null default '[]'::jsonb,
  add column if not exists words_to_avoid jsonb not null default '[]'::jsonb,
  add column if not exists tone_settings jsonb not null default '{}'::jsonb,
  add column if not exists cta_preferences jsonb not null default '[]'::jsonb,
  add column if not exists hashtag_bank jsonb not null default '[]'::jsonb,
  add column if not exists offer_language jsonb not null default '[]'::jsonb,
  add column if not exists posting_goals jsonb not null default '[]'::jsonb,
  add column if not exists competitor_notes text,
  add column if not exists platform_priorities jsonb not null default '[]'::jsonb,
  add column if not exists visual_style_notes text,
  add column if not exists logo_asset_id uuid,
  add column if not exists ai_system_instructions text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists archived_at timestamptz,
  add column if not exists is_default boolean not null default false;

create unique index if not exists brands_org_slug_unique_idx
  on public.brands (organization_id, slug);

create index if not exists brands_organization_id_idx on public.brands (organization_id);
create index if not exists brands_archived_at_idx on public.brands (archived_at) where archived_at is not null;

-- logo_asset_id FK added after assets extension in next migration
