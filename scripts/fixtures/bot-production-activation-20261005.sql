-- Approved October 5, 2026. ONLY finjqunyuyfxiesumuxk, before compatible-client release.
begin;
set local lock_timeout='1s';
set local statement_timeout='10s';
set local idle_in_transaction_session_timeout='15s';
do $$
begin
 if (select count(*) from private.freightiq_read_guard_config)<>1 or
    (select count(*) from private.operations_read_guard_config)<>1 or
    (select count(*) from private.security_response_config)<>1 then
   raise exception 'Unexpected configuration row count';
 end if;
 perform 1 from private.freightiq_read_guard_config for update;
 perform 1 from private.operations_read_guard_config for update;
 perform 1 from private.security_response_config for update;
 if not exists(select 1 from private.freightiq_read_guard_config where not enabled and request_capacity is null and request_refill is null and metadata_capacity is null and metadata_refill is null and detail_capacity is null and detail_refill is null)
 or not exists(select 1 from private.operations_read_guard_config where not enabled and request_capacity is null and request_refill is null and row_capacity is null and row_refill is null)
 or not exists(select 1 from private.security_response_config where not detection_enabled and mail_enabled and min_denied is null and min_disclosed is null and min_minutes is null and warn_metadata_15m is null and warn_detail_15m is null and warn_detail_60m is null) then
 raise exception 'Starting policy changed; stop activation'; end if;
 update private.freightiq_read_guard_config set enabled=true,request_capacity=120,request_refill=2,metadata_capacity=12000,metadata_refill=10,detail_capacity=150,detail_refill=0.25 where singleton;
 update private.operations_read_guard_config set enabled=true,request_capacity=120,request_refill=2,row_capacity=20000,row_refill=100 where singleton;
 update private.security_response_config set detection_enabled=true,min_denied=20,min_disclosed=100,min_minutes=3,warn_metadata_15m=6000,warn_detail_15m=250,warn_detail_60m=750 where singleton;
end $$;
commit;
