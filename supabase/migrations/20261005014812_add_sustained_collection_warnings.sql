-- Additive, disabled/unconfigured warning candidate. No production policy is selected here.
-- Reuse existing 15-minute keyed deduplication; retain no additional target identifiers.
alter table private.security_response_config
 add column warn_metadata_15m integer check(warn_metadata_15m between 1 and 1000000),
 add column warn_detail_15m integer check(warn_detail_15m between 1 and 1000000),
 add column warn_detail_60m integer check(warn_detail_60m between 1 and 1000000);
alter table private.security_read_minutes
 add column metadata_charged bigint not null default 0 check(metadata_charged>=0),
 add column detail_charged bigint not null default 0 check(detail_charged>=0);
alter table private.security_read_cases
 add column metadata_charged_15m bigint not null default 0,
 add column detail_charged_15m bigint not null default 0,
 add column detail_charged_60m bigint not null default 0;

create function private.record_security_read(p_denied boolean,p_disclosed integer,p_metadata integer,p_detail integer)
returns void language plpgsql security definer set search_path='' as $$
declare c private.security_response_config%rowtype; a bytea; d bigint; r bigint; n integer;
 m bigint; t bigint; h bigint; mn integer; tn integer; hn integer; cid uuid;
begin
 if auth.uid() is null then raise insufficient_privilege; end if;
 if p_metadata is null or p_detail is null or p_metadata<0 or p_detail<0
  or (p_denied and (p_metadata>0 or p_detail>0)) then raise invalid_parameter_value; end if;
 select * into strict c from private.security_response_config;
 if not c.detection_enabled then return; end if;
 a:=private.security_actor(auth.uid());
 perform pg_advisory_xact_lock(hashtextextended(encode(a,'hex'),7421));
 insert into private.security_read_minutes(actor_key,minute,denied,disclosed,metadata_charged,detail_charged)
 values(a,date_trunc('minute',clock_timestamp()),case when p_denied then 1 else 0 end,
  greatest(0,coalesce(p_disclosed,0)),p_metadata,p_detail)
 on conflict(actor_key,minute) do update set denied=security_read_minutes.denied+excluded.denied,
 disclosed=security_read_minutes.disclosed+excluded.disclosed,
 metadata_charged=security_read_minutes.metadata_charged+excluded.metadata_charged,
 detail_charged=security_read_minutes.detail_charged+excluded.detail_charged;
 select coalesce(sum(denied),0),coalesce(sum(disclosed),0),count(*),
 coalesce(sum(metadata_charged),0),coalesce(sum(detail_charged),0),
 count(*) filter(where metadata_charged>0),count(*) filter(where detail_charged>0)
 into d,r,n,m,t,mn,tn from private.security_read_minutes
 where actor_key=a and minute>=date_trunc('minute',clock_timestamp())-interval '14 minutes';
 select coalesce(sum(detail_charged),0),count(*) filter(where detail_charged>0) into h,hn
 from private.security_read_minutes
 where actor_key=a and minute>=date_trunc('minute',clock_timestamp())-interval '59 minutes';
 -- Legacy denial signal stays intact. Independent collection signals need actual
 -- newly charged items in multiple minutes, not automatic/repeated returned rows.
 if not ((d>=c.min_denied and r>=c.min_disclosed and n>=c.min_minutes)
  or coalesce(m>=c.warn_metadata_15m and mn>=c.min_minutes,false)
  or coalesce(t>=c.warn_detail_15m and tn>=c.min_minutes,false)
  or coalesce(h>=c.warn_detail_60m and hn>=2,false)) then return; end if;
 delete from private.security_read_cases where actor_key=a and expires_at<=clock_timestamp();
 insert into private.security_read_cases(actor_key,denied,disclosed,active_minutes,
  metadata_charged_15m,detail_charged_15m,detail_charged_60m)
 values(a,d,r,n,m,t,h) on conflict(actor_key) do update set
 last_seen_at=clock_timestamp(),denied=excluded.denied,disclosed=excluded.disclosed,
 active_minutes=excluded.active_minutes,metadata_charged_15m=excluded.metadata_charged_15m,
 detail_charged_15m=excluded.detail_charged_15m,detail_charged_60m=excluded.detail_charged_60m
 returning id into cid;
 insert into private.security_alert_outbox(case_id,recipient_id,recipient)
 select cid,u.id,u.email from private.security_alert_recipients ar
 join private.moderation_admins ma on ma.user_id=ar.user_id join auth.users u on u.id=ar.user_id
 where u.email_confirmed_at is not null and u.email is not null
 on conflict(case_id,recipient_id) do nothing;
end;
$$;
revoke all on function private.record_security_read(boolean,integer,integer,integer)
 from public,anon,authenticated,service_role;
-- Preserve the existing private test/integration signature and denial semantics.
create or replace function private.record_security_read(p_denied boolean,p_disclosed integer)
returns void language sql security definer set search_path='' as $$
 select private.record_security_read(p_denied,p_disclosed,0,0);
$$;

-- Surgical, assertion-guarded substitutions preserve the existing guard algorithm,
-- signatures, owners and ACLs. Unknown definitions abort the migration atomically.
do $patch$
declare definition text; needle text; replacement text;
begin
 definition:=pg_get_functiondef('private.read_freightiq_guarded_core(text,jsonb)'::regprocedure);
 needle:='return jsonb_build_object(''code'',null,''data'',v_result);';
 replacement:='return jsonb_build_object(''code'',null,''data'',v_result,''_security_metadata'',case when v_class=''metadata'' then v_cost else 0 end,''_security_detail'',case when v_class=''detail'' then v_cost else 0 end);';
 if (length(definition)-length(replace(definition,needle,'')))/length(needle)<>1 then
  raise exception 'Library guard definition drift: review warning integration'; end if;
 execute replace(definition,needle,replacement);
 definition:=pg_get_functiondef('private.read_with_security_response(text,text,jsonb,text,integer,jsonb)'::regprocedure);
 needle:='perform private.record_security_read(code is not null,disclosed);';
 replacement:='perform private.record_security_read(code is not null,disclosed,case when p_surface=''library'' and code is null then (result->>''_security_metadata'')::integer else 0 end,case when p_surface=''library'' and code is null then (result->>''_security_detail'')::integer else 0 end);';
 if (length(definition)-length(replace(definition,needle,'')))/length(needle)<>1 then
  raise exception 'Security wrapper definition drift: review warning integration'; end if;
 definition:=replace(definition,needle,replacement);
 needle:='return result;';
 if (length(definition)-length(replace(definition,needle,'')))/length(needle)<>1 then
  raise exception 'Security reply definition drift: review warning integration'; end if;
 execute replace(definition,needle,'return result - ''_security_metadata'' - ''_security_detail'';');
 definition:=pg_get_functiondef('private.security_case_list(uuid,timestamp with time zone,uuid)'::regprocedure);
 needle:='c.denied,c.disclosed,c.active_minutes,c.paused_until,c.version,';
 if (length(definition)-length(replace(definition,needle,'')))/length(needle)<>1 then
  raise exception 'Case listing definition drift: review warning integration'; end if;
 execute replace(definition,needle,'c.denied,c.disclosed,c.active_minutes,c.paused_until,c.version,c.metadata_charged_15m,c.detail_charged_15m,c.detail_charged_60m,');
end;
$patch$;
