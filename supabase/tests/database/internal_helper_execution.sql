begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

select ok(
  not has_function_privilege(
    'authenticated',
    'private.can_contribute_operations(uuid)',
    'execute'
  ),
  'authenticated cannot directly execute the Operations eligibility helper'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'private.is_contributor_restricted(uuid)',
    'execute'
  ),
  'authenticated cannot directly execute the contributor restriction helper'
);
select ok(
  has_function_privilege(
    'authenticated',
    'private.is_moderation_admin()',
    'execute'
  ),
  'authenticated retains the moderation helper required by active RLS policies'
);
select ok(
  has_function_privilege(
    'authenticated',
    'private.is_trusted_stop_editor()',
    'execute'
  ),
  'authenticated retains the trusted-editor helper required by active RLS policies'
);
select ok(
  has_schema_privilege('authenticated', 'private', 'usage'),
  'authenticated retains private-schema usage required by active RLS policies'
);

insert into auth.users (id, email, created_at, updated_at)
values (
  '75000000-0000-4000-8000-000000000001',
  'helper-boundary@example.test',
  now(),
  now()
);
insert into public.profiles (id, username)
values ('75000000-0000-4000-8000-000000000001', 'Helper Boundary');
insert into public.founding_driver_enrollments (user_id, status)
values ('75000000-0000-4000-8000-000000000001', 'active');

set local role authenticated;
set local "request.jwt.claim.sub" = '75000000-0000-4000-8000-000000000001';

select throws_ok(
  $$select private.can_contribute_operations(auth.uid())$$,
  '42501',
  null,
  'direct Operations eligibility helper execution is denied'
);
select throws_ok(
  $$select private.is_contributor_restricted(auth.uid())$$,
  '42501',
  null,
  'direct contributor restriction helper execution is denied'
);
select is(
  public.can_post_operations_update(),
  true,
  'public Operations eligibility wrapper still works for an eligible driver'
);
select is(
  public.is_moderation_admin(),
  false,
  'public moderation wrapper still works for an ordinary driver'
);

reset role;
insert into private.moderation_admins (user_id)
values ('75000000-0000-4000-8000-000000000001');
set local role authenticated;
select is(
  public.is_moderation_admin(),
  true,
  'public moderation wrapper still recognizes a moderator'
);
select lives_ok(
  $$select private.is_moderation_admin()$$,
  'RLS-required moderation helper remains executable'
);

select * from finish();
rollback;
