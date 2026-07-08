-- Steward Brand Intelligence (part 3): extend existing strategy/ops tables.

-- audience_segments
alter table public.audience_segments
  add column if not exists goals jsonb not null default '[]'::jsonb,
  add column if not exists objections jsonb not null default '[]'::jsonb,
  add column if not exists preferred_language text,
  add column if not exists content_angles jsonb not null default '[]'::jsonb,
  add column if not exists platforms jsonb not null default '[]'::jsonb,
  add column if not exists priority int not null default 0,
  add column if not exists archived_at timestamptz;

-- content_pillars
alter table public.content_pillars
  add column if not exists audience_segment_ids jsonb not null default '[]'::jsonb,
  add column if not exists example_topics jsonb not null default '[]'::jsonb,
  add column if not exists example_hooks jsonb not null default '[]'::jsonb,
  add column if not exists preferred_ctas jsonb not null default '[]'::jsonb,
  add column if not exists preferred_platforms jsonb not null default '[]'::jsonb,
  add column if not exists posting_frequency_goal int,
  add column if not exists priority int not null default 0;

-- business_locations
alter table public.business_locations
  add column if not exists address_line_1 text,
  add column if not exists address_line_2 text,
  add column if not exists website_url text,
  add column if not exists location_notes text,
  add column if not exists active boolean not null default true;

update public.business_locations set address_line_1 = address where address_line_1 is null and address is not null;

-- recurring_schedules
alter table public.recurring_schedules
  add column if not exists title text,
  add column if not exists audience_segment_id uuid references public.audience_segments(id) on delete set null,
  add column if not exists content_pillar_id uuid references public.content_pillars(id) on delete set null,
  add column if not exists archived_at timestamptz;

update public.recurring_schedules set title = name where title is null;

-- brand_offers extend
alter table public.brand_offers
  add column if not exists title text,
  add column if not exists cta_id uuid,
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists terms text,
  add column if not exists target_audience_segment_ids jsonb not null default '[]'::jsonb,
  add column if not exists platform_priority jsonb not null default '[]'::jsonb;

update public.brand_offers set title = name where title is null;

-- offers table (operational) — mirror key fields
alter table public.offers
  add column if not exists title text,
  add column if not exists offer_type text,
  add column if not exists cta_id uuid,
  add column if not exists terms text,
  add column if not exists target_audience_segment_ids jsonb not null default '[]'::jsonb,
  add column if not exists platform_priority jsonb not null default '[]'::jsonb;

update public.offers set title = headline where title is null;

-- reusable_snippets extend
alter table public.reusable_snippets
  add column if not exists label text,
  add column if not exists text text,
  add column if not exists platform text,
  add column if not exists content_pillar_id uuid references public.content_pillars(id) on delete set null,
  add column if not exists usage_count int not null default 0,
  add column if not exists last_used_at timestamptz;

update public.reusable_snippets set label = name where label is null;
update public.reusable_snippets set text = content where text is null and content is not null;

-- Link brand_offers/offers cta_id after brand_ctas exists
alter table public.brand_offers drop constraint if exists brand_offers_cta_id_fkey;
alter table public.brand_offers add constraint brand_offers_cta_id_fkey
  foreign key (cta_id) references public.brand_ctas(id) on delete set null;

alter table public.offers drop constraint if exists offers_cta_id_fkey;
alter table public.offers add constraint offers_cta_id_fkey
  foreign key (cta_id) references public.brand_ctas(id) on delete set null;

-- Deferred FK ai_jobs -> ai_context_snapshots (avoid circular DDL issues in same txn)
alter table public.ai_jobs drop constraint if exists ai_jobs_context_snapshot_id_fkey;
