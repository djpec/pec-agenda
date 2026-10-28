begin;
-- Apply 202610270002_restricted_owner_access.sql first. No financial seed/demo data.
create table if not exists public.finance_workspaces(
 user_id uuid primary key references auth.users(id) on delete cascade,
 revision integer not null default 0 check(revision>=0),
 state jsonb not null default '{"version":1,"accounts":[],"cards":[],"entries":[]}'::jsonb,
 updated_at timestamptz not null default now()
);
alter table public.finance_workspaces enable row level security;
revoke all on public.finance_workspaces from public,anon,authenticated;
grant select on public.finance_workspaces to authenticated;
grant all on public.finance_workspaces to service_role;
drop policy if exists finance_owner_read on public.finance_workspaces;
create policy finance_owner_read on public.finance_workspaces for select to authenticated using(user_id=auth.uid() and public.app_has_access());
-- One atomic compare-and-swap: a stale device can never overwrite newer finances.
create or replace function public.save_finance_workspace(expected_revision integer,next_state jsonb)
returns integer language plpgsql security definer set search_path='' as $$
declare owner_id uuid:=auth.uid();current_revision integer;next_revision integer;k text;
begin
 if owner_id is null or not public.app_has_access() then raise exception 'Access denied' using errcode='42501';end if;
 if expected_revision is null or expected_revision<0 then raise exception 'Invalid revision' using errcode='22023';end if;
 if next_state is null or jsonb_typeof(next_state) is distinct from 'object' or next_state->>'version' is distinct from '1' or pg_column_size(next_state)>5242880 then raise exception 'Invalid financial state' using errcode='22023';end if;
 foreach k in array array['accounts','cards','entries'] loop
  if jsonb_typeof(next_state->k) is distinct from 'array' then raise exception 'Invalid financial collection' using errcode='22023';end if;
 end loop;
 if jsonb_array_length(next_state->'accounts')>100 or jsonb_array_length(next_state->'cards')>100 or jsonb_array_length(next_state->'entries')>20000 then raise exception 'Financial collection limit exceeded' using errcode='22023';end if;
 insert into public.finance_workspaces(user_id)values(owner_id)on conflict(user_id)do nothing;
 select revision into current_revision from public.finance_workspaces where user_id=owner_id for update;
 if current_revision<>expected_revision then raise exception 'Financial state changed on another device' using errcode='40001';end if;
 update public.finance_workspaces set state=next_state,revision=revision+1,updated_at=now() where user_id=owner_id returning revision into next_revision;
 return next_revision;
end $$;
revoke all on function public.save_finance_workspace(integer,jsonb) from public,anon,authenticated;
grant execute on function public.save_finance_workspace(integer,jsonb) to authenticated;
commit;
