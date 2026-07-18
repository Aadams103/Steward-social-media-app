-- Profiles contain private identity data. Anonymous users never need access,
-- and signed-in users may only read or edit their own row.
drop policy if exists "public profiles are viewable" on public.profiles;
drop policy if exists "users can insert their own profile" on public.profiles;
drop policy if exists "users can update their own profile" on public.profiles;

revoke select, insert, update, delete on table public.profiles from anon;

grant select, insert, update on table public.profiles to authenticated;
