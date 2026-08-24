alter table public.routing_lab_zone_evidence
drop constraint routing_lab_zone_evidence_approved_zone_check;

alter table public.routing_lab_zone_evidence
add constraint routing_lab_zone_evidence_approved_zone_check check (
  approved_zone in (
    'Fruita', 'West', 'River Road', 'Airport', 'Downtown / The Hole', 'East',
    'Mountain Village', 'Downtown Telluride'
  )
);

alter table public.routing_lab_zone_evidence
drop constraint routing_lab_zone_evidence_valid_micro_zone;

alter table public.routing_lab_zone_evidence
add constraint routing_lab_zone_evidence_valid_micro_zone check (
  approved_micro_zone is null or
  (approved_zone = 'Fruita' and approved_micro_zone in ('Fruita A', 'Fruita B', 'Fruita C')) or
  (approved_zone = 'West' and approved_micro_zone in ('West A', 'West B', 'West C')) or
  (approved_zone = 'River Road' and approved_micro_zone in ('River Road A', 'River Road B')) or
  (approved_zone = 'Airport' and approved_micro_zone in ('Airport A', 'Airport B', 'Airport C')) or
  (approved_zone = 'Downtown / The Hole' and approved_micro_zone in ('Hole A', 'Hole B', 'Hole C', 'Hole D', 'Hole E')) or
  (approved_zone = 'East' and approved_micro_zone in ('East A', 'East B', 'East C')) or
  (approved_zone = 'Mountain Village' and approved_micro_zone in (
    'Ophir', 'Ski Ranch South', 'Ski Ranch North', 'Mountain Village West',
    'Benchmark', 'San Joaquin', 'Mountain Village East', 'Mountain Village North'
  )) or
  (approved_zone = 'Downtown Telluride' and approved_micro_zone in (
    'Zone 1 South', 'Zone 2 East', 'Zone 3 Central / North'
  ))
);
