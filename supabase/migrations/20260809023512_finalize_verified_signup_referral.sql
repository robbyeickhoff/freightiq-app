create or replace function private.finalize_verified_signup_referral(p_code text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user auth.users%rowtype;
  v_referrer_user_id uuid;
  v_start_date date;
begin
  if auth.uid() is null then
    return false;
  end if;

  select * into v_user
  from auth.users
  where id = auth.uid()
    and email_confirmed_at is not null
    and created_at >= clock_timestamp() - interval '24 hours';

  if not found then
    return false;
  end if;

  if exists (
    select 1 from public.driver_referrals
    where referred_user_id = v_user.id
  ) then
    return true;
  end if;

  select id into v_referrer_user_id
  from public.profiles
  where referral_code = upper(btrim(p_code));

  if v_referrer_user_id is null or v_referrer_user_id = v_user.id then
    return false;
  end if;

  v_start_date := (v_user.email_confirmed_at at time zone 'America/Denver')::date;

  insert into public.driver_referrals (
    referrer_user_id,
    referred_user_id,
    status,
    start_date,
    end_date
  ) values (
    v_referrer_user_id,
    v_user.id,
    'active',
    v_start_date,
    v_start_date + 29
  ) on conflict (referred_user_id) do nothing;

  return exists (
    select 1 from public.driver_referrals
    where referred_user_id = v_user.id
      and referrer_user_id = v_referrer_user_id
  );
end;
$$;

revoke all on function private.finalize_verified_signup_referral(text)
from public, anon, authenticated;

create or replace function public.finalize_verified_signup_referral(p_code text)
returns boolean
language sql
volatile
set search_path = ''
as $$
  select private.finalize_verified_signup_referral(p_code);
$$;

revoke all on function public.finalize_verified_signup_referral(text) from public, anon;
grant execute on function public.finalize_verified_signup_referral(text) to authenticated, service_role;
