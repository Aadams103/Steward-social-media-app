-- Billing groundwork: subscriptions (per-organization Stripe state) and
-- stripe_events (webhook idempotency ledger).
-- Additive only. Subscription state is written exclusively by backend
-- service-role code (Stripe webhooks); clients can only read their org's row.

-- ---------------------------------------------------------------------------
-- SUBSCRIPTIONS
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  plan_type text not null default 'free',
  status text not null default 'inactive',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- Read-only for org owners and members. No INSERT/UPDATE/DELETE policies:
-- billing state is written by the backend service role only (bypasses RLS).
create policy "Members can read their org subscription"
  on public.subscriptions for select using (
    exists (
      select 1 from public.organizations o
      where o.id = subscriptions.organization_id
        and (
          o.owner_id = auth.uid()
          or exists (
            select 1 from public.organization_members om
            where om.organization_id = o.id and om.user_id = auth.uid()
          )
        )
    )
  );

create index if not exists subscriptions_organization_id_idx on public.subscriptions (organization_id);
create index if not exists subscriptions_stripe_customer_id_idx on public.subscriptions (stripe_customer_id);
create index if not exists subscriptions_stripe_subscription_id_idx on public.subscriptions (stripe_subscription_id);
create index if not exists subscriptions_status_idx on public.subscriptions (status);

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- STRIPE_EVENTS (webhook idempotency)
-- ---------------------------------------------------------------------------
create table if not exists public.stripe_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text not null,
  processed_at timestamptz not null default now(),
  payload jsonb
);

-- RLS enabled with no policies: clients can neither read nor write.
-- Backend service role bypasses RLS.
alter table public.stripe_events enable row level security;

create index if not exists stripe_events_stripe_event_id_idx on public.stripe_events (stripe_event_id);
create index if not exists stripe_events_event_type_idx on public.stripe_events (event_type);
