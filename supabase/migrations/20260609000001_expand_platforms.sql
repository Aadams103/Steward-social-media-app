-- Expand platform check constraints to match the frontend Platform type
-- (adds youtube, x, google_business_profile).
-- The original constraints were declared inline on the column, so Postgres
-- assigned the default names <table>_<column>_check. Dropping by that name is
-- safe and non-destructive (constraint only; no table/data changes).

alter table public.posts
  drop constraint if exists posts_platform_check;
alter table public.posts
  add constraint posts_platform_check check (
    platform in ('facebook','instagram','linkedin','tiktok','pinterest','reddit','slack','notion','youtube','x','google_business_profile')
  );

alter table public.social_accounts
  drop constraint if exists social_accounts_platform_check;
alter table public.social_accounts
  add constraint social_accounts_platform_check check (
    platform in ('facebook','instagram','linkedin','tiktok','pinterest','reddit','slack','notion','youtube','x','google_business_profile')
  );

alter table public.publish_jobs
  drop constraint if exists publish_jobs_platform_check;
alter table public.publish_jobs
  add constraint publish_jobs_platform_check check (
    platform in ('facebook','instagram','linkedin','tiktok','pinterest','reddit','slack','notion','youtube','x','google_business_profile')
  );
