begin;
-- A singleton allowlist: this phase permits only the existing owner's verified account.
create table if not exists public.artist_access(
 singleton boolean primary key default true check(singleton),
 user_id uuid not null unique references auth.users(id) on delete cascade,
 enabled boolean not null default true
);
alter table public.artist_access enable row level security;
revoke all on public.artist_access from public,anon,authenticated;
grant all on public.artist_access to service_role;
create or replace function public.app_has_access()
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.artist_access where singleton and enabled and user_id=auth.uid());
$$;
revoke all on function public.app_has_access() from public,anon,authenticated;
grant execute on function public.app_has_access() to authenticated;
do $$ declare t text; begin
 foreach t in array array['events','quotes','contracts','user_preferences'] loop
  if to_regclass('public.'||t) is null then raise exception 'Required existing table is missing: %',t;end if;
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke truncate,references,trigger on public.%I from public,anon,authenticated',t);
  execute format('drop policy if exists artist_owner_allow on public.%I',t);
  execute format('drop policy if exists artist_access_guard on public.%I',t);
  execute format('drop policy if exists artist_anonymous_guard on public.%I',t);
  execute format('create policy artist_owner_allow on public.%I for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid())',t);
  execute format('create policy artist_access_guard on public.%I as restrictive for all to authenticated using(user_id=auth.uid() and public.app_has_access()) with check(user_id=auth.uid() and public.app_has_access())',t);
  execute format('create policy artist_anonymous_guard on public.%I as restrictive for all to anon using(false) with check(false)',t);
 end loop;
end $$;
-- Bind the authorization to the immutable Auth UUID, never to a browser email comparison.
do $$ declare owner_id uuid; begin
 select id into strict owner_id from auth.users where lower(email)='contato@djpec.com' and email_confirmed_at is not null;
 if owner_id is null then raise exception 'The existing verified owner account was not found. Review the email in Supabase Auth before applying this migration.';end if;
 insert into public.artist_access(singleton,user_id,enabled)values(true,owner_id,true)
 on conflict(singleton)do update set user_id=excluded.user_id,enabled=true;
exception when no_data_found then raise exception 'The verified owner account was not found. Review Supabase Auth first.';
 when too_many_rows then raise exception 'Multiple verified accounts match the owner email. Review Supabase Auth first.';
end $$;
commit;
