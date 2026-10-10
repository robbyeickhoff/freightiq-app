-- Recovery ONLY before compatible clients ship. Restore captured October 5 policy columns.
-- This makes new guarded APIs unavailable. Never use after clients depend on them.
-- No salts, grants, recipients, mail settings, schedules or records are changed.
begin;
set local lock_timeout='1s';
set local statement_timeout='10s';
update private.freightiq_read_guard_config set enabled=false,request_capacity=null,request_refill=null,metadata_capacity=null,metadata_refill=null,detail_capacity=null,detail_refill=null where singleton;
update private.operations_read_guard_config set enabled=false,request_capacity=null,request_refill=null,row_capacity=null,row_refill=null where singleton;
update private.security_response_config set detection_enabled=false,min_denied=null,min_disclosed=null,min_minutes=null,warn_metadata_15m=null,warn_detail_15m=null,warn_detail_60m=null where singleton;
commit;
