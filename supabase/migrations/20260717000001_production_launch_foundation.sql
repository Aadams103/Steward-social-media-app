-- Steward production launch foundation.
-- Atomic workspace bootstrap, canonical workflow states, private asset metadata,
-- OAuth state binding, Vault-backed provider tokens, and legacy grant cleanup.

begin;

-- ---------------------------------------------------------------------------
-- Canonical approval-first post lifecycle
-- ---------------------------------------------------------------------------
alter table public.posts drop constraint if exists posts_status_check;
alter table public.posts add constraint posts_status_check check (
  status in (
    'idea', 'draft', 'generated', 'in_review', 'needs_review', 'needs_approval',
    'revision_requested', 'rejected', 'approved', 'scheduled', 'publishing',
    'retrying', 'published', 'failed', 'archived'
  )
);

-- ---------------------------------------------------------------------------
-- Durable private asset metadata
-- ---------------------------------------------------------------------------
alter table public.assets
  add column if not exists checksum_sha256 text,
  add column if not exists analysis_status text not null default 'pending',
  add column if not exists safe_url_expires_at timestamptz;

alter table public.assets drop constraint if exists assets_analysis_status_check;
alter table public.assets add constraint assets_analysis_status_check check (
  analysis_status in ('pending', 'queued', 'analyzing', 'completed', 'failed', 'not_applicable')
);

create unique index if not exists assets_bucket_path_unique_idx
  on public.assets (storage_bucket, storage_path);

create index if not exists assets_checksum_sha256_idx
  on public.assets (checksum_sha256)
  where checksum_sha256 is not null;

-- Multiple untrusted sources may propose the same fact key. Keep proposals
-- independently reviewable while allowing only one active approved truth.
drop index if exists public.ai_memory_facts_brand_key_active_idx;
create unique index if not exists ai_memory_facts_one_approved_key_idx
  on public.ai_memory_facts (brand_id, fact_type, fact_key)
  where archived_at is null and approved = true;
create unique index if not exists ai_memory_facts_proposal_source_idx
  on public.ai_memory_facts (
    brand_id,
    fact_type,
    fact_key,
    coalesce(source_record_type, ''),
    coalesce(source_record_id, '')
  )
  where archived_at is null and approved = false;

-- ---------------------------------------------------------------------------
-- OAuth state is authenticated, organization scoped, expiring, and single use
-- ---------------------------------------------------------------------------
alter table public.oauth_states
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists nonce text,
  add column if not exists redirect_uri text,
  add column if not exists used_at timestamptz;

create index if not exists oauth_states_expiry_idx on public.oauth_states (expires_at);
create index if not exists oauth_states_user_org_idx on public.oauth_states (user_id, organization_id);

create table if not exists public.oauth_selection_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  provider text not null check (provider = 'meta'),
  token_secret_id uuid not null,
  candidates jsonb not null default '[]'::jsonb,
  expires_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.oauth_selection_sessions enable row level security;
create index if not exists oauth_selection_sessions_user_idx
  on public.oauth_selection_sessions (user_id, expires_at);

revoke all on table public.oauth_selection_sessions from public, anon, authenticated;
grant all on table public.oauth_selection_sessions to service_role;

create unique index if not exists social_accounts_provider_identity_unique_idx
  on public.social_accounts (brand_id, platform, provider_account_id);

drop index if exists public.publish_jobs_idempotency_key_unique_idx;
create unique index publish_jobs_idempotency_key_unique_idx
  on public.publish_jobs (idempotency_key);

create unique index if not exists social_post_publications_provider_unique_idx
  on public.social_post_publications (social_account_id, platform, platform_post_id);

alter table public.platform_account_metrics
  add column if not exists brand_id uuid references public.brands(id) on delete set null,
  add column if not exists platform public.steward_platform;

create or replace function public.consume_oauth_state(p_state text)
returns table (
  user_id uuid,
  organization_id uuid,
  brand_id text,
  purpose text,
  provider text,
  redirect_uri text
)
language sql
security definer
set search_path = public
as $$
  delete from public.oauth_states as oauth_state
  where oauth_state.state = p_state
    and oauth_state.used_at is null
    and oauth_state.expires_at > now()
  returning
    oauth_state.user_id,
    oauth_state.organization_id,
    oauth_state.brand_id,
    oauth_state.purpose,
    oauth_state.provider,
    oauth_state.redirect_uri;
$$;

revoke all on function public.consume_oauth_state(text) from public, anon, authenticated;
grant execute on function public.consume_oauth_state(text) to service_role;

-- ---------------------------------------------------------------------------
-- Atomic and idempotent one-brand workspace bootstrap
-- ---------------------------------------------------------------------------
create or replace function public.bootstrap_steward_workspace(
  p_user_id uuid,
  p_organization_name text,
  p_brand_name text,
  p_timezone text default 'UTC'
)
returns table (organization_id uuid, brand_id uuid, created boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_brand_id uuid;
  v_org_slug text;
  v_brand_slug text;
  v_created boolean := false;
begin
  if p_user_id is null or not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'INVALID_USER';
  end if;
  if nullif(trim(p_organization_name), '') is null or nullif(trim(p_brand_name), '') is null then
    raise exception 'NAMES_REQUIRED';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  select o.id
  into v_org_id
  from public.organizations o
  left join public.organization_members om
    on om.organization_id = o.id and om.user_id = p_user_id
  where o.archived_at is null and (o.owner_id = p_user_id or om.user_id = p_user_id)
  order by case when o.owner_id = p_user_id then 0 else 1 end, o.created_at
  limit 1;

  if v_org_id is null then
    v_org_slug := trim(both '-' from regexp_replace(lower(trim(p_organization_name)), '[^a-z0-9]+', '-', 'g'));
    if v_org_slug = '' then v_org_slug := 'workspace'; end if;
    v_org_slug := left(v_org_slug, 48) || '-' || left(replace(gen_random_uuid()::text, '-', ''), 8);

    insert into public.organizations (
      name, slug, owner_id, billing_plan, billing_status, subscription_tier,
      timezone, onboarding_status, created_by, settings
    ) values (
      trim(p_organization_name), v_org_slug, p_user_id, 'free', 'active', 'private_beta',
      coalesce(nullif(trim(p_timezone), ''), 'UTC'), 'completed', p_user_id,
      jsonb_build_object(
        'timezone', coalesce(nullif(trim(p_timezone), ''), 'UTC'),
        'defaultApprovalWindow', '24h',
        'autoEnableNewAccounts', false,
        'requireMfaForPublishing', false,
        'approvalFirst', true
      )
    ) returning id into v_org_id;
    v_created := true;
  end if;

  insert into public.organization_members (organization_id, user_id, role)
  values (v_org_id, p_user_id, 'owner')
  on conflict (organization_id, user_id) do update set role = 'owner', updated_at = now();

  select b.id into v_brand_id
  from public.brands b
  where b.organization_id = v_org_id and b.archived_at is null
  order by b.is_default desc, b.created_at
  limit 1;

  if v_brand_id is null then
    v_brand_slug := trim(both '-' from regexp_replace(lower(trim(p_brand_name)), '[^a-z0-9]+', '-', 'g'));
    if v_brand_slug = '' then v_brand_slug := 'brand'; end if;
    v_brand_slug := left(v_brand_slug, 56) || '-' || left(replace(gen_random_uuid()::text, '-', ''), 6);

    insert into public.brands (
      organization_id, name, slug, business_name, is_default, metadata
    ) values (
      v_org_id, trim(p_brand_name), v_brand_slug, trim(p_brand_name), true,
      jsonb_build_object('approvalFirst', true, 'bootstrapVersion', '1')
    ) returning id into v_brand_id;
    v_created := true;
  end if;

  update public.organizations
  set default_brand_id = v_brand_id,
      onboarding_status = 'completed',
      timezone = coalesce(nullif(trim(p_timezone), ''), timezone),
      updated_at = now()
  where id = v_org_id;

  update public.profiles
  set organization_id = v_org_id, updated_at = now()
  where id = p_user_id;

  insert into public.brand_profiles (
    organization_id, brand_id, business_name, public_brand_name, timezone, metadata
  ) values (
    v_org_id, v_brand_id, trim(p_brand_name), trim(p_brand_name),
    coalesce(nullif(trim(p_timezone), ''), 'UTC'),
    jsonb_build_object('bootstrapVersion', '1')
  ) on conflict (brand_id) do nothing;

  insert into public.user_brand_preferences (
    organization_id, brand_id, user_id, approval_strictness,
    auto_generation_enabled, auto_schedule_enabled, auto_publish_enabled,
    always_require_review
  ) values (
    v_org_id, v_brand_id, p_user_id, 'strict', true, false, false, true
  ) on conflict (brand_id, user_id) do update set
    auto_publish_enabled = false,
    always_require_review = true,
    updated_at = now();

  if v_created then
    insert into public.audit_logs (
      organization_id, brand_id, actor_user_id, action, entity_type, entity_id, after_state
    ) values (
      v_org_id, v_brand_id, p_user_id, 'workspace.bootstrap', 'organization', v_org_id::text,
      jsonb_build_object('organizationId', v_org_id, 'brandId', v_brand_id, 'approvalFirst', true)
    );
  end if;

  return query select v_org_id, v_brand_id, v_created;
end;
$$;

revoke all on function public.bootstrap_steward_workspace(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.bootstrap_steward_workspace(uuid, text, text, text) to service_role;

-- ---------------------------------------------------------------------------
-- ---------------------------------------------------------------------------
-- Durable Create Studio briefs and edit history
-- ---------------------------------------------------------------------------
create table if not exists public.content_briefs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  goal text,
  target_audience text,
  content_pillar text,
  content_format text not null default 'post',
  platforms text[] not null default '{}'::text[],
  asset_ids uuid[] not null default '{}'::uuid[],
  notes text,
  status text not null default 'active' check (status in ('active', 'generated', 'archived')),
  latest_ai_job_id uuid references public.ai_jobs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.post_revisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  edited_by uuid not null references auth.users(id) on delete cascade,
  before_state jsonb not null default '{}'::jsonb,
  after_state jsonb not null default '{}'::jsonb,
  ai_job_id uuid references public.ai_jobs(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists content_briefs_brand_created_idx
  on public.content_briefs (brand_id, created_at desc);
create index if not exists post_revisions_post_created_idx
  on public.post_revisions (post_id, created_at desc);

alter table public.content_briefs enable row level security;
alter table public.post_revisions enable row level security;

drop policy if exists "Org members read content briefs" on public.content_briefs;
create policy "Org members read content briefs" on public.content_briefs
  for select using (public.is_org_member(organization_id));
drop policy if exists "Org editors manage content briefs" on public.content_briefs;
create policy "Org editors manage content briefs" on public.content_briefs
  for all using (public.can_edit_org_content(organization_id))
  with check (created_by = auth.uid() and public.can_edit_org_content(organization_id));

drop policy if exists "Org members read post revisions" on public.post_revisions;
create policy "Org members read post revisions" on public.post_revisions
  for select using (public.is_org_member(organization_id));
drop policy if exists "Org editors create post revisions" on public.post_revisions;
create policy "Org editors create post revisions" on public.post_revisions
  for insert with check (edited_by = auth.uid() and public.can_edit_org_content(organization_id));

grant select, insert, update on public.content_briefs to authenticated;
grant select, insert on public.post_revisions to authenticated;

drop trigger if exists content_briefs_updated_at on public.content_briefs;
create trigger content_briefs_updated_at before update on public.content_briefs
  for each row execute function public.set_updated_at();

-- Meta token bundles live in Supabase Vault. Only the service role may call
-- these helpers; browser clients never receive a token or Vault identifier.
-- ---------------------------------------------------------------------------
create or replace function public.store_social_token_bundle(
  p_account_id uuid,
  p_token_bundle jsonb
)
returns text
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_old_secret_id uuid;
  v_secret_id uuid;
begin
  select nullif(token_secret_id, '')::uuid into v_old_secret_id
  from public.social_accounts
  where id = p_account_id
  for update;

  if not found then raise exception 'SOCIAL_ACCOUNT_NOT_FOUND'; end if;

  select vault.create_secret(
    p_token_bundle::text,
    'steward-social-' || p_account_id::text || '-' || replace(gen_random_uuid()::text, '-', ''),
    'Steward provider token bundle'
  ) into v_secret_id;

  update public.social_accounts
  set token_secret_id = v_secret_id::text,
      oauth_access_token = null,
      oauth_refresh_token = null,
      updated_at = now()
  where id = p_account_id;

  if v_old_secret_id is not null then
    delete from vault.secrets where id = v_old_secret_id;
  end if;

  return v_secret_id::text;
end;
$$;

create or replace function public.read_social_token_bundle(p_account_id uuid)
returns jsonb
language sql
security definer
set search_path = public, vault
as $$
  select ds.decrypted_secret::jsonb
  from public.social_accounts sa
  join vault.decrypted_secrets ds on ds.id = nullif(sa.token_secret_id, '')::uuid
  where sa.id = p_account_id;
$$;

create or replace function public.delete_social_token_bundle(p_account_id uuid)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_secret_id uuid;
begin
  select nullif(token_secret_id, '')::uuid into v_secret_id
  from public.social_accounts where id = p_account_id for update;
  update public.social_accounts
  set token_secret_id = null, oauth_access_token = null, oauth_refresh_token = null, updated_at = now()
  where id = p_account_id;
  if v_secret_id is not null then delete from vault.secrets where id = v_secret_id; end if;
end;
$$;

create or replace function public.create_meta_oauth_selection(
  p_user_id uuid,
  p_organization_id uuid,
  p_brand_id uuid,
  p_token_bundle jsonb,
  p_candidates jsonb,
  p_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_secret_id uuid;
  v_session_id uuid;
begin
  select vault.create_secret(
    p_token_bundle::text,
    'steward-meta-selection-' || replace(gen_random_uuid()::text, '-', ''),
    'Temporary Steward Meta OAuth selection token'
  ) into v_secret_id;

  insert into public.oauth_selection_sessions (
    user_id, organization_id, brand_id, provider, token_secret_id, candidates, expires_at
  ) values (
    p_user_id, p_organization_id, p_brand_id, 'meta', v_secret_id, p_candidates, p_expires_at
  ) returning id into v_session_id;
  return v_session_id;
end;
$$;

create or replace function public.read_meta_oauth_selection_token(p_session_id uuid, p_user_id uuid)
returns jsonb
language sql
security definer
set search_path = public, vault
as $$
  select ds.decrypted_secret::jsonb
  from public.oauth_selection_sessions s
  join vault.decrypted_secrets ds on ds.id = s.token_secret_id
  where s.id = p_session_id
    and s.user_id = p_user_id
    and s.completed_at is null
    and s.expires_at > now();
$$;

create or replace function public.complete_meta_oauth_selection(p_session_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_secret_id uuid;
begin
  update public.oauth_selection_sessions
  set completed_at = now()
  where id = p_session_id and user_id = p_user_id and completed_at is null
  returning token_secret_id into v_secret_id;
  if v_secret_id is null then raise exception 'OAUTH_SELECTION_NOT_FOUND'; end if;
  delete from vault.secrets where id = v_secret_id;
end;
$$;

revoke all on function public.store_social_token_bundle(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.read_social_token_bundle(uuid) from public, anon, authenticated;
revoke all on function public.delete_social_token_bundle(uuid) from public, anon, authenticated;
revoke all on function public.create_meta_oauth_selection(uuid, uuid, uuid, jsonb, jsonb, timestamptz) from public, anon, authenticated;
revoke all on function public.read_meta_oauth_selection_token(uuid, uuid) from public, anon, authenticated;
revoke all on function public.complete_meta_oauth_selection(uuid, uuid) from public, anon, authenticated;
grant execute on function public.store_social_token_bundle(uuid, jsonb) to service_role;
grant execute on function public.read_social_token_bundle(uuid) to service_role;
grant execute on function public.delete_social_token_bundle(uuid) to service_role;
grant execute on function public.create_meta_oauth_selection(uuid, uuid, uuid, jsonb, jsonb, timestamptz) to service_role;
grant execute on function public.read_meta_oauth_selection_token(uuid, uuid) to service_role;
grant execute on function public.complete_meta_oauth_selection(uuid, uuid) to service_role;

-- Remove the initial broad private-bucket policies. The later org-prefixed
-- policies remain the only authenticated path into storage.
drop policy if exists "Users can read objects in uploads for their org" on storage.objects;
drop policy if exists "Users can upload to uploads" on storage.objects;
drop policy if exists "Users can update their uploads" on storage.objects;
drop policy if exists "Users can delete their uploads" on storage.objects;
drop policy if exists "Users can read objects in brand-icons for their org" on storage.objects;
drop policy if exists "Users can upload to brand-icons" on storage.objects;
drop policy if exists "Users can update brand-icons" on storage.objects;
drop policy if exists "Users can delete brand-icons" on storage.objects;

-- Consolidate the broad ALL + SELECT policy pairs created by the early
-- schema export. Members retain one read path; editor mutations are separate
-- so PostgreSQL evaluates only the policy needed for that command.
do $$
declare
  t text;
begin
  foreach t in array array[
    'content_pillars','content_topics','audience_segments','brand_offers','content_goals',
    'content_intake_items','post_variants','content_calendar_entries','recurring_content_rules',
    'blackout_dates','business_locations','recurring_schedules','events','offers',
    'testimonials','team_members','reusable_snippets','brand_profiles','brand_hashtags',
    'brand_ctas','brand_rules','platform_strategy'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', 'Editors can manage ' || t, t);
    execute format('drop policy if exists %I on public.%I', 'Editors manage ' || t, t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.can_edit_org_content(organization_id))',
      'Editors insert ' || t, t
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (public.can_edit_org_content(organization_id)) with check (public.can_edit_org_content(organization_id))',
      'Editors update ' || t, t
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (public.can_edit_org_content(organization_id))',
      'Editors delete ' || t, t
    );
  end loop;
end $$;

drop policy if exists "Users can read assets in their orgs" on public.assets;
drop policy if exists "Users can manage assets in their orgs" on public.assets;
create policy "Org members read assets" on public.assets
  for select to authenticated using (public.is_org_member(organization_id));
create policy "Editors insert assets" on public.assets
  for insert to authenticated with check (public.can_edit_org_content(organization_id));
create policy "Editors update assets" on public.assets
  for update to authenticated using (public.can_edit_org_content(organization_id))
  with check (public.can_edit_org_content(organization_id));
create policy "Editors delete assets" on public.assets
  for delete to authenticated using (public.can_edit_org_content(organization_id));

-- Provider tokens are never readable through the Data API. Authenticated
-- clients may use the token-free safe view; backend services use service_role.
drop policy if exists "Users can read social_accounts in their orgs" on public.social_accounts;
drop policy if exists "Users can manage social_accounts in their orgs" on public.social_accounts;
revoke all privileges on table public.social_accounts from authenticated;
grant select on public.social_accounts_safe to authenticated;

drop policy if exists "Users manage own brand preferences" on public.user_brand_preferences;
drop policy if exists "Admins read org brand preferences" on public.user_brand_preferences;
create policy "Users and admins read brand preferences" on public.user_brand_preferences
  for select to authenticated using (
    (user_id = (select auth.uid()) and public.is_org_member(organization_id))
    or public.can_manage_org_settings(organization_id)
  );
create policy "Users insert own brand preferences" on public.user_brand_preferences
  for insert to authenticated with check (
    user_id = (select auth.uid()) and public.is_org_member(organization_id)
  );
create policy "Users update own brand preferences" on public.user_brand_preferences
  for update to authenticated using (
    user_id = (select auth.uid()) and public.is_org_member(organization_id)
  ) with check (
    user_id = (select auth.uid()) and public.is_org_member(organization_id)
  );
create policy "Users delete own brand preferences" on public.user_brand_preferences
  for delete to authenticated using (
    user_id = (select auth.uid()) and public.is_org_member(organization_id)
  );

drop policy if exists "Admins can manage org members" on public.organization_members;
drop policy if exists "Members can read own org membership" on public.organization_members;
create policy "Members and admins read organization membership" on public.organization_members
  for select to authenticated using (
    user_id = (select auth.uid()) or public.can_manage_org_settings(organization_id)
  );
create policy "Admins insert organization membership" on public.organization_members
  for insert to authenticated with check (public.can_manage_org_settings(organization_id));
create policy "Admins update organization membership" on public.organization_members
  for update to authenticated using (public.can_manage_org_settings(organization_id))
  with check (public.can_manage_org_settings(organization_id));
create policy "Admins delete organization membership" on public.organization_members
  for delete to authenticated using (public.can_manage_org_settings(organization_id));

drop policy if exists "Users can insert posts in their orgs" on public.posts;
drop policy if exists "Users can update their posts or posts in their orgs" on public.posts;
drop policy if exists "Org members can read audit_logs" on public.audit_logs;
drop policy if exists "Editors read memory facts" on public.ai_memory_facts;
drop policy if exists "Org members can read content_approvals" on public.content_approvals;

-- Policies without an explicit role were created for PUBLIC by the initial
-- export. Anonymous grants are removed below, and the remaining policies are
-- explicitly scoped to signed-in users to keep the policy surface small.
do $$
declare
  p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname in ('public', 'storage') and roles = array['public']::name[]
  loop
    execute format(
      'alter policy %I on %I.%I to authenticated',
      p.policyname, p.schemaname, p.tablename
    );
  end loop;
end $$;

-- Authenticated product only: anonymous Data API access is unnecessary.
revoke all privileges on all tables in schema public from anon;
revoke all privileges on all sequences in schema public from anon;
revoke all privileges on all functions in schema public from anon;

commit;
