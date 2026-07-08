-- Steward schema foundation (part 3): extend assets, posts, social_accounts, publish_jobs, ingested_posts.

-- ---------------------------------------------------------------------------
-- Expand platform CHECK constraints (threads, bluesky, other)
-- ---------------------------------------------------------------------------
alter table public.posts drop constraint if exists posts_platform_check;
alter table public.posts add constraint posts_platform_check check (
  platform in (
    'facebook','instagram','linkedin','tiktok','pinterest','reddit','slack','notion',
    'youtube','x','google_business_profile','threads','bluesky','other'
  )
);

alter table public.social_accounts drop constraint if exists social_accounts_platform_check;
alter table public.social_accounts add constraint social_accounts_platform_check check (
  platform in (
    'facebook','instagram','linkedin','tiktok','pinterest','reddit','slack','notion',
    'youtube','x','google_business_profile','threads','bluesky','other'
  )
);

alter table public.publish_jobs drop constraint if exists publish_jobs_platform_check;
alter table public.publish_jobs add constraint publish_jobs_platform_check check (
  platform in (
    'facebook','instagram','linkedin','tiktok','pinterest','reddit','slack','notion',
    'youtube','x','google_business_profile','threads','bluesky','other'
  )
);

-- Expand post status CHECK (backward compatible)
alter table public.posts drop constraint if exists posts_status_check;
alter table public.posts add constraint posts_status_check check (
  status in (
    'idea','draft','generated','needs_review','needs_approval','approved',
    'scheduled','publishing','published','failed','archived'
  )
);

-- Expand publish job status CHECK (backward compatible with worker)
alter table public.publish_jobs drop constraint if exists publish_jobs_status_check;
alter table public.publish_jobs add constraint publish_jobs_status_check check (
  status in (
    'queued','locked','processing','publishing','completed','succeeded',
    'failed','retrying','canceled','skipped'
  )
);

-- ---------------------------------------------------------------------------
-- ASSETS (content library)
-- ---------------------------------------------------------------------------
alter table public.assets drop constraint if exists assets_type_check;

alter table public.assets
  add column if not exists uploaded_by uuid references auth.users(id) on delete set null,
  add column if not exists storage_bucket text,
  add column if not exists storage_path text,
  add column if not exists public_url text,
  add column if not exists file_name text,
  add column if not exists file_type text,
  add column if not exists mime_type text,
  add column if not exists file_size bigint,
  add column if not exists duration_seconds numeric(10,2),
  add column if not exists width int,
  add column if not exists height int,
  add column if not exists alt_text text,
  add column if not exists transcription text,
  add column if not exists visual_analysis jsonb not null default '{}'::jsonb,
  add column if not exists detected_entities jsonb not null default '{}'::jsonb,
  add column if not exists location_context text,
  add column if not exists event_context text,
  add column if not exists usage_rights text,
  add column if not exists approval_status text not null default 'pending',
  add column if not exists content_category text,
  add column if not exists archived_at timestamptz;

-- Widen asset type constraint
alter table public.assets add constraint assets_type_check check (
  type in (
    'image','video','generated_image','generated_video','thumbnail','raw_footage',
    'edited_media','document','note','audio','caption','transcript','ai_analysis',
    'template','hashtags'
  )
);

create index if not exists assets_organization_id_idx on public.assets (organization_id);
create index if not exists assets_brand_id_idx on public.assets (brand_id);
create index if not exists assets_type_idx on public.assets (type);
create index if not exists assets_approval_status_idx on public.assets (approval_status);
create index if not exists assets_created_at_idx on public.assets (created_at desc);
create index if not exists assets_tags_gin_idx on public.assets using gin (tags jsonb_path_ops);

alter table public.brands
  drop constraint if exists brands_logo_asset_id_fkey;
alter table public.brands
  add constraint brands_logo_asset_id_fkey
  foreign key (logo_asset_id) references public.assets(id) on delete set null;

-- ---------------------------------------------------------------------------
-- POSTS (drafts / lifecycle)
-- ---------------------------------------------------------------------------
alter table public.posts
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists content_pillar_id uuid,
  add column if not exists topic_id uuid,
  add column if not exists title text,
  add column if not exists hook text,
  add column if not exists cta text,
  add column if not exists main_caption text,
  add column if not exists media_asset_ids jsonb not null default '[]'::jsonb,
  add column if not exists approval_state text not null default 'none',
  add column if not exists ai_generation_source text,
  add column if not exists assigned_to uuid references auth.users(id) on delete set null,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists archived_at timestamptz;

-- Backfill organization_id from brand when possible
update public.posts p
set organization_id = b.organization_id
from public.brands b
where p.brand_id = b.id
  and p.organization_id is null;

create index if not exists posts_organization_id_idx on public.posts (organization_id);
create index if not exists posts_brand_id_idx on public.posts (brand_id);
create index if not exists posts_status_idx on public.posts (status);
create index if not exists posts_scheduled_time_idx on public.posts (scheduled_time);
create index if not exists posts_published_time_idx on public.posts (published_time);
create index if not exists posts_campaign_id_idx on public.posts (campaign_id);

alter table public.posts
  drop constraint if exists posts_campaign_id_fkey;
alter table public.posts
  add constraint posts_campaign_id_fkey
  foreign key (campaign_id) references public.campaigns(id) on delete set null;

-- ---------------------------------------------------------------------------
-- SOCIAL ACCOUNTS (platform connections)
-- ---------------------------------------------------------------------------
alter table public.social_accounts
  add column if not exists handle text,
  add column if not exists profile_url text,
  add column if not exists platform_account_id text,
  add column if not exists auth_provider text,
  add column if not exists token_secret_id text,
  add column if not exists scopes jsonb not null default '[]'::jsonb,
  add column if not exists token_expires_at timestamptz,
  add column if not exists connection_status text not null default 'connected',
  add column if not exists posting_permissions jsonb not null default '{}'::jsonb,
  add column if not exists analytics_permissions jsonb not null default '{}'::jsonb,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists archived_at timestamptz;

-- Migrate username -> handle when handle empty
update public.social_accounts
set handle = username
where handle is null and username is not null;

update public.social_accounts
set platform_account_id = provider_account_id
where platform_account_id is null and provider_account_id is not null;

update public.social_accounts
set token_expires_at = oauth_expires_at
where token_expires_at is null and oauth_expires_at is not null;

create index if not exists social_accounts_organization_id_idx on public.social_accounts (organization_id);
create index if not exists social_accounts_brand_id_idx on public.social_accounts (brand_id);
create index if not exists social_accounts_platform_idx on public.social_accounts (platform);
create index if not exists social_accounts_connection_status_idx on public.social_accounts (connection_status);

-- ---------------------------------------------------------------------------
-- PUBLISH JOBS
-- ---------------------------------------------------------------------------
alter table public.publish_jobs
  add column if not exists post_id uuid references public.posts(id) on delete set null,
  add column if not exists post_variant_id uuid,
  add column if not exists social_account_id uuid references public.social_accounts(id) on delete set null,
  add column if not exists scheduled_for timestamptz,
  add column if not exists started_at timestamptz,
  add column if not exists platform_response jsonb,
  add column if not exists platform_post_id text,
  add column if not exists platform_url text,
  add column if not exists idempotency_key text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

update public.publish_jobs
set scheduled_for = scheduled_at
where scheduled_for is null and scheduled_at is not null;

update public.publish_jobs
set social_account_id = connection_id
where social_account_id is null and connection_id is not null;

create unique index if not exists publish_jobs_idempotency_key_unique_idx
  on public.publish_jobs (idempotency_key)
  where idempotency_key is not null;

create index if not exists publish_jobs_post_id_idx on public.publish_jobs (post_id);
create index if not exists publish_jobs_social_account_id_idx on public.publish_jobs (social_account_id);
create index if not exists publish_jobs_scheduled_for_idx on public.publish_jobs (scheduled_for);

-- ---------------------------------------------------------------------------
-- INGESTED POSTS (extend for intake pipeline)
-- ---------------------------------------------------------------------------
alter table public.ingested_posts
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists source_type text not null default 'api_ingest',
  add column if not exists source_url text,
  add column if not exists raw_text text,
  add column if not exists media_asset_ids jsonb not null default '[]'::jsonb,
  add column if not exists detected_topic text,
  add column if not exists detected_audience text,
  add column if not exists detected_content_type text,
  add column if not exists ai_summary text,
  add column if not exists ai_recommendations jsonb not null default '{}'::jsonb,
  add column if not exists status text not null default 'processed',
  add column if not exists processed_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

update public.ingested_posts ip
set organization_id = b.organization_id
from public.brands b
where ip.brand_id = b.id
  and ip.organization_id is null;

create index if not exists ingested_posts_organization_id_idx on public.ingested_posts (organization_id);
create index if not exists ingested_posts_status_idx on public.ingested_posts (status);

drop trigger if exists ingested_posts_updated_at on public.ingested_posts;
create trigger ingested_posts_updated_at
  before update on public.ingested_posts
  for each row execute function public.set_updated_at();
