-- Atomic claiming of due publish jobs for the Railway scheduler worker.
-- Uses FOR UPDATE SKIP LOCKED so concurrent workers (or overlapping cron
-- ticks) never claim the same job twice.
-- Intended to be called via the backend service role only.

create index if not exists publish_jobs_due_idx
  on public.publish_jobs (status, scheduled_at)
  where status in ('queued', 'retrying');

create or replace function public.claim_due_publish_jobs(limit_count int default 5)
returns setof public.publish_jobs
language plpgsql
security invoker
as $$
begin
  return query
  with due as (
    select pj.id
    from public.publish_jobs pj
    where pj.scheduled_at <= now()
      and pj.status in ('queued', 'retrying')
      and pj.attempt_count < pj.max_attempts
    order by pj.priority desc, pj.scheduled_at asc
    limit greatest(limit_count, 0)
    for update skip locked
  )
  update public.publish_jobs pj
  set status = 'processing',
      attempt_count = pj.attempt_count + 1,
      last_attempt_at = now(),
      processed_at = now(),
      updated_at = now()
  from due
  where pj.id = due.id
  returning pj.*;
end;
$$;

-- Worker-only: do not allow browser clients to claim jobs.
revoke execute on function public.claim_due_publish_jobs(int) from anon, authenticated;
