-- Steward schema foundation (part 7): RLS for all new tables.

alter table public.content_pillars enable row level security;
alter table public.content_topics enable row level security;
alter table public.audience_segments enable row level security;
alter table public.brand_offers enable row level security;
alter table public.content_goals enable row level security;
alter table public.content_intake_items enable row level security;
alter table public.post_variants enable row level security;
alter table public.content_calendar_entries enable row level security;
alter table public.recurring_content_rules enable row level security;
alter table public.blackout_dates enable row level security;
alter table public.ai_jobs enable row level security;
alter table public.content_approvals enable row level security;
alter table public.approval_steps enable row level security;
alter table public.approval_comments enable row level security;
alter table public.social_post_publications enable row level security;
alter table public.post_metrics_snapshots enable row level security;
alter table public.platform_account_metrics enable row level security;
alter table public.audience_growth_snapshots enable row level security;
alter table public.content_insights enable row level security;
alter table public.business_locations enable row level security;
alter table public.recurring_schedules enable row level security;
alter table public.events enable row level security;
alter table public.offers enable row level security;
alter table public.testimonials enable row level security;
alter table public.team_members enable row level security;
alter table public.reusable_snippets enable row level security;
alter table public.automation_rules enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;

-- Generic org-scoped read for members
do $$
declare
  t text;
begin
  foreach t in array array[
    'content_pillars','content_topics','audience_segments','brand_offers','content_goals',
    'content_intake_items','post_variants','content_calendar_entries','recurring_content_rules',
    'blackout_dates','ai_jobs','content_approvals','social_post_publications',
    'post_metrics_snapshots','platform_account_metrics','audience_growth_snapshots',
    'content_insights','business_locations','recurring_schedules','events','offers',
    'testimonials','team_members','reusable_snippets','automation_rules','audit_logs'
  ]
  loop
    execute format('drop policy if exists "Org members can read %I" on public.%I', t, t);
    execute format(
      'create policy "Org members can read %1$I" on public.%1$I for select using (public.is_org_member(organization_id))',
      t
    );
  end loop;
end $$;

-- Editors can manage content/strategy tables
do $$
declare
  t text;
begin
  foreach t in array array[
    'content_pillars','content_topics','audience_segments','brand_offers','content_goals',
    'content_intake_items','post_variants','content_calendar_entries','recurring_content_rules',
    'blackout_dates','business_locations','recurring_schedules','events','offers',
    'testimonials','team_members','reusable_snippets'
  ]
  loop
    execute format('drop policy if exists "Editors can manage %I" on public.%I', t, t);
    execute format(
      'create policy "Editors can manage %1$I" on public.%1$I for all using (public.can_edit_org_content(organization_id)) with check (public.can_edit_org_content(organization_id))',
      t
    );
  end loop;
end $$;

-- Settings admins manage automation rules
drop policy if exists "Admins can manage automation_rules" on public.automation_rules;
create policy "Admins can manage automation_rules"
  on public.automation_rules for all
  using (public.can_manage_org_settings(organization_id))
  with check (public.can_manage_org_settings(organization_id));

-- AI jobs: members read, editors insert; updates via service role primarily
drop policy if exists "Editors can create ai_jobs" on public.ai_jobs;
create policy "Editors can create ai_jobs"
  on public.ai_jobs for insert
  with check (public.can_edit_org_content(organization_id));

-- Approvals
drop policy if exists "Members can read approvals" on public.content_approvals;
create policy "Members can read approvals"
  on public.content_approvals for select
  using (public.is_org_member(organization_id));

drop policy if exists "Editors can request approvals" on public.content_approvals;
create policy "Editors can request approvals"
  on public.content_approvals for insert
  with check (public.can_edit_org_content(organization_id));

drop policy if exists "Approvers can update approvals" on public.content_approvals;
create policy "Approvers can update approvals"
  on public.content_approvals for update
  using (public.can_approve_org_content(organization_id));

drop policy if exists "Members can read approval_steps" on public.approval_steps;
create policy "Members can read approval_steps"
  on public.approval_steps for select
  using (
    exists (
      select 1 from public.content_approvals ca
      where ca.id = approval_steps.approval_id
        and public.is_org_member(ca.organization_id)
    )
  );

drop policy if exists "Approvers can manage approval_steps" on public.approval_steps;
create policy "Approvers can manage approval_steps"
  on public.approval_steps for all
  using (
    exists (
      select 1 from public.content_approvals ca
      where ca.id = approval_steps.approval_id
        and public.can_approve_org_content(ca.organization_id)
    )
  )
  with check (
    exists (
      select 1 from public.content_approvals ca
      where ca.id = approval_steps.approval_id
        and public.can_approve_org_content(ca.organization_id)
    )
  );

drop policy if exists "Members can read approval_comments" on public.approval_comments;
create policy "Members can read approval_comments"
  on public.approval_comments for select
  using (
    exists (
      select 1 from public.content_approvals ca
      where ca.id = approval_comments.approval_id
        and public.is_org_member(ca.organization_id)
    )
  );

drop policy if exists "Members can add approval_comments" on public.approval_comments;
create policy "Members can add approval_comments"
  on public.approval_comments for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.content_approvals ca
      where ca.id = approval_comments.approval_id
        and public.is_org_member(ca.organization_id)
    )
  );

-- Notifications: user-scoped
drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications"
  on public.notifications for select
  using (user_id = auth.uid() and public.is_org_member(organization_id));

drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications"
  on public.notifications for update
  using (user_id = auth.uid());

-- Audit logs: read-only for admins
drop policy if exists "Admins can read audit_logs" on public.audit_logs;
create policy "Admins can read audit_logs"
  on public.audit_logs for select
  using (public.can_manage_org_settings(organization_id));

-- Tighten existing tables with helper-based policies (additive)
drop policy if exists "Editors can insert posts in org" on public.posts;
create policy "Editors can insert posts in org"
  on public.posts for insert
  with check (
    author_id = auth.uid()
    and (
      organization_id is null
      or public.can_edit_org_content(organization_id)
    )
  );

drop policy if exists "Editors can update org posts" on public.posts;
create policy "Editors can update org posts"
  on public.posts for update
  using (
    author_id = auth.uid()
    or (
      organization_id is not null
      and public.can_edit_org_content(organization_id)
    )
  );

-- Viewers should not publish: no separate publish policy here; enforced at API/worker layer.

-- Secure social account tokens: create a safe view without oauth columns for clients
create or replace view public.social_accounts_safe as
select
  id, brand_id, platform, username, handle, display_name, avatar_url,
  is_connected, status, connection_status, last_sync, follower_count,
  organization_id, platform_account_id, auth_provider, scopes,
  token_expires_at, posting_permissions, analytics_permissions, metadata,
  profile_url, archived_at, created_at, updated_at,
  (oauth_access_token is not null or token_secret_id is not null) as has_tokens
from public.social_accounts;

grant select on public.social_accounts_safe to authenticated;

comment on view public.social_accounts_safe is
  'Client-safe social account view excluding raw OAuth token columns. Backend service role should use social_accounts directly.';
