-- RLS initplan optimization (from Supabase performance advisors).
--
-- Policies calling auth.uid() directly re-evaluate it for EVERY row scanned.
-- Wrapping it as (select auth.uid()) lets the planner run it once as an
-- InitPlan. This rewrites all public-schema policies mechanically, preserving
-- command, roles, and expressions — behavior is identical, only faster.

do $$
declare
  pol record;
  new_qual text;
  new_check text;
  roles_list text;
  cmd_sql text;
begin
  for pol in
    select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (
        (qual is not null and qual like '%auth.uid()%' and qual not like '%SELECT auth.uid()%')
        or
        (with_check is not null and with_check like '%auth.uid()%' and with_check not like '%SELECT auth.uid()%')
      )
  loop
    new_qual := case
      when pol.qual is not null then replace(pol.qual, 'auth.uid()', '( SELECT auth.uid() )')
      else null
    end;
    new_check := case
      when pol.with_check is not null then replace(pol.with_check, 'auth.uid()', '( SELECT auth.uid() )')
      else null
    end;

    roles_list := array_to_string(pol.roles, ', ');

    execute format('drop policy %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);

    cmd_sql := format(
      'create policy %I on %I.%I as %s for %s to %s',
      pol.policyname, pol.schemaname, pol.tablename,
      lower(pol.permissive), pol.cmd, roles_list
    );
    if new_qual is not null then
      cmd_sql := cmd_sql || format(' using (%s)', new_qual);
    end if;
    if new_check is not null then
      cmd_sql := cmd_sql || format(' with check (%s)', new_check);
    end if;

    execute cmd_sql;
    raise notice 'Rewrote policy % on %.%', pol.policyname, pol.schemaname, pol.tablename;
  end loop;
end $$;
