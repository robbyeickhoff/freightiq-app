begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

select ok(
  not exists (
    select 1
    from pg_proc p
    cross join lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) acl
    where p.oid='public.rls_auto_enable()'::regprocedure
      and acl.grantee=0
      and acl.privilege_type='EXECUTE'
  ),
  'PUBLIC cannot execute the automatic RLS event-trigger function'
);
select ok(not has_function_privilege('anon','public.rls_auto_enable()','execute'),'anonymous execution denied');
select ok(not has_function_privilege('authenticated','public.rls_auto_enable()','execute'),'authenticated execution denied');
select ok(not has_function_privilege('service_role','public.rls_auto_enable()','execute'),'service-role direct execution denied');
select ok(has_function_privilege('postgres','public.rls_auto_enable()','execute'),'function owner execution retained');

select is((select prosecdef from pg_proc where oid='public.rls_auto_enable()'::regprocedure),true,'SECURITY DEFINER retained');
select is((select prorettype::regtype::text from pg_proc where oid='public.rls_auto_enable()'::regprocedure),'event_trigger','event-trigger return type retained');
select is((select proconfig from pg_proc where oid='public.rls_auto_enable()'::regprocedure),array['search_path=pg_catalog']::text[],'fixed search path retained');

select is((select evtevent from pg_event_trigger where evtname='ensure_rls'),'ddl_command_end','automatic RLS trigger event retained');
select is((select evtenabled::text from pg_event_trigger where evtname='ensure_rls'),'O','automatic RLS trigger remains enabled');
select is((select evtfoid from pg_event_trigger where evtname='ensure_rls'),'public.rls_auto_enable()'::regprocedure::oid,'trigger remains bound to the same function');

create table public.__rls_auto_enable_probe(id bigint);
select ok((select relrowsecurity from pg_class where oid='public.__rls_auto_enable_probe'::regclass),'automatic RLS still protects a newly created public table');

select * from finish();
rollback;
