-- Routing Lab only: bnhtwtcoalfgqtcgxmsh (freightiq-routing-lab).
-- Match the application's canonical locality alias without rewriting evidence.
-- CREATE OR REPLACE preserves the existing function owner and ACL.
CREATE OR REPLACE FUNCTION public.routing_lab_canonical_address_key(p_address text, p_city text, p_state text, p_postal_code text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
declare
  v_address text := lower(coalesce(p_address, ''));
  v_city text;
  v_postal_code text;
  v_state text;
  v_token text;
  v_tokens text[] := '{}';
begin
  v_address := regexp_replace(v_address, '[[:space:]]+(apt|apartment|bldg|building|dept|department|floor|fl|hangar|lot|room|rm|ste|suite|trailer|unit)([[:space:]#.:,-]+.*)?$', '', 'i');
  v_address := regexp_replace(v_address, '[[:space:]]+#[[:space:]]*[[:alnum:]-]+.*$', '', 'i');
  v_address := regexp_replace(v_address, '[^[:alnum:]]+', ' ', 'g');
  v_address := regexp_replace(v_address, '\m(united states|u[[:space:]]+s)[[:space:]]+(highway|hwy|route|rte)\M', 'us', 'g');
  v_address := regexp_replace(v_address, '\m(state|st)[[:space:]]+(highway|hwy|route|rte)\M', 'state', 'g');
  v_address := regexp_replace(v_address, '\m(county|co)[[:space:]]+(road|rd|route|rte)\M', 'county rd', 'g');
  v_address := regexp_replace(v_address, '\m(highway|hwy)\M', 'hwy', 'g');

  foreach v_token in array regexp_split_to_array(btrim(v_address), '[[:space:]]+') loop
    v_tokens := array_append(v_tokens, case v_token
      when 'alley' then 'aly' when 'avenue' then 'ave' when 'boulevard' then 'blvd'
      when 'circle' then 'cir' when 'court' then 'ct' when 'drive' then 'dr'
      when 'expressway' then 'expy' when 'freeway' then 'fwy' when 'lane' then 'ln'
      when 'parkway' then 'pkwy' when 'place' then 'pl' when 'road' then 'rd'
      when 'square' then 'sq' when 'street' then 'st' when 'terrace' then 'ter'
      when 'trail' then 'trl' when 'north' then 'n' when 'south' then 's'
      when 'east' then 'e' when 'west' then 'w' when 'northeast' then 'ne'
      when 'northwest' then 'nw' when 'southeast' then 'se' when 'southwest' then 'sw'
      else v_token end);
  end loop;

  v_city := btrim(regexp_replace(lower(coalesce(p_city, '')), '[^[:alnum:]]+', ' ', 'g'));
  v_city := case when v_city = 'ridgeway' then 'ridgway' else v_city end;
  v_state := btrim(regexp_replace(lower(coalesce(p_state, '')), '[^[:alpha:]]+', ' ', 'g'));
  v_state := case v_state
    when 'alabama' then 'al' when 'alaska' then 'ak' when 'arizona' then 'az' when 'arkansas' then 'ar'
    when 'california' then 'ca' when 'colorado' then 'co' when 'connecticut' then 'ct' when 'delaware' then 'de'
    when 'florida' then 'fl' when 'georgia' then 'ga' when 'hawaii' then 'hi' when 'idaho' then 'id'
    when 'illinois' then 'il' when 'indiana' then 'in' when 'iowa' then 'ia' when 'kansas' then 'ks'
    when 'kentucky' then 'ky' when 'louisiana' then 'la' when 'maine' then 'me' when 'maryland' then 'md'
    when 'massachusetts' then 'ma' when 'michigan' then 'mi' when 'minnesota' then 'mn' when 'mississippi' then 'ms'
    when 'missouri' then 'mo' when 'montana' then 'mt' when 'nebraska' then 'ne' when 'nevada' then 'nv'
    when 'new hampshire' then 'nh' when 'new jersey' then 'nj' when 'new mexico' then 'nm' when 'new york' then 'ny'
    when 'north carolina' then 'nc' when 'north dakota' then 'nd' when 'ohio' then 'oh' when 'oklahoma' then 'ok'
    when 'oregon' then 'or' when 'pennsylvania' then 'pa' when 'rhode island' then 'ri' when 'south carolina' then 'sc'
    when 'south dakota' then 'sd' when 'tennessee' then 'tn' when 'texas' then 'tx' when 'utah' then 'ut'
    when 'vermont' then 'vt' when 'virginia' then 'va' when 'washington' then 'wa' when 'west virginia' then 'wv'
    when 'wisconsin' then 'wi' when 'wyoming' then 'wy' else replace(v_state, ' ', '') end;
  v_postal_code := substring(coalesce(p_postal_code, '') from '[[:digit:]]{5}');
  if v_postal_code is null then
    v_postal_code := lower(btrim(coalesce(p_postal_code, '')));
  end if;

  return array_to_string(v_tokens, ' ') || '|' || v_city || '|' || v_state || '|' || v_postal_code;
end;
$function$;
