begin;

-- Retain legacy Other values so existing arrangements and older clients still work.
alter table public.founding_driver_enrollments
  drop constraint founding_driver_enrollments_payment_preference_check;
alter table public.founding_driver_enrollments
  add constraint founding_driver_enrollments_payment_preference_check
  check (payment_preference is null or payment_preference in
    ('venmo', 'paypal', 'cash_app', 'amazon_gift_card', 'other'));

-- Drivers cannot update enrollment rows directly. This private implementation
-- intentionally has elevated privileges, but accepts no user or enrollment ID
-- and updates only the caller's preference fields. Admin-only RLS is unchanged.
create or replace function private.set_founding_driver_reward_preference(
  p_method text, p_details text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  method text := btrim(p_method);
  details text := btrim(p_details);
begin
  if caller_id is null then
    raise exception 'Founding Driver access required' using errcode = '42501';
  end if;
  if method is null or method not in ('venmo', 'paypal', 'cash_app', 'amazon_gift_card') then
    raise exception 'Choose a reward payment method' using errcode = '22023';
  end if;
  if details is null or char_length(details) = 0 or char_length(details) > 200 then
    raise exception 'Enter delivery details of at most 200 characters' using errcode = '22023';
  end if;
  if (method = 'venmo' and details !~ '^@[A-Za-z0-9_-]+$')
    or (method = 'cash_app' and details !~ '^\$[A-Za-z0-9]+$')
    or (method in ('paypal', 'amazon_gift_card') and details !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then
    raise exception 'Enter valid delivery details for the selected method' using errcode = '22023';
  end if;
  update public.founding_driver_enrollments
    set payment_preference = method,
        payment_preference_note = details,
        updated_at = now()
    where user_id = caller_id and status in ('active', 'qualified', 'completed');
  if not found then
    raise exception 'Founding Driver access required' using errcode = '42501';
  end if;
end;
$$;

revoke all on function private.set_founding_driver_reward_preference(text, text)
  from public, anon, authenticated;
grant execute on function private.set_founding_driver_reward_preference(text, text)
  to authenticated;

create or replace function public.set_founding_driver_reward_preference(
  p_method text, p_details text
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.set_founding_driver_reward_preference(p_method, p_details);
$$;

revoke all on function public.set_founding_driver_reward_preference(text, text)
  from public, anon, authenticated;
grant execute on function public.set_founding_driver_reward_preference(text, text)
  to authenticated;

comment on function public.set_founding_driver_reward_preference(text, text) is
  'Save only the signed-in eligible Founding Driver payment method and delivery details; no qualification or payment-status changes.';

commit;
