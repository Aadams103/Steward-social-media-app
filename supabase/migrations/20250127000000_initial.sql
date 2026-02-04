-- Steward initial schema: aligns with server/src/types.ts and in-memory models.
-- RLS enabled on all application tables. Use service role in backend only.

-- ---------------------------------------------------------------------------
-- PROFILES (extends auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid,
  display_name text,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- ORGANIZATION MEMBERS (for RLS: user in org)
-- ---------------------------------------------------------------------------
create table if not exists public.organization_members (
  organization_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

alter table public.organization_members enable row level security;

create policy "Members can read own org membership"
  on public.organization_members for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- ORGANIZATIONS
-- ---------------------------------------------------------------------------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text default '',
  owner_id uuid not null references auth.users(id) on delete restrict,
  billing_plan text not null default 'professional',
  billing_status text not null default 'active',
  settings jsonb not null default '{"timezone":"America/New_York","defaultApprovalWindow":"2h","autoEnableNewAccounts":false,"requireMfaForPublishing":false}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organizations enable row level security;

create policy "Users can read orgs they own or are members of"
  on public.organizations for select using (
    owner_id = auth.uid() or
    exists (select 1 from public.organization_members om where om.organization_id = organizations.id and om.user_id = auth.uid())
  );
create policy "Owners can update their org"
  on public.organizations for update using (owner_id = auth.uid());
create policy "Users can create orgs"
  on public.organizations for insert with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- BRANDS
-- ---------------------------------------------------------------------------
create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  avatar_url text,
  color text,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.brands enable row level security;

create policy "Users can read brands in their orgs"
  on public.brands for select using (
    exists (
      select 1 from public.organizations o
      where o.id = brands.organization_id and (o.owner_id = auth.uid() or exists (select 1 from public.organization_members om where om.organization_id = o.id and om.user_id = auth.uid()))
    )
  );
create policy "Users can insert brands in their orgs"
  on public.brands for insert with check (
    exists (
      select 1 from public.organizations o
      where o.id = brands.organization_id and (o.owner_id = auth.uid() or exists (select 1 from public.organization_members om where om.organization_id = o.id and om.user_id = auth.uid()))
    )
  );
create policy "Users can update brands in their orgs"
  on public.brands for update using (
    exists (
      select 1 from public.organizations o
      where o.id = brands.organization_id and (o.owner_id = auth.uid() or exists (select 1 from public.organization_members om where om.organization_id = o.id and om.user_id = auth.uid()))
    )
  );
create policy "Users can delete brands in their orgs"
  on public.brands for delete using (
    exists (
      select 1 from public.organizations o
      where o.id = brands.organization_id and (o.owner_id = auth.uid() or exists (select 1 from public.organization_members om where om.organization_id = o.id and om.user_id = auth.uid()))
    )
  );

-- ---------------------------------------------------------------------------
-- POSTS
-- ---------------------------------------------------------------------------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  platform text not null check (platform in ('facebook','instagram','linkedin','tiktok','pinterest','reddit','slack','notion')),
  status text not null check (status in ('draft','needs_approval','approved','scheduled','published','failed')),
  scheduled_time timestamptz,
  published_time timestamptz,
  published_id text,
  campaign_id uuid,
  author_id uuid not null references auth.users(id) on delete restrict,
  brand_id uuid references public.brands(id) on delete set null,
  media_urls jsonb default '[]',
  hashtags jsonb default '[]',
  metrics jsonb,
  recurrence_schedule jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.posts enable row level security;

create policy "Users can read posts for brands in their orgs or own posts"
  on public.posts for select using (
    author_id = auth.uid() or
    (brand_id is not null and exists (
      select 1 from public.brands b
      join public.organizations o on o.id = b.organization_id
      where b.id = posts.brand_id and (o.owner_id = auth.uid() or exists (select 1 from public.organization_members om where om.organization_id = o.id and om.user_id = auth.uid()))
    ))
  );
create policy "Users can insert posts in their orgs"
  on public.posts for insert with check (author_id = auth.uid());
create policy "Users can update their posts or posts in their orgs"
  on public.posts for update using (author_id = auth.uid());
create policy "Users can delete their posts"
  on public.posts for delete using (author_id = auth.uid());

-- ---------------------------------------------------------------------------
-- CAMPAIGNS
-- ---------------------------------------------------------------------------
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  start_date date,
  end_date date,
  goal text,
  post_count int not null default 0,
  total_engagement int not null default 0,
  status text not null check (status in ('active','paused','completed')),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.campaigns enable row level security;

create policy "Users can read campaigns in their orgs"
  on public.campaigns for select using (
    exists (
      select 1 from public.organizations o
      where o.id = campaigns.organization_id and (o.owner_id = auth.uid() or exists (select 1 from public.organization_members om where om.organization_id = o.id and om.user_id = auth.uid()))
    )
  );
create policy "Users can manage campaigns in their orgs"
  on public.campaigns for all using (
    exists (
      select 1 from public.organizations o
      where o.id = campaigns.organization_id and (o.owner_id = auth.uid() or exists (select 1 from public.organization_members om where om.organization_id = o.id and om.user_id = auth.uid()))
    )
  );

-- ---------------------------------------------------------------------------
-- SOCIAL_ACCOUNTS
-- ---------------------------------------------------------------------------
create table if not exists public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  platform text not null check (platform in ('facebook','instagram','linkedin','tiktok','pinterest','reddit','slack','notion')),
  username text not null,
  display_name text not null,
  avatar_url text,
  is_connected boolean not null default true,
  status text not null default 'connected' check (status in ('connected','disconnected','error','stub')),
  last_sync timestamptz,
  follower_count int,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider_account_id text,
  oauth_access_token text,
  oauth_refresh_token text,
  oauth_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.social_accounts enable row level security;

create policy "Users can read social_accounts in their orgs"
  on public.social_accounts for select using (
    exists (
      select 1 from public.organizations o
      where o.id = social_accounts.organization_id and (o.owner_id = auth.uid() or exists (select 1 from public.organization_members om where om.organization_id = o.id and om.user_id = auth.uid()))
    )
  );
create policy "Users can manage social_accounts in their orgs"
  on public.social_accounts for all using (
    exists (
      select 1 from public.organizations o
      where o.id = social_accounts.organization_id and (o.owner_id = auth.uid() or exists (select 1 from public.organization_members om where om.organization_id = o.id and om.user_id = auth.uid()))
    )
  );

-- ---------------------------------------------------------------------------
-- ASSETS
-- ---------------------------------------------------------------------------
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('image','video','template','hashtags')),
  brand_id uuid references public.brands(id) on delete set null,
  url text,
  metadata jsonb default '{}',
  version text not null default '1',
  tags jsonb default '[]',
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.assets enable row level security;

create policy "Users can read assets in their orgs"
  on public.assets for select using (
    exists (
      select 1 from public.organizations o
      where o.id = assets.organization_id and (o.owner_id = auth.uid() or exists (select 1 from public.organization_members om where om.organization_id = o.id and om.user_id = auth.uid()))
    )
  );
create policy "Users can manage assets in their orgs"
  on public.assets for all using (
    exists (
      select 1 from public.organizations o
      where o.id = assets.organization_id and (o.owner_id = auth.uid() or exists (select 1 from public.organization_members om where om.organization_id = o.id and om.user_id = auth.uid()))
    )
  );

-- ---------------------------------------------------------------------------
-- PUBLISH_JOBS
-- ---------------------------------------------------------------------------
create table if not exists public.publish_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  connection_id uuid not null,
  platform text not null check (platform in ('facebook','instagram','linkedin','tiktok','pinterest','reddit','slack','notion')),
  post_content jsonb not null,
  status text not null check (status in ('queued','processing','completed','failed','retrying')),
  priority int not null default 0,
  scheduled_at timestamptz not null,
  processed_at timestamptz,
  completed_at timestamptz,
  attempt_count int not null default 0,
  max_attempts int not null default 3,
  last_attempt_at timestamptz,
  retry_backoff_ms int not null default 1000,
  published_post_id uuid,
  published_url text,
  error_code text,
  error_message text,
  brand_id uuid references public.brands(id) on delete set null,
  created_by_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.publish_jobs enable row level security;

create policy "Users can read publish_jobs in their orgs"
  on public.publish_jobs for select using (
    exists (
      select 1 from public.organizations o
      where o.id = publish_jobs.organization_id and (o.owner_id = auth.uid() or exists (select 1 from public.organization_members om where om.organization_id = o.id and om.user_id = auth.uid()))
    )
  );
create policy "Users can manage publish_jobs in their orgs"
  on public.publish_jobs for all using (
    exists (
      select 1 from public.organizations o
      where o.id = publish_jobs.organization_id and (o.owner_id = auth.uid() or exists (select 1 from public.organization_members om where om.organization_id = o.id and om.user_id = auth.uid()))
    )
  );

-- ---------------------------------------------------------------------------
-- OAUTH_STATES (for social-ingestion: persist OAuth state)
-- ---------------------------------------------------------------------------
create table if not exists public.oauth_states (
  state text primary key,
  brand_id text not null,
  purpose text,
  provider text not null check (provider in ('google','meta')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.oauth_states enable row level security;

create policy "No direct read from client; backend uses service role"
  on public.oauth_states for select using (false);
create policy "No direct write from client; backend uses service role"
  on public.oauth_states for insert with check (false);

-- ---------------------------------------------------------------------------
-- FKs: add after referenced tables exist
-- ---------------------------------------------------------------------------
alter table public.profiles
  add constraint profiles_organization_id_fkey
  foreign key (organization_id) references public.organizations(id) on delete set null;

alter table public.organization_members
  add constraint organization_members_organization_id_fkey
  foreign key (organization_id) references public.organizations(id) on delete cascade;

-- ---------------------------------------------------------------------------
-- TRIGGER: updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger organizations_updated_at before update on public.organizations for each row execute function public.set_updated_at();
create trigger brands_updated_at before update on public.brands for each row execute function public.set_updated_at();
create trigger posts_updated_at before update on public.posts for each row execute function public.set_updated_at();
create trigger campaigns_updated_at before update on public.campaigns for each row execute function public.set_updated_at();
create trigger social_accounts_updated_at before update on public.social_accounts for each row execute function public.set_updated_at();
create trigger assets_updated_at before update on public.assets for each row execute function public.set_updated_at();
create trigger publish_jobs_updated_at before update on public.publish_jobs for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- HANDLE NEW AUTH USER -> PROFILES
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'full_name',
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
