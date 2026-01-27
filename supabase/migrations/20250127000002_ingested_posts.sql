-- Ingested posts from platform APIs (e.g. Instagram Graph). Idempotent by (platform, external_id).

create table if not exists public.ingested_posts (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id) on delete cascade,
  platform text not null,
  external_id text not null,
  payload jsonb not null default '{}',
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (platform, external_id)
);

create index if not exists idx_ingested_posts_brand_platform on public.ingested_posts (brand_id, platform);
create index if not exists idx_ingested_posts_fetched_at on public.ingested_posts (fetched_at desc);

alter table public.ingested_posts enable row level security;

create policy "Users can read ingested_posts for brands in their orgs"
  on public.ingested_posts for select using (
    brand_id is null or exists (
      select 1 from public.brands b
      join public.organizations o on o.id = b.organization_id
      where b.id = ingested_posts.brand_id and (o.owner_id = auth.uid() or exists (select 1 from public.organization_members om where om.organization_id = o.id and om.user_id = auth.uid()))
    )
  );

-- Insert/update/delete only via service role (backend); no policies for anon/authenticated write.
