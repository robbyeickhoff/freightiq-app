-- Local-only repair: private function bodies matched live hashes before permission restoration.
-- Main production was inspected read-only; this file must run only in supabase_db_mfi.
begin;
revoke execute on function private.record_freightiq_read_shadow_event(text,integer,timestamp with time zone,text,double precision,double precision,double precision,integer,integer,integer,integer) from public,anon,authenticated,service_role;

revoke execute on function private.purge_freightiq_read_shadow_events() from public,anon,authenticated,service_role;
grant execute on function private.purge_freightiq_read_shadow_events() to service_role;
revoke execute on function private.is_trusted_stop_editor() from public,anon,authenticated,service_role;
grant execute on function private.is_trusted_stop_editor() to authenticated;
revoke execute on function private.queue_founding_driver_welcome(uuid) from public,anon,authenticated,service_role;
grant execute on function private.queue_founding_driver_welcome(uuid) to authenticated;
revoke execute on function private.is_founding_driver_admin() from public,anon,authenticated,service_role;
grant execute on function private.is_founding_driver_admin() to authenticated;
revoke execute on function private.prepare_founding_driver_activity_event() from public,anon,authenticated,service_role;

revoke execute on function private.refresh_founding_driver_stop_candidate(text,uuid,uuid,text[],boolean) from public,anon,authenticated,service_role;

revoke execute on function private.founding_driver_core_snapshot(text) from public,anon,authenticated,service_role;

revoke execute on function private.capture_founding_driver_report_completion() from public,anon,authenticated,service_role;

revoke execute on function private.capture_founding_driver_delivery_zone_completion() from public,anon,authenticated,service_role;

revoke execute on function private.set_founding_driver_delivery_zone(text,double precision,double precision) from public,anon,authenticated,service_role;
grant execute on function private.set_founding_driver_delivery_zone(text,double precision,double precision) to authenticated;
revoke execute on function private.prepare_founding_driver_stop_contribution_review() from public,anon,authenticated,service_role;

revoke execute on function private.get_founding_driver_leaderboard() from public,anon,authenticated,service_role;
grant execute on function private.get_founding_driver_leaderboard() to authenticated;
grant execute on function private.get_founding_driver_leaderboard() to service_role;
revoke execute on function private.guard_founding_driver_profile_image_path() from public,anon,authenticated,service_role;

revoke execute on function private.can_manage_own_founding_driver_profile_image(text,text) from public,anon,authenticated,service_role;
grant execute on function private.can_manage_own_founding_driver_profile_image(text,text) to authenticated;
grant execute on function private.can_manage_own_founding_driver_profile_image(text,text) to service_role;
revoke execute on function private.can_read_founding_driver_profile_image(text,text) from public,anon,authenticated,service_role;
grant execute on function private.can_read_founding_driver_profile_image(text,text) to authenticated;
grant execute on function private.can_read_founding_driver_profile_image(text,text) to service_role;
revoke execute on function private.prepare_referral_contribution_review() from public,anon,authenticated,service_role;

revoke execute on function private.get_referral_progress() from public,anon,authenticated,service_role;
grant execute on function private.get_referral_progress() to authenticated;
grant execute on function private.get_referral_progress() to service_role;
revoke execute on function private.dispatch_freightiq_guarded_read(text,jsonb) from public,anon,authenticated,service_role;

revoke execute on function private.purge_freightiq_read_guard() from public,anon,authenticated,service_role;

revoke execute on function private.qualify_referral(uuid) from public,anon,authenticated,service_role;
grant execute on function private.qualify_referral(uuid) to authenticated;
revoke execute on function private.read_freightiq_guarded_core(text,jsonb) from public,anon,authenticated,service_role;

revoke execute on function private.delete_freightiq_read_guard_for_user() from public,anon,authenticated,service_role;

revoke execute on function private.read_owned_freightiq_report(text) from public,anon,authenticated,service_role;
grant execute on function private.read_owned_freightiq_report(text) to authenticated;
revoke execute on function private.mark_referral_reward_paid(uuid) from public,anon,authenticated,service_role;
grant execute on function private.mark_referral_reward_paid(uuid) to authenticated;
revoke execute on function private.read_owned_freightiq_stop_editor(text) from public,anon,authenticated,service_role;
grant execute on function private.read_owned_freightiq_stop_editor(text) to authenticated;
revoke execute on function private.is_moderation_admin() from public,anon,authenticated,service_role;
grant execute on function private.is_moderation_admin() to authenticated;
revoke execute on function private.is_contributor_restricted(uuid) from public,anon,authenticated,service_role;
grant execute on function private.is_contributor_restricted(uuid) to authenticated;
revoke execute on function private.enforce_contributor_write_access() from public,anon,authenticated,service_role;

revoke execute on function private.read_owned_operations_editor(uuid) from public,anon,authenticated,service_role;
grant execute on function private.read_owned_operations_editor(uuid) to authenticated;
revoke execute on function private.read_operations_active_page(text,integer,jsonb) from public,anon,authenticated,service_role;

revoke execute on function private.purge_operations_read_guard() from public,anon,authenticated,service_role;

revoke execute on function private.delete_operations_read_guard_for_user() from public,anon,authenticated,service_role;

revoke execute on function private.read_operations_guarded_core(text,integer,jsonb) from public,anon,authenticated,service_role;

revoke execute on function private.operations_chain_step(bytea,text) from public,anon,authenticated,service_role;

revoke execute on function private.operations_chain(text[]) from public,anon,authenticated,service_role;

revoke execute on function private.operations_chain_source(text,integer,integer,boolean) from public,anon,authenticated,service_role;

revoke execute on function private.operations_chain_seal(jsonb,text) from public,anon,authenticated,service_role;

revoke execute on function private.operations_chain_seal_matches(text,text) from public,anon,authenticated,service_role;

revoke execute on function private.operations_has_similar(text,text,text,double precision,double precision) from public,anon,authenticated,service_role;
grant execute on function private.operations_has_similar(text,text,text,double precision,double precision) to authenticated;
revoke execute on function private.read_owned_operations_history(text) from public,anon,authenticated,service_role;
grant execute on function private.read_owned_operations_history(text) to authenticated;
revoke execute on function private.assign_profile_referral_code() from public,anon,authenticated,service_role;

revoke execute on function private.capture_new_user_referral() from public,anon,authenticated,service_role;

revoke execute on function private.new_referral_code() from public,anon,authenticated,service_role;

revoke execute on function private.activate_verified_referral() from public,anon,authenticated,service_role;

revoke execute on function private.prepare_referral_activity_event() from public,anon,authenticated,service_role;

revoke execute on function private.prepare_mfi_stop_locality() from public,anon,authenticated,service_role;

revoke execute on function private.refresh_referral_stop_candidate(text,uuid,uuid,text[],boolean) from public,anon,authenticated,service_role;

revoke execute on function private.capture_referral_report_completion() from public,anon,authenticated,service_role;

revoke execute on function private.capture_referral_delivery_zone_completion() from public,anon,authenticated,service_role;

revoke execute on function private.security_actor(uuid) from public,anon,authenticated,service_role;

revoke execute on function private.require_security_moderator() from public,anon,authenticated,service_role;

revoke execute on function private.set_referral_delivery_zone(text,double precision,double precision) from public,anon,authenticated,service_role;
grant execute on function private.set_referral_delivery_zone(text,double precision,double precision) to authenticated;
revoke execute on function private.finalize_verified_signup_referral(text) from public,anon,authenticated,service_role;
grant execute on function private.finalize_verified_signup_referral(text) to authenticated;
grant execute on function private.finalize_verified_signup_referral(text) to service_role;
revoke execute on function private.get_founding_driver_email_admin_status() from public,anon,authenticated,service_role;
grant execute on function private.get_founding_driver_email_admin_status() to authenticated;
revoke execute on function private.purge_security_response() from public,anon,authenticated,service_role;

revoke execute on function private.record_security_read(boolean,integer) from public,anon,authenticated,service_role;

revoke execute on function private.security_pause_seconds() from public,anon,authenticated,service_role;

revoke execute on function private.complete_security_alert(uuid,uuid,text,uuid) from public,anon,authenticated,service_role;
grant execute on function private.complete_security_alert(uuid,uuid,text,uuid) to service_role;
revoke execute on function private.delete_security_response_for_user() from public,anon,authenticated,service_role;

revoke execute on function private.security_case_act(uuid,integer,integer,text) from public,anon,authenticated,service_role;
grant execute on function private.security_case_act(uuid,integer,integer,text) to authenticated;
revoke execute on function private.claim_security_alert() from public,anon,authenticated,service_role;
grant execute on function private.claim_security_alert() to service_role;
revoke execute on function private.authorize_security_alert(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function private.authorize_security_alert(uuid,uuid) to service_role;
revoke execute on function private.set_founding_driver_reward_preference(text,text) from public,anon,authenticated,service_role;
grant execute on function private.set_founding_driver_reward_preference(text,text) to authenticated;
revoke execute on function private.queue_founding_driver_review_email() from public,anon,authenticated,service_role;

revoke execute on function private.complete_founding_driver_review_email(uuid,text) from public,anon,authenticated,service_role;
grant execute on function private.complete_founding_driver_review_email(uuid,text) to service_role;
revoke execute on function private.claim_founding_driver_review_email(text) from public,anon,authenticated,service_role;
grant execute on function private.claim_founding_driver_review_email(text) to service_role;
revoke execute on function private.record_security_read(boolean,integer,integer,integer) from public,anon,authenticated,service_role;

revoke execute on function private.read_with_security_response(text,text,jsonb,text,integer,jsonb) from public,anon,authenticated,service_role;
grant execute on function private.read_with_security_response(text,text,jsonb,text,integer,jsonb) to authenticated;
revoke execute on function private.can_contribute_operations(uuid) from public,anon,authenticated,service_role;
grant execute on function private.can_contribute_operations(uuid) to authenticated;
revoke execute on function private.security_case_list(uuid,timestamp with time zone,uuid) from public,anon,authenticated,service_role;
grant execute on function private.security_case_list(uuid,timestamp with time zone,uuid) to authenticated;
revoke execute on function private.get_own_founding_driver_email_preference() from public,anon,authenticated,service_role;
grant execute on function private.get_own_founding_driver_email_preference() to authenticated;
revoke execute on function private.security_delivery_health() from public,anon,authenticated,service_role;
grant execute on function private.security_delivery_health() to service_role;
revoke execute on function private.set_own_founding_driver_email_preference(boolean) from public,anon,authenticated,service_role;
grant execute on function private.set_own_founding_driver_email_preference(boolean) to authenticated;
revoke execute on function private.prepare_content_report() from public,anon,authenticated,service_role;

revoke execute on function private.initialize_founding_driver_email() from public,anon,authenticated,service_role;

revoke execute on function private.queue_founding_driver_review_result() from public,anon,authenticated,service_role;

revoke execute on function private.move_freightiq_stop(text,jsonb,jsonb) from public,anon,authenticated,service_role;
grant execute on function private.move_freightiq_stop(text,jsonb,jsonb) to authenticated;
revoke execute on function private.can_move_freightiq_stop(text) from public,anon,authenticated,service_role;
grant execute on function private.can_move_freightiq_stop(text) to authenticated;
revoke execute on function private.claim_founding_driver_email() from public,anon,authenticated,service_role;
grant execute on function private.claim_founding_driver_email() to service_role;
revoke execute on function private.complete_founding_driver_email(uuid,text) from public,anon,authenticated,service_role;
grant execute on function private.complete_founding_driver_email(uuid,text) to service_role;
grant usage on schema private to authenticated,service_role;
commit;
