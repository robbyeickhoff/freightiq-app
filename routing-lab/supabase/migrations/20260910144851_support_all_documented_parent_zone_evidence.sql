alter table public.routing_lab_zone_evidence
drop constraint routing_lab_zone_evidence_approved_zone_check;

alter table public.routing_lab_zone_evidence
add constraint routing_lab_zone_evidence_approved_zone_check check (
  approved_zone in (
    'Grand Junction',
    'Fruita', 'West', 'River Road', 'Airport', 'Downtown / The Hole', 'East',
    'Delta', 'Olathe', 'Montrose', 'Ridgway North', 'Ouray', 'Ridgway Proper', 'Log Hill',
    'Placerville / Sawpit', 'Wilson Mesa Ranch Zone', 'South Park', 'Lawson Hill / Society',
    'Mountain Village', 'Downtown Telluride', 'Airport / Aldasoro', 'Norwood',
    'Nucla / Naturita', 'Gateway'
  )
);
