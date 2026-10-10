-- PRE-CLIENT rollback only; requires separate production approval and fresh baseline check.
-- Restores the two live trigger definitions captured 2026-10-05.
-- Does not undo any previously saved stop positions. Do not use after client rollout blindly.
begin;
set local lock_timeout = '2s';
set local statement_timeout = '15s';
drop function public.move_freightiq_stop_v1(text,jsonb,jsonb);
drop function public.can_move_freightiq_stop_v1(text);
drop function private.move_freightiq_stop(text,jsonb,jsonb);
drop function private.can_move_freightiq_stop(text);
drop trigger capture_founding_driver_delivery_zone_completion on public.mfi_stops;
CREATE TRIGGER capture_founding_driver_delivery_zone_completion AFTER UPDATE OF entrance_lat, entrance_lng ON public.mfi_stops FOR EACH ROW EXECUTE FUNCTION private.capture_founding_driver_delivery_zone_completion();
drop trigger capture_referral_delivery_zone_completion on public.mfi_stops;
CREATE TRIGGER capture_referral_delivery_zone_completion AFTER UPDATE OF entrance_lat, entrance_lng ON public.mfi_stops FOR EACH ROW EXECUTE FUNCTION private.capture_referral_delivery_zone_completion();
commit;
