begin;
-- No payment is inferred from a browser redirect or an editable profile.
create schema if not exists billing_private;
revoke all on schema billing_private from public, anon, authenticated;
create table if not exists billing_private.settings(singleton boolean primary key default true check(singleton), enforce_subscriptions boolean not null default false);
insert into billing_private.settings(singleton) values(true) on conflict do nothing;
create table if not exists billing_private.owner_access(user_id uuid primary key references auth.users(id) on delete cascade);
create table public.business_profiles(
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '' check(length(display_name)<=100),
 legal_name text not null default '' check(length(legal_name)<=160),
 tax_id text not null default '' check(length(tax_id)<=24),
 email text not null default '' check(length(email)<=254),
 phone text not null default '' check(length(phone)<=40),
 address text not null default '' check(length(address)<=400),
 city text not null default '' check(length(city)<=100),
 website text not null default '' check(length(website)<=200),
 instagram text not null default '' check(length(instagram)<=100),
 pix_key text not null default '' check(length(pix_key)<=200),
 logo_data text not null default '' check(logo_data='' or (length(logo_data)<=700000 and logo_data ~ '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$')),
 updated_at timestamptz not null default now()
);
alter table public.business_profiles enable row level security;
create policy profile_owner on public.business_profiles for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
revoke all on public.business_profiles from public,anon,authenticated;
grant select,insert,update,delete on public.business_profiles to authenticated;
revoke all on public.business_profiles from anon;
create table public.billing_subscriptions(
 user_id uuid primary key references auth.users(id) on delete cascade,
 external_reference uuid not null unique default gen_random_uuid(),
 provider_id text unique, checkout_url text,
 status text not null default 'pending' check(status in ('pending','authorized','paused','cancelled')),
 price_cents integer not null default 2990 check(price_cents=2990), currency text not null default 'BRL' check(currency='BRL'),
 paid_until timestamptz, last_payment_at timestamptz,
 checkout_lock_until timestamptz, provider_updated_at timestamptz, updated_at timestamptz not null default now()
);
alter table public.billing_subscriptions enable row level security;
create policy subscription_read_owner on public.billing_subscriptions for select to authenticated using(user_id=auth.uid());
revoke all on public.billing_subscriptions from anon,authenticated;
grant select(user_id,status,price_cents,currency,paid_until,last_payment_at,updated_at) on public.billing_subscriptions to authenticated;
create table public.billing_provider_subscriptions(
 provider_id text primary key, external_reference uuid not null unique,
 user_id uuid not null references auth.users(id) on delete cascade
);
alter table public.billing_provider_subscriptions enable row level security;
revoke all on public.billing_provider_subscriptions from anon,authenticated;
grant all on public.billing_provider_subscriptions to service_role;
create table public.billing_payments(
 payment_id text primary key, authorized_payment_id text not null,
 user_id uuid not null references auth.users(id) on delete cascade,
 status text not null, amount_cents integer not null check(amount_cents=2990),currency text not null check(currency='BRL'),
 approved_at timestamptz not null, covered_until timestamptz not null, provider_updated_at timestamptz not null, updated_at timestamptz not null default now()
);
alter table public.billing_payments enable row level security;
revoke all on public.billing_payments from anon,authenticated;
grant all on public.billing_subscriptions,public.billing_payments,public.business_profiles to service_role;
create or replace function public.subscription_access()
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('enforced',coalesce((select enforce_subscriptions from billing_private.settings where singleton),false),
 'owner',exists(select 1 from billing_private.owner_access where user_id=auth.uid()),
 'active',exists(select 1 from public.billing_subscriptions where user_id=auth.uid() and paid_until>now()),
 'price_cents',2990,'currency','BRL');
$$;
revoke all on function public.subscription_access() from public,anon,authenticated;
grant execute on function public.subscription_access() to authenticated;
create or replace function billing_private.can_write()
returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and (
 not coalesce((select enforce_subscriptions from billing_private.settings where singleton),false)
 or exists(select 1 from billing_private.owner_access where user_id=auth.uid())
 or exists(select 1 from public.billing_subscriptions where user_id=auth.uid() and paid_until>now()));
$$;
-- Function access is necessary inside RLS; settings and owner grants stay inaccessible.
grant usage on schema billing_private to authenticated;
revoke all on function billing_private.can_write() from public,anon,authenticated;
grant execute on function billing_private.can_write() to authenticated;
-- Restrictive policies remain effective alongside any pre-existing permissive policies.
-- Expired customers retain read/export and deletion of their own data.
do $$ declare t text; begin
 foreach t in array array['events','quotes','contracts','user_preferences'] loop
  if to_regclass('public.'||t) is null then raise exception 'Missing existing table: %',t; end if;
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke truncate,references,trigger on public.%I from public,anon,authenticated',t);
  execute format('create policy saas_owner_allow on public.%I for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid())',t);
  execute format('create policy saas_owner_guard on public.%I as restrictive for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid())',t);
  execute format('create policy saas_anonymous_guard on public.%I as restrictive for all to anon using(false) with check(false)',t);
  if t <> 'user_preferences' then
   execute format('create policy saas_insert_subscription on public.%I as restrictive for insert to authenticated with check(billing_private.can_write())',t);
   execute format('create policy saas_update_subscription on public.%I as restrictive for update to authenticated using(billing_private.can_write()) with check(billing_private.can_write())',t);
  end if;
 end loop;
end $$;
-- Claims a short lease to prevent duplicate concurrent subscriptions; retries reuse the reference.
create function public.billing_begin_checkout(account uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.billing_subscriptions; begin
 insert into public.billing_subscriptions(user_id) values(account) on conflict do nothing;
 select * into s from public.billing_subscriptions where user_id=account for update;
 if s.paid_until>now() then return jsonb_build_object('active',true);end if;
 if s.checkout_url is not null and s.status='pending' then return jsonb_build_object('url',s.checkout_url);end if;
 if s.provider_id is not null and s.status in ('authorized','paused') then return jsonb_build_object('existing',true);end if;
 if s.checkout_lock_until>now() then return jsonb_build_object('busy',true);end if;
 if s.status='cancelled' then
  update public.billing_subscriptions set external_reference=gen_random_uuid(),provider_id=null,checkout_url=null,status='pending' where user_id=account returning * into s;
 end if;
 update public.billing_subscriptions set checkout_lock_until=now()+interval '2 minutes' where user_id=account;
 return jsonb_build_object('reference',s.external_reference);
end $$;
create function public.billing_recalculate(account uuid)
returns void language sql security definer set search_path='' as $$
 update public.billing_subscriptions set
 paid_until=(select max(covered_until) from public.billing_payments where user_id=account and status='approved'),
 last_payment_at=(select max(approved_at) from public.billing_payments where user_id=account and status='approved'),updated_at=now()
 where user_id=account;
$$;
revoke all on function public.billing_begin_checkout(uuid),public.billing_recalculate(uuid) from public,anon,authenticated;
grant execute on function public.billing_begin_checkout(uuid),public.billing_recalculate(uuid) to service_role;
create function public.billing_apply_payment(account uuid, record jsonb)
returns void language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.billing_subscriptions where user_id=account for update;
 if not found then raise exception 'Unknown subscription'; end if;
 insert into public.billing_payments(payment_id,authorized_payment_id,user_id,status,amount_cents,currency,approved_at,covered_until,provider_updated_at)
 values(record->>'payment_id',record->>'authorized_payment_id',account,record->>'status',(record->>'amount_cents')::integer,record->>'currency',(record->>'approved_at')::timestamptz,(record->>'covered_until')::timestamptz,(record->>'provider_updated_at')::timestamptz)
 on conflict(payment_id) do update set status=excluded.status,provider_updated_at=excluded.provider_updated_at,updated_at=now()
 where public.billing_payments.user_id=excluded.user_id and (public.billing_payments.provider_updated_at<excluded.provider_updated_at or
  (public.billing_payments.provider_updated_at=excluded.provider_updated_at and public.billing_payments.status='approved' and excluded.status<>'approved'));
 perform public.billing_recalculate(account);
end $$;
revoke all on function public.billing_apply_payment(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.billing_apply_payment(uuid,jsonb) to service_role;
commit;
