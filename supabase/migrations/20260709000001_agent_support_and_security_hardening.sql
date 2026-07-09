-- Steward AI Agent support + security hardening.
--
-- Security fixes (from Supabase security advisors):
--   1. ERROR security_definer_view: ai_jobs_safe / social_accounts_safe ran
--      with the view owner's privileges, bypassing RLS on base tables for
--      any authenticated reader. Switch to security_invoker so the caller's
--      RLS applies (base tables have org-member SELECT policies).
--   2. WARN function_search_path_mutable: pin search_path on all flagged
--      functions to block search-path hijacking.
--   3. WARN anon_security_definer_function_executable: revoke EXECUTE from
--      anon on RLS helper + seed functions. anon has no legitimate use.
--
-- Agent support:
--   4. Indexes for agent decision history and due-rule scans.

-- ---------------------------------------------------------------------------
-- 1. Views run with the invoker's permissions (RLS applies)
-- ---------------------------------------------------------------------------
alter view public.ai_jobs_safe set (security_invoker = true);
alter view public.social_accounts_safe set (security_invoker = true);

-- ---------------------------------------------------------------------------
-- 2. Pin search_path on flagged functions (idempotent; signature-aware)
-- ---------------------------------------------------------------------------
do $$
declare fn record;
begin
  for fn in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'set_updated_at', 'set_updated_at_metadata', 'claim_due_publish_jobs',
        'check_rate_limit', 'is_org_member', 'get_org_role', 'has_org_role',
        'can_edit_org_content', 'can_approve_org_content', 'can_manage_org_settings',
        'is_brand_in_user_org', 'storage_object_in_user_org', 'handle_new_user',
        'seed_kinetic_grappling_demo', 'seed_kinetic_grappling_brand_intelligence'
      )
  loop
    execute format('alter function %s set search_path = public, pg_temp', fn.sig);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Function execute grants. Default Postgres grants EXECUTE to PUBLIC, so a
--    plain "revoke from anon" is ineffective. Revoke from PUBLIC/anon and
--    grant back only what each audience needs:
--      - RLS helpers: authenticated (policies evaluate them as the caller)
--      - seed/worker functions: service_role only
-- ---------------------------------------------------------------------------
do $$
declare fn record;
begin
  -- RLS helper functions: authenticated only.
  for fn in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'is_org_member', 'get_org_role', 'has_org_role',
        'can_edit_org_content', 'can_approve_org_content', 'can_manage_org_settings',
        'is_brand_in_user_org', 'storage_object_in_user_org', 'check_rate_limit'
      )
  loop
    execute format('revoke execute on function %s from public', fn.sig);
    execute format('revoke execute on function %s from anon', fn.sig);
    execute format('grant execute on function %s to authenticated', fn.sig);
    execute format('grant execute on function %s to service_role', fn.sig);
  end loop;

  -- Operator/worker tooling: service_role only.
  for fn in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'seed_kinetic_grappling_demo', 'seed_kinetic_grappling_brand_intelligence',
        'claim_due_publish_jobs'
      )
  loop
    execute format('revoke execute on function %s from public', fn.sig);
    execute format('revoke execute on function %s from anon', fn.sig);
    execute format('revoke execute on function %s from authenticated', fn.sig);
    execute format('grant execute on function %s to service_role', fn.sig);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 3b. Stragglers: stripe schema functions + handle_new_user RPC exposure
-- ---------------------------------------------------------------------------
do $$
declare fn record;
begin
  for fn in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'stripe'
      and p.proname in ('set_updated_at', 'set_updated_at_metadata', 'check_rate_limit')
  loop
    execute format('alter function %s set search_path = stripe, public, pg_temp', fn.sig);
  end loop;

  -- handle_new_user is an auth trigger; it must never be callable via PostgREST RPC.
  for fn in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'handle_new_user'
  loop
    execute format('revoke execute on function %s from public', fn.sig);
    execute format('revoke execute on function %s from anon', fn.sig);
    execute format('revoke execute on function %s from authenticated', fn.sig);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 4. Agent indexes
-- ---------------------------------------------------------------------------
create index if not exists ai_decision_logs_org_type_created_idx
  on public.ai_decision_logs (organization_id, decision_type, created_at desc);

create index if not exists ai_decision_logs_brand_created_idx
  on public.ai_decision_logs (brand_id, created_at desc);

-- Partial index for the agent worker's due-rule scan.
create index if not exists automation_rules_agent_due_idx
  on public.automation_rules (next_run_at)
  where enabled = true and action_type = 'run_ai_job';

-- content_insights upsert path (brand, type, key). Dedupe first: keep newest.
delete from public.content_insights a
using public.content_insights b
where a.brand_id = b.brand_id
  and a.insight_type = b.insight_type
  and a.insight_key = b.insight_key
  and a.updated_at < b.updated_at;

create unique index if not exists content_insights_brand_type_key_idx
  on public.content_insights (brand_id, insight_type, insight_key);
