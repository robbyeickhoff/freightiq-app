-- Explicit private delivery configuration, not a new administrator role.
-- Default preserves the moderator's own confirmed address. No recipient is configured here.
alter table private.security_alert_recipients add column delivery_user_id uuid
 references auth.users(id) on delete cascade;
comment on column private.security_alert_recipients.delivery_user_id is
 'Optional confirmed-email account for the approved inbox; conveys no moderator privileges. Set only by approved server administration.';
do $patch$
declare signature text; definition text; needle text:='join auth.users u on u.id=ar.user_id';
begin
 foreach signature in array array[
  'private.record_security_read(boolean,integer,integer,integer)',
  'private.claim_security_alert()',
  'private.authorize_security_alert(uuid,uuid)'
 ] loop
  definition:=pg_get_functiondef(signature::regprocedure);
  if (length(definition)-length(replace(definition,needle,'')))/length(needle)<>1 then
   raise exception 'Security recipient definition drift in %',signature; end if;
  definition:=replace(definition,needle,'join auth.users u on u.id=coalesce(ar.delivery_user_id,ar.user_id)');
  if signature='private.record_security_read(boolean,integer,integer,integer)' then
   if position('select cid,u.id,u.email' in definition)=0 then raise exception 'Outbox owner definition drift'; end if;
   definition:=replace(definition,'select cid,u.id,u.email','select cid,ar.user_id,u.email');
  end if;
  execute definition;
 end loop;
end;
$patch$;
