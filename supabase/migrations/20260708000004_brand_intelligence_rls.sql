-- Steward Brand Intelligence (part 4): RLS policies.

alter table public.brand_profiles enable row level security;
alter table public.user_brand_preferences enable row level security;
alter table public.brand_hashtags enable row level security;
alter table public.brand_ctas enable row level security;
alter table public.brand_rules enable row level security;
alter table public.platform_strategy enable row level security;
alter table public.ai_memory_facts enable row level security;
alter table public.ai_context_snapshots enable row level security;
alter table public.ai_decision_logs enable row level security;
alter table public.content_feedback enable row level security;
alter table public.content_safety_reviews enable row level security;

-- Read for org members
do $$
declare t text;
begin
  foreach t in array array[
    'brand_profiles','brand_hashtags','brand_ctas','brand_rules','platform_strategy',
    'ai_memory_facts','ai_context_snapshots','ai_decision_logs','content_safety_reviews'
  ]
  loop
    execute format('drop policy if exists "Org members read %I" on public.%I', t, t);
    execute format(
      'create policy "Org members read %1$I" on public.%1$I for select using (public.is_org_member(organization_id))',
      t
    );
  end loop;
end $$;

-- user_brand_preferences: user can read/write own row; org admins can read all in org
drop policy if exists "Users manage own brand preferences" on public.user_brand_preferences;
create policy "Users manage own brand preferences"
  on public.user_brand_preferences for all
  using (user_id = auth.uid() and public.is_org_member(organization_id))
  with check (user_id = auth.uid() and public.is_org_member(organization_id));

drop policy if exists "Admins read org brand preferences" on public.user_brand_preferences;
create policy "Admins read org brand preferences"
  on public.user_brand_preferences for select
  using (public.can_manage_org_settings(organization_id));

-- Editors manage brand intelligence content tables
do $$
declare t text;
begin
  foreach t in array array[
    'brand_profiles','brand_hashtags','brand_ctas','brand_rules','platform_strategy'
  ]
  loop
    execute format('drop policy if exists "Editors manage %I" on public.%I', t, t);
    execute format(
      'create policy "Editors manage %1$I" on public.%1$I for all using (public.can_edit_org_content(organization_id)) with check (public.can_edit_org_content(organization_id))',
      t
    );
  end loop;
end $$;

-- Memory facts: editors propose, admins approve (update approved fields)
drop policy if exists "Editors create memory facts" on public.ai_memory_facts;
create policy "Editors create memory facts"
  on public.ai_memory_facts for insert
  with check (public.can_edit_org_content(organization_id));

drop policy if exists "Editors read memory facts" on public.ai_memory_facts;
create policy "Editors read memory facts"
  on public.ai_memory_facts for select
  using (public.is_org_member(organization_id));

drop policy if exists "Admins manage memory facts" on public.ai_memory_facts;
create policy "Admins manage memory facts"
  on public.ai_memory_facts for update
  using (public.can_manage_org_settings(organization_id));

-- content_feedback: users create own feedback
drop policy if exists "Users create content feedback" on public.content_feedback;
create policy "Users create content feedback"
  on public.content_feedback for insert
  with check (user_id = auth.uid() and public.is_org_member(organization_id));

drop policy if exists "Members read content feedback" on public.content_feedback;
create policy "Members read content feedback"
  on public.content_feedback for select
  using (public.is_org_member(organization_id));

-- ai_context_snapshots: read-only for members; writes via service role
-- (insert policy intentionally omitted for authenticated clients)

-- Add deferred FK for ai_jobs.context_snapshot_id
alter table public.ai_jobs
  add constraint ai_jobs_context_snapshot_id_fkey
  foreign key (context_snapshot_id) references public.ai_context_snapshots(id) on delete set null;
