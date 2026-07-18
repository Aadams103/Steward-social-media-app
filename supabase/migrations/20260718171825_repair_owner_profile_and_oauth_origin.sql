-- Additive production repair for owner identity and preview-safe Meta OAuth.

alter table public.oauth_states
  add column if not exists return_origin text;

drop function if exists public.consume_oauth_state(text);

create function public.consume_oauth_state(p_state text)
returns table (
  user_id uuid,
  organization_id uuid,
  brand_id text,
  purpose text,
  provider text,
  redirect_uri text,
  return_origin text
)
language sql
security definer
set search_path = ''
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
    oauth_state.redirect_uri,
    oauth_state.return_origin;
$$;

revoke all on function public.consume_oauth_state(text) from public, anon, authenticated;
grant execute on function public.consume_oauth_state(text) to service_role;

-- Repair existing profiles without overwriting a name the owner already chose.
update public.profiles as profile
set
  email = auth_user.email,
  full_name = coalesce(
    nullif(btrim(profile.full_name), ''),
    nullif(btrim(auth_user.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(auth_user.raw_user_meta_data ->> 'name'), ''),
    nullif(btrim(auth_user.raw_user_meta_data ->> 'display_name'), '')
  ),
  display_name = coalesce(
    nullif(btrim(profile.display_name), ''),
    nullif(btrim(auth_user.raw_user_meta_data ->> 'display_name'), ''),
    nullif(btrim(auth_user.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(auth_user.raw_user_meta_data ->> 'name'), '')
  ),
  updated_at = now()
from auth.users as auth_user
where profile.id = auth_user.id
  and (
    profile.email is distinct from auth_user.email
    or nullif(btrim(profile.full_name), '') is null
    or nullif(btrim(profile.display_name), '') is null
  );

create or replace function public.sync_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_full_name text := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), '')
  );
  v_display_name text := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
    v_full_name
  );
begin
  insert into public.profiles (id, email, full_name, display_name)
  values (new.id, new.email, v_full_name, v_display_name)
  on conflict (id) do update
  set
    email = coalesce(excluded.email, public.profiles.email),
    full_name = coalesce(nullif(btrim(public.profiles.full_name), ''), excluded.full_name),
    display_name = coalesce(nullif(btrim(public.profiles.display_name), ''), excluded.display_name),
    updated_at = now();

  return new;
end;
$$;

revoke all on function public.sync_profile_from_auth_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_profile_changed on auth.users;
create trigger on_auth_user_profile_changed
after update of email, raw_user_meta_data on auth.users
for each row
when (
  old.email is distinct from new.email
  or old.raw_user_meta_data is distinct from new.raw_user_meta_data
)
execute function public.sync_profile_from_auth_user();
