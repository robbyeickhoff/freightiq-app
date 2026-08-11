# FreightIQ City & Driver Search V1 — Existing Stop Locality Mapping

> **Status: Exact mapping approved; scoped cleanup production-verified — 2026-08-11**
>
> This artifact proposes structured locality values for existing visible production stops. It does
> not authorize or perform a schema change, production write, backfill, provider request, build,
> deployment, distribution, or release.

## Purpose

Provide the exact stop-ID-specific input for the future reviewed locality backfill required by
[FreightIQ City & Driver Search V1](FreightIQCityDriverSearchV1BuildSpec.md).

## Snapshot Summary

- Original production snapshot: 237 visible stops
- Proposed from recognized standard address formats in the original snapshot: 173
- Proposed after individual review of nonstandard but explicit address text: 42
- Proposed through the completed Product Owner exception review: 8
- Approved deletion candidates removed in the 2026-08-11 production cleanup: 14
- Approved locality rows remaining from this snapshot: 223
- Approved post-snapshot locality rows: 4
- Total approved locality rows: 227
- Current post-cleanup production baseline: 227 visible stops
- New post-snapshot stops requiring separate locality review before backfill: 0
- Locality backfill rows written: 0

## Decision Meanings

- `proposed_standard_address`: the existing address clearly contains a city, state, and postal code.
- `proposed_reviewed_nonstandard`: punctuation or formatting is nonstandard, but the existing
  address still explicitly names the proposed city and state.
- `proposed_product_owner_review`: the Product Owner resolved the exception during focused review.
- `approved_deletion_candidate`: excluded from locality backfill and approved for a separate,
  separately controlled deletion operation; all 14 were deleted and production-verified on
  2026-08-11. The table retains their rows as historical review evidence only.
- `needs_review_nonstandard`: the saved address does not explicitly provide enough locality
  evidence; no locality is proposed.
- `needs_review_test`: the record appears to be test data or carries a placeholder address; no
  locality is proposed.
- `unresolved_missing_address`: no address exists; no locality is proposed.

Coordinates are included as review evidence only. They were not used to silently assign locality.
No Mapbox or other external provider result was stored or used in this mapping.

## Stop-by-Stop Mapping

| Stop ID | Stop name | Existing address | Proposed city | State | Country | Decision | Existing coordinates |
|---|---|---|---|---|---|---|---|
| 1773934926766 | 165 East 10th Avenue | Nucla, Colorado 81424, United States | Nucla | CO | US | proposed_reviewed_nonstandard | 38.262181, -108.544132 |
| 1784928254592 | 221 South Oak Street Restaurant | 221 South Oak Street, Telluride, Colorado 81435, United States | Telluride | CO | US | proposed_standard_address | 37.936510, -107.813542 |
| 1784928257340 | 221 South Oak Street Restaurant | 221 South Oak Street, Telluride, Colorado 81435, United States | Telluride | CO | US | proposed_standard_address | 37.936510, -107.813542 |
| 1774204874644 | 2545 Rimrock Avenue | Grand Junction, Colorado 81505, United States | Grand Junction | CO | US | proposed_reviewed_nonstandard | 39.076252, -108.581738 |
| 1781899631507 | 29 Mile Apartments | 2915 Orchard Avenue, Grand Junction, Colorado 81504, United States | Grand Junction | CO | US | proposed_standard_address | 39.083917, -108.512379 |
| 1785772130534 | 2H Mechanical | 757 Valley Court, Grand Junction, Colorado 81505, United States | Grand Junction | CO | US | proposed_standard_address | 39.114257, -108.651266 |
| 1773414472402 | 54 Crane Service | 28235 DD Rd Nucla, Co 81424 | Nucla | CO | US | proposed_reviewed_nonstandard | 38.247309, -108.549875 |
| 1784084363929 | 9157 County Road 58P | Telluride, Co 81430 | Telluride | CO | US | proposed_reviewed_nonstandard | 38.081556, -107.933598 |
| 1775851852228 | Abbey Carpet Warehouse | 760 Belford Avenue, Grand Junction, Colorado 81501, United States | Grand Junction | CO | US | proposed_standard_address | 39.076657, -108.559830 |
| 1785532604107 | ABC Supply Co. Inc. | 1110 Kimball Ave, Grand Junction, Colorado 81501, United States | Grand Junction | CO | US | proposed_standard_address | 39.057017, -108.553954 |
| 1775596233964 | Adaptive Manufacturing Solutions | G-4206 South Saginaw Street, Burton, Michigan | Burton | MI | US | proposed_reviewed_nonstandard | 42.969071, -83.671903 |
| 1775492501704 | Adrenaline Vans | 19107 South Townsend Avenue, Montrose, Colorado 81403, United States | Montrose | CO | US | proposed_standard_address | 38.405539, -107.843723 |
| 1785787436978 | Airgas | 693 Long Acre Dr, Grand Junction, Colorado 81505, United States | Grand Junction | CO | US | proposed_standard_address | 39.105865, -108.630275 |
| 1774543372108 | All Steel | 10603 6390 Rd Montrose Co | Montrose | CO | US | proposed_reviewed_nonstandard | 38.539023, -107.896567 |
| 1778182629465 | All-Terrain Motorsports Inc | 637 24 1/2 Rd, Grand Junction, Colorado 81505, United States | Grand Junction | CO | US | proposed_standard_address | 39.096806, -108.602810 |
| 1780956330806 | Alpine Lumber Company | 140 Society Dr, Telluride, Colorado 81435, United States | Telluride | CO | US | proposed_standard_address | 37.946323, -107.874505 |
| 1782503194453 | Alsco Uniforms | 702 S 9th St, Grand Junction, Colorado 81501, United States | Grand Junction | CO | US | proposed_standard_address | 39.060768, -108.556826 |
| 1778182439278 | American Sealants | 2483 Riverside Pkwy, Grand Junction, Colorado 81505, United States | Grand Junction | CO | US | proposed_standard_address | 39.082277, -108.592360 |
| 1773329958419 | Anode Sales Company | 124, North 22nd Court, Grand Junction, CO, 81501 | Grand Junction | CO | US | proposed_reviewed_nonstandard | 39.068687, -108.539345 |
| 1774990129559 | Aplin Masonry | 750 South Park Road, Telluride, Colorado 81435, United States | Telluride | CO | US | proposed_standard_address | 37.946998, -107.908962 |
| 1782503053308 | Arctic Cooling and Heating | 1003 Winters Avenue, Grand Junction, Colorado 81501, United States | Grand Junction | CO | US | proposed_standard_address | 39.057839, -108.555423 |
| 1780930788507 | Artisan Builders | 480 Palomino Trail, Ridgway, Colorado 81432, United States | Ridgway | CO | US | proposed_standard_address | 38.149427, -107.744734 |
| 1782502461164 | Bailey's Moving & Storage | 1257 Winters Ave, Grand Junction, Colorado 81501, United States | Grand Junction | CO | US | proposed_standard_address | 39.058194, -108.550719 |
| 1779329276049 | BBR Ranch | 1305 E Anderson Telluride, Co 81435 | Telluride | CO | US | proposed_reviewed_nonstandard | 37.954024, -108.023799 |
| 1774989641146 | BH Gas | 313 Adams Ranch Road, Mountain Village, Colorado 81435, United States | Mountain Village | CO | US | proposed_standard_address | 37.942325, -107.861415 |
| 1783522269737 | Big Billies Apartments | 330 Adams Ranch Rd, Mountain Village, Colorado 81435, United States | Mountain Village | CO | US | proposed_standard_address | 37.939553, -107.857399 |
| 1785622960362 | Billings Artwork (Grammy) | 609 Clinton Street, Ridgway, Colorado 81432, United States | Ridgway | CO | US | proposed_standard_address | 38.152610, -107.757804 |
| 1785949368969 | Billy Goat Hop Farm | 67181 Trout Rd, Montrose, Colorado 81403, United States | Montrose | CO | US | proposed_standard_address | 38.393362, -107.829913 |
| 1775072038386 | Blazer Electric | 555 25 Road, Grand Junction, Colorado 81505, United States | Grand Junction | CO | US | proposed_standard_address | 39.085010, -108.589820 |
| 1785531677605 | Boise Cascade Building Materials | 615 S 15th St, Grand Junction, Colorado 81501, United States | Grand Junction | CO | US | proposed_standard_address | 39.061146, -108.548228 |
| 1783368082214 | Bolinger & Queen | 718 348 Ln, Olathe, Colorado 81425, United States | Olathe | CO | US | proposed_standard_address | 38.604334, -107.995173 |
| 1785771525742 | Brach Trucking | 777 Valley Court, Grand Junction, Colorado 81505, United States | Grand Junction | CO | US | proposed_standard_address | 39.117312, -108.651091 |
| 1783367866074 | Build A Soil | 5146 N Townsend Ave, Montrose, Colorado 81401, United States | Montrose | CO | US | proposed_standard_address | 38.531148, -107.935301 |
| 1775491229880 | Bureau of Reclamation Oak Grove Warehouse | 1330 E Oak Grove Rd, Montrose, Co 81401 | Montrose | CO | US | proposed_standard_address | 38.459784, -107.869227 |
| 1774839755472 | C | — | — | — | — | approved_deletion_candidate | 37.414130, -122.057028 |
| 1781900024339 | Calfrac Well Services | 2996 Teller Ct, Grand Junction, Colorado 81504, United States | Grand Junction | CO | US | proposed_standard_address | 39.075737, -108.497928 |
| 1773253033533 | CAPCO (Viking Armament) | 1328 Winters Ave., Grand Junction, CO 81501 | Grand Junction | CO | US | proposed_standard_address | 39.059131, -108.550399 |
| 1781295533072 | Capital Business Systems | 826 N Crest Dr Unit C, Grand Junction, Colorado 81506, United States | Grand Junction | CO | US | proposed_standard_address | 39.123928, -108.536008 |
| 1781900137287 | Carpetime | 2920 I-70BL, Grand Junction, Colorado 81504, United States | Grand Junction | CO | US | proposed_standard_address | 39.074449, -108.511543 |
| 1781899902429 | Central Distributing Co | 3244 F 1/2 Rd, Clifton, Colorado 81520, United States | Clifton | CO | US | proposed_standard_address | 39.098392, -108.450289 |
| 1775677053930 | Christy Sports | 160 Front Street, Placerville, Colorado 81430, United States | Placerville | CO | US | proposed_standard_address | 38.016060, -108.052597 |
| 1784333974943 | Cirque Fabrication Guy | 601 South Avenue, Grand Junction, Colorado 81501, United States | Grand Junction | CO | US | proposed_standard_address | 39.063235, -108.562475 |
| 1784327038157 | City Electric Supply | 1005 Pitkin Ave, Grand Junction, Colorado 81501, United States | Grand Junction | CO | US | proposed_standard_address | 39.064118, -108.555662 |
| 1784749374295 | City of Montrose - Public Works | 1221 6450 Rd, Montrose, CO 81401 | Montrose | CO | US | proposed_standard_address | 38.490137, -107.884984 |
| 1783049347382 | Clark's Market | 1435 Grand Ave, Norwood, Colorado 81423, United States | Norwood | CO | US | proposed_standard_address | 38.131033, -108.291464 |
| 1786128700628 | CMU Warehouse | 1260 Kennedy Avenue, Grand Junction, Colorado 81501, United States | Grand Junction | CO | US | proposed_standard_address | 39.080373, -108.550872 |
| 1785785871357 | Co-op Country | 1650 Highway 6 And 50, Fruita, Colorado 81521, United States | Fruita | CO | US | proposed_standard_address | 39.163365, -108.746624 |
| 1785778228920 | Colorado Backcountry Biker | 150 S Park Square, Fruita, Colorado 81521, United States | Fruita | CO | US | proposed_standard_address | 39.158394, -108.733246 |
| 1774989832054 | Colorado Boy Pub & Brewery | 687 North Cora Street, Ridgway, Colorado 81432, United States | Ridgway | CO | US | proposed_standard_address | 38.158178, -107.757902 |
| 1783464334173 | Colorado Custom Firepits | 765 Vance Drive, Telluride, Colorado 81435, United States | Telluride | CO | US | proposed_standard_address | 37.946508, -107.911082 |
| 1785532339617 | Colorado National Guard | 2810 Riverside Parkway, Grand Junction, Colorado 81501, United States | Grand Junction | CO | US | proposed_standard_address | 39.066649, -108.530057 |
| 1786124574002 | Concert Design Innovations | 803 26 Road, Grand Junction, Colorado 81506, United States | Grand Junction | CO | US | proposed_standard_address | 39.121936, -108.571538 |
| 1772544860193 | Consolidated Electrical Distributors | 310, S 12th St., Grand Junction,  Colorado, 81501, United States | Grand Junction | CO | US | proposed_reviewed_nonstandard | 39.065063, -108.551989 |
| 1774301044173 | Cooling’s Heating & Air Conditioning | 942 N Park Ave. Montrose, Colorado 81401, United States | Montrose | CO | US | proposed_reviewed_nonstandard | 38.489252, -107.883237 |
| 1781899744461 | Core & Main | 3026 I-70BL, Grand Junction, Colorado 81504, United States | Grand Junction | CO | US | proposed_standard_address | 39.078622, -108.491864 |
| 1786139507339 | CPCneutek | 2800 Printers Way, Grand Junction, Colorado 81506, United States | Grand Junction | CO | US | proposed_standard_address | 39.119686, -108.533047 |
| 1783367483202 | Dahl Montrose Plumbing Supply and Kitchen/Bath Showroom | 1133 N Townsend Ave, Montrose, Colorado 81401, United States | Montrose | CO | US | proposed_standard_address | 38.487581, -107.888040 |
| 1781404986594 | Dallas Creek Water | 220 Ponderosa Dr. Ridgway CO 81432 United States | Ridgway | CO | US | proposed_reviewed_nonstandard | 38.186299, -107.796086 |
| 1775853151505 | Daltile | 2930 North Ave Ste 3, Grand Junction, Colorado 81504, United States | Grand Junction | CO | US | proposed_standard_address | 39.078058, -108.509554 |
| 1783536805598 | Davis Service Center | 2380 E Main St, Montrose, Colorado 81401, United States | Montrose | CO | US | proposed_standard_address | 38.488044, -107.849658 |
| 1783364068943 | Deeply Digital | 343 N 3rd St, Montrose, Colorado 81401, United States | Montrose | CO | US | proposed_standard_address | 38.481415, -107.880049 |
| 1781952348501 | Demonstrating the | — | — | — | — | approved_deletion_candidate | 39.857120, 116.429567 |
| 1775059808137 | Diaz Tile | 425 Kristen Ct Montrose Co | Montrose | CO | US | proposed_reviewed_nonstandard | 38.517982, -107.917827 |
| 1782833664527 | DIP CO | 1775 Gunnison Avenue, Delta, Colorado 81416, United States | Delta | CO | US | proposed_standard_address | 38.755050, -108.032930 |
| 1784684544688 | Dirty Hands Furniture | 22306 Colorado Highway 145, Placerville, Colorado 81430 | Placerville | CO | US | proposed_standard_address | 37.995873, -108.030757 |
| 1774989987455 | Double RL Ranch | 5180 Colorado Highway 62, Ridgway, Colorado 81432, United States | Ridgway | CO | US | proposed_standard_address | 38.131975, -107.824734 |
| 1781296103555 | DoubleTree by Hilton | 743 Horizon Dr, Grand Junction, Colorado 81506, United States | Grand Junction | CO | US | proposed_standard_address | 39.112544, -108.542039 |
| 1780408164160 | Dynamic Fire Protection Systems | 19235 US-550, Montrose, Colorado 81403, United States | Montrose | CO | US | proposed_standard_address | 38.403728, -107.844171 |
| 1782502778146 | Ed Bozarth Chevrolet and Buick | 2595 US-6, Grand Junction, Colorado 81501, United States | Grand Junction | CO | US | proposed_standard_address | 39.076444, -108.573817 |
| 1786062604316 | Electronics Pro | 890 Grape Street, Nucla, Colorado 81424, United States | Nucla | CO | US | proposed_standard_address | 38.262910, -108.547920 |
| 1773685281298 | Element 52 | Telluride, Colorado 81435, United States | Telluride | CO | US | proposed_reviewed_nonstandard | 37.936691, -107.817786 |
| 1783537587180 | English Brothers Polaris | 67809 US-50, Montrose, Colorado 81401, United States | Montrose | CO | US | proposed_standard_address | 38.489017, -107.823641 |
| 1773521673346 | F & H Mine Supply | 165 E Tenth Ave. Nucla, Co 81424 | Nucla | CO | US | proposed_reviewed_nonstandard | 38.262072, -108.544173 |
| 1774901736430 | Fairmont Heritage Place - Franz Klammer Lodge | 567 Mountain Village Blvd, Mountain Village, Colorado 81435, United States | Mountain Village | CO | US | proposed_standard_address | 37.937312, -107.846391 |
| 1782315466005 | Ferguson (GJ Pipe) | 2005 North Townsend Avenue, Montrose, Colorado 81401, United States | Montrose | CO | US | proposed_standard_address | 38.496800, -107.899100 |
| 1774633635355 | Ferguson Enterprises LLC | 924 Spring Creek  Rd Montrose Co | Montrose | CO | US | proposed_reviewed_nonstandard | 38.473766, -107.893463 |
| 1773251868597 | Ferguson Plumbing Supply | 620 S 12th Street Grand Junction, Co 81501 | Grand Junction | CO | US | proposed_reviewed_nonstandard | 39.061538, -108.551730 |
| 1774819215987 | FixT Repair and Automotive Diagnostics | 2024 16 Rd, Loma, Colorado 81524, United States | Loma | CO | US | proposed_standard_address | 39.295000, -108.767619 |
| 1775058935730 | Fleet pride | 4362 6225 Rd Montrose Co | Montrose | CO | US | proposed_reviewed_nonstandard | 38.524436, -107.925702 |
| 1785438840258 | Fleet Service and Norwood Auto | 85 Z 42.9 Rd, Norwood, Colorado 81423, United States | Norwood | CO | US | proposed_standard_address | 38.130040, -108.280695 |
| 1781899841115 | Flyin' Miata | 499 35 Rd, Palisade, Colorado 81526, United States | Palisade | CO | US | proposed_standard_address | 39.076720, -108.404157 |
| 1773681809487 | Four Seasons- Weitz Company | 688 Mountain Village Blvd | Mountain Village | CO | US | proposed_product_owner_review | 37.937783, -107.845070 |
| 1783367632113 | Galiso Incorporated | 22 Ponderosa Ct, Montrose, Colorado 81401, United States | Montrose | CO | US | proposed_standard_address | 38.493203, -107.883450 |
| 1773607728544 | Garden Center at The Home Depot | Grand Junction, Colorado 81505, United States | Grand Junction | CO | US | proposed_reviewed_nonstandard | 39.095084, -108.601136 |
| 1773934972930 | Gateway Canyons Resort and Spa | Gateway, Colorado 81522, United States | Gateway | CO | US | proposed_reviewed_nonstandard | 38.678852, -108.982976 |
| 1785598378689 | Get Air Trampoline Park test stop | 715 S 7th St, Grand Junction, Colorado 81501, United States | — | — | — | approved_deletion_candidate | 39.060770, -108.561630 |
| 1784775655777 | Gordon Composites | 2350 Air Park Way, Montrose, CO 81401 | Montrose | CO | US | proposed_standard_address | 38.499712, -107.905157 |
| 1786127285307 | Grand Junction Endoscopy | 1035 Wellington Avenue, Grand Junction, Colorado 81501, United States | Grand Junction | CO | US | proposed_standard_address | 39.089578, -108.555346 |
| 1778611569163 | Grand Junction Winair | 2764 Lang Dr, Grand Junction, Colorado 81501, United States | Grand Junction | CO | US | proposed_standard_address | 39.061130, -108.540449 |
| 1774631216816 | Grand Mesa Packaging | 3199 D Rd.. Unit C102 Grand Junction, Colorado 81504, United States | Grand Junction | CO | US | proposed_reviewed_nonstandard | 39.062320, -108.460250 |
| 1786124512596 | Grand View Apartments | 1501 N 1st St, Grand Junction, Colorado 81501, United States | Grand Junction | CO | US | proposed_standard_address | 39.081401, -108.571699 |
| 1783535023664 | GT Sanders | 116 Par Place, Montrose, Colorado 81401, United States | Montrose | CO | US | proposed_standard_address | 38.485724, -107.857542 |
| 1782838252320 | Hammerhead | 2263 Logos Court, Grand Junction, Colorado 81505, United States | Grand Junction | CO | US | proposed_standard_address | 39.110205, -108.633620 |
| 1781296492037 | Helmerich & Payne | 2360 G Rd, Grand Junction, Colorado 81505, United States | Grand Junction | CO | US | proposed_standard_address | 39.107209, -108.618636 |
| 1785531994174 | Hercules Industries Inc | 1453 4th Ave, Grand Junction, Colorado 81501, United States | Grand Junction | CO | US | proposed_standard_address | 39.060016, -108.548259 |
| 1785438270336 | Hook | 226 W Colorado Ave, Telluride, Colorado 81435, United States | Telluride | CO | US | proposed_standard_address | 37.937503, -107.812492 |
| 1774544934918 | Hope Springs Care Center | 1043 Ridge St Montrose Co | Montrose | CO | US | proposed_reviewed_nonstandard | 38.478223, -107.861448 |
| 1783863840195 | Horizon Maintenance | 680 South Park Road, Telluride, Colorado 81435, United States | Telluride | CO | US | proposed_standard_address | 37.947440, -107.912821 |
| 1779384841120 | Horsefly Creek Veterinary Services | 67516 T Road, Montrose, Colorado 81403, United States | Montrose | CO | US | proposed_standard_address | 38.381370, -107.826110 |
| 1786119867818 | HRL Compliance Solutions | 2385 F 1/2 Rd, Grand Junction, Colorado 81505, United States | Grand Junction | CO | US | proposed_standard_address | 39.098340, -108.610571 |
| 1781899520702 | Hydraulic Solutions | 510 Fruitvale Court, Unit B, Grand Junction, Colorado 81504, United States | Grand Junction | CO | US | proposed_standard_address | 39.080090, -108.489869 |
| 1782339193647 | I’m | — | — | — | — | approved_deletion_candidate | 39.935678, 116.318917 |
| 1784024805673 | Idarado Mining | 5393 E Hwy 145 Spur Telluride, Co 81435 | Telluride | CO | US | proposed_reviewed_nonstandard | 37.930914, -107.778072 |
| 1781694131439 | Isun Skincare | 630 North Cora Street, Ridgway, Colorado 81432, United States | Ridgway | CO | US | proposed_standard_address | 38.157339, -107.757162 |
| 1783688751103 | Jimmy John's Test | 3203 I 70 Business Loop, Clifton, Colorado 81520, United States | — | — | — | approved_deletion_candidate | 39.086699, -108.458575 |
| 1775595283279 | Johns Manville | 1110 16 Rd, Fruita, Colorado 81521, United States | Fruita | CO | US | proposed_standard_address | 39.162968, -108.755591 |
| 1782502976466 | Johnstone Supply | 567 S 15th St, Grand Junction, Colorado 81501, United States | Grand Junction | CO | US | proposed_standard_address | 39.062225, -108.549508 |
| 1781826276876 | Joseph Alvy | 1627 45m Road, Norwood, Colorado 81423, United States | Norwood | CO | US | proposed_standard_address | 37.979100, -108.245800 |
| 1783863507012 | K & K Concrete | 700 Vance Drive, Telluride, Colorado 81435, United States | Telluride | CO | US | proposed_standard_address | 37.946985, -107.912874 |
| 1782836495273 | Kässbohrer All Terrain Vehicles Inc. | 783 Valley Ct, Grand Junction, Colorado 81505, United States | Grand Junction | CO | US | proposed_standard_address | 39.118503, -108.650296 |
| 1775852043492 | Kitchen Tune Up, STE B1 | 2148 Broadway, Grand Junction, Colorado 81507, United States | Grand Junction | CO | US | proposed_standard_address | 39.087909, -108.651526 |
| 1785882886292 | Kuboske Construction | 67242 Sunshine Road, Montrose, Colorado 81401, United States | Montrose | CO | US | proposed_standard_address | 38.434060, -107.832000 |
| 1785438646986 | Kurt Works | 488 Avalon Drive, Norwood, Colorado 81423, United States | Norwood | CO | US | proposed_standard_address | 38.046525, -108.267655 |
| 1781295732286 | La Quinta Inn and Suites | 2761 Crossroads Blvd, Grand Junction, Colorado 81506, United States | Grand Junction | CO | US | proposed_standard_address | 39.114398, -108.540781 |
| 1786402444418 | La Piazza del Villaggio Ristorante | 117 Lost Creek Ln, Mountain Village, Colorado 81435, United States | Mountain Village | CO | US | proposed_standard_address | 37.935380, -107.846950 |
| 1773681345843 | Madeline Hotel & Residences | 568 Mountain Village Blvd. Telluride , Colorado 81435 | Telluride | CO | US | proposed_reviewed_nonstandard | 37.936695, -107.847588 |
| 1783350435568 | Mesa County Hazardous Waste Collection Facility | 3071 US-50, Whitewater, Colorado 81527, United States | Whitewater | CO | US | proposed_standard_address | 39.010360, -108.484697 |
| 1785531885870 | Mesa County School Warehouse | 121 North 22nd Court, Grand Junction, Colorado 81501, United States | Grand Junction | CO | US | proposed_standard_address | 39.068563, -108.540106 |
| 1773849515084 | Mesa County Sheriff’s Office | 215 Rice St | Grand Junction | CO | US | proposed_product_owner_review | 39.068737, -108.575140 |
| 1781296350541 | Mobility Driven | 832 N Crest Dr. Unit B | Grand Junction | CO | US | proposed_product_owner_review | 39.124573, -108.536089 |
| 1773759276205 | Montrose Daily Press | 420 Kristen CT. Montrose, CO 81401 | Montrose | CO | US | proposed_reviewed_nonstandard | 38.517219, -107.918282 |
| 1784748791277 | Montrose Memorial Hospital Heliport | 800 S 3rd St. Montrose, CO 81401 | Montrose | CO | US | proposed_reviewed_nonstandard | 38.480398, -107.868320 |
| 1785466935546 | Moores Mining LLC | 32906 CO-141, Gateway, Colorado 81522, United States | Gateway | CO | US | proposed_standard_address | 38.778442, -108.869355 |
| 1781638829465 | Mountain Lodge | 457 Mountain Village Boulevard, Mountain Village, Colorado 81435, United States | Mountain Village | CO | US | proposed_standard_address | 37.933223, -107.851480 |
| 1781638833163 | Mountain Lodge | 457 Mountain Village Boulevard, Mountain Village, Colorado 81435, United States | Mountain Village | CO | US | proposed_standard_address | 37.933223, -107.851480 |
| 1782331650789 | Mountain View Cabin | 587 Percheron Trail, Ridgway, Colorado 81432, United States | Ridgway | CO | US | proposed_standard_address | 38.154380, -107.743990 |
| 1784840560435 | Mueffelman Fine Finishes | 765 West Colorado Avenue, Telluride, Colorado 81435, United States | Telluride | CO | US | proposed_standard_address | 37.947205, -107.835780 |
| 1772907886671 | Munro Pump | 735 S Ninth St. | Grand Junction | CO | US | proposed_product_owner_review | 39.060793, -108.558064 |
| 1773259687093 | Munro Pump | 955 Third Ave. Grand Junction, Co 81501 | Grand Junction | CO | US | proposed_reviewed_nonstandard | 39.059839, -108.556335 |
| 1774211020349 | Murdoch's Ranch & Home Supply | Murdoch's Ranch & Home Supply, Clifton, Colorado 81520, United States | Clifton | CO | US | proposed_standard_address | 39.088526, -108.455313 |
| 1783027825573 | Nimbus Drive | Nimbus Drive, Telluride, Colorado 81435, United States | Telluride | CO | US | proposed_standard_address | 37.949402, -107.886856 |
| 1782836936184 | Northwest Machine Works Inc | 2318 Grand Park Dr, Grand Junction, Colorado 81505, United States | Grand Junction | CO | US | proposed_standard_address | 39.108381, -108.623316 |
| 1773414408782 | Nucla | Montrose County, Colorado, 81424, United States | — | — | — | approved_deletion_candidate | 38.269435, -108.547869 |
| 1773522663775 | Nucla Co Op | — | — | — | — | approved_deletion_candidate | 38.261871, -108.545520 |
| 1776382362078 | Nucla Naturita Telephone Warehouse | 29474 2900 Rd. Nucla, Co 81424 | Nucla | CO | US | proposed_reviewed_nonstandard | 38.254985, -108.536713 |
| 1782427897636 | Nucla School | 225 West 4th Avenue, Nucla, Colorado 81424, United States | Nucla | CO | US | proposed_standard_address | 38.270894, -108.549084 |
| 1782427922121 | Nucla School | 225 West 4th Avenue, Nucla, Colorado 81424, United States | Nucla | CO | US | proposed_standard_address | 38.270894, -108.549084 |
| 1786062741019 | Nucla-Naturita Telephone Co | 421 Main Street, Nucla, Colorado 81424, United States | Nucla | CO | US | proposed_standard_address | 38.269920, -108.545430 |
| 1781638992360 | Oldmixon New Build Site | 1 Raspberry Patch Rd, Telluride, Colorado 81435, United States | Telluride | CO | US | proposed_standard_address | 37.905210, -107.888660 |
| 1784326896432 | Orkin | 715 4th Ave, Grand Junction, Colorado 81501, United States | Grand Junction | CO | US | proposed_standard_address | 39.059151, -108.560433 |
| 1774901582319 | Ouray Brewery | 607 Main Street, Ouray, Colorado 81427, United States | Ouray | CO | US | proposed_standard_address | 38.022939, -107.671235 |
| 1774285493021 | Ouray Childcare | 2202 Namichi Way Ouray, Co 81427 | Ouray | CO | US | proposed_reviewed_nonstandard | 38.037587, -107.679915 |
| 1774295146752 | Ouray Hot Springs Pool | Ouray Hot Springs Pool, Ouray, Colorado 81427, United States | Ouray | CO | US | proposed_standard_address | 38.029033, -107.672383 |
| 1774901470357 | Ouray KOA | 225 Co Rd 23, Ridgway, Colorado 81432, United States | Ridgway | CO | US | proposed_standard_address | 38.080941, -107.705434 |
| 1786402684939 | Ouray County Road & Bridge | 115 Mall Road, Ridgway, Colorado 81432, United States | Ridgway | CO | US | proposed_standard_address | 38.157940, -107.751290 |
| 1781726905939 | Parcel & Print | 125 West Pacific Avenue, Telluride, Colorado 81435, United States | Telluride | CO | US | proposed_standard_address | 37.936595, -107.811267 |
| 1783367529732 | Parish Oil Company | 1910 N Townsend Ave, Montrose, Colorado 81401, United States | Montrose | CO | US | proposed_standard_address | 38.496924, -107.896741 |
| 1784025143335 | Pinnacle Electric | 162 Society Dr Unit B, Telluride, Colorado 81435, United States | Telluride | CO | US | proposed_standard_address | 37.946590, -107.876767 |
| 1781899308879 | Pioneer Materials West | 3156 Perkins Dr, Grand Junction, Colorado 81504, United States | Grand Junction | CO | US | proposed_standard_address | 39.081750, -108.467362 |
| 1782961381468 | Post Office Vehicle Maintenance | 308 Grand Avenue, Grand Junction, Colorado 81501, United States | Grand Junction | CO | US | proposed_standard_address | 39.070332, -108.567702 |
| 1778182525587 | Power Equipment Company | 2329 River Road, Grand Junction, Colorado 81505, United States | Grand Junction | CO | US | proposed_standard_address | 39.096589, -108.620844 |
| 1775666246048 | Prairie Dog Pet Products | 320 Industrial Ave., Olathe | Olathe | CO | US | proposed_product_owner_review | 38.611616, -107.976117 |
| 1783534148520 | Prairie Dog Pet Products | 1850 Launa Drive, Montrose, Colorado 81401, United States | Montrose | CO | US | proposed_standard_address | 38.494360, -107.897430 |
| 1778264904674 | Precision Service Equipment | 1558 River Road, Fruita, Colorado 81521, United States | Fruita | CO | US | proposed_standard_address | 39.166430, -108.762635 |
| 1785773788017 | Precision Wildlife Taxidermy | 1388 21 Rd, Grand Junction, Colorado 81505, United States | Grand Junction | CO | US | proposed_standard_address | 39.206527, -108.659564 |
| 1783368010421 | Producers Co Op | 430 South 5th Street, Olathe, Colorado 81425, United States | Olathe | CO | US | proposed_standard_address | 38.604940, -107.981570 |
| 1782840748092 | Purvis Industries | 2308 Interstate Ave, Grand Junction, Colorado 81505, United States | Grand Junction | CO | US | proposed_standard_address | 39.112928, -108.624937 |
| 1773253321067 | QED | 1440 Winters Ave. Grand Junction, Co 81501 | Grand Junction | CO | US | proposed_reviewed_nonstandard | 39.058540, -108.548453 |
| 1785786050088 | RDI | 1115 16 Rd, Fruita, Colorado 81521, United States | Fruita | CO | US | proposed_standard_address | 39.166699, -108.757886 |
| 1786121085951 | Red Rock GMC Service Center | 741 N 1st St B, Grand Junction, Colorado 81501, United States | Grand Junction | CO | US | proposed_standard_address | 39.074345, -108.572411 |
| 1780071129476 | Red Rock Hyundai | 2162 Highway 6 and 50, Grand Junction, Colorado 81505, United States | Grand Junction | CO | US | proposed_standard_address | 39.115087, -108.652233 |
| 1782507143591 | Refrigeration Hardware Supply Corporation | 632 E Foresight Cir, Grand Junction, Colorado 81505, United States | Grand Junction | CO | US | proposed_standard_address | 39.096533, -108.585496 |
| 1782856765077 | Rent A Center | 2401 North Avenue, Grand Junction, Colorado 81501, United States | Grand Junction | CO | US | proposed_standard_address | 39.076056, -108.536633 |
| 1781049188421 | Rick Sutherland | 29295 Dd31 Trail, Nucla, Colorado 81424, United States | Nucla | CO | US | proposed_standard_address | 38.229660, -108.534230 |
| 1773677389553 | Ridgway Adventure Sports | Ridgway, Colorado 81432, United States | Ridgway | CO | US | proposed_reviewed_nonstandard | 38.151534, -107.756384 |
| 1782152497688 | Ridgway Animal Hospital | 635 N Cora St, Ridgway, Colorado 81432, United States | Ridgway | CO | US | proposed_standard_address | 38.157312, -107.757913 |
| 1781196195442 | Ridgway Elementary School | 1115 Clinton St, Ridgway, Colorado 81432, United States | Ridgway | CO | US | proposed_standard_address | 38.153291, -107.764417 |
| 1778685613811 | Ridgway State Park | 28555 US Route 550, Ridgway, Colorado 81432, United States | Ridgway | CO | US | proposed_standard_address | 38.212361, -107.733972 |
| 1774471990079 | Rimrock Pools and Spas | 2586 HWY 6 & 50 Grand Junction, Colorado 81501, United States | Grand Junction | CO | US | proposed_reviewed_nonstandard | 39.078285, -108.573987 |
| 1776096905973 | Rocky Mountain Aggregate | 67246 T Road, Montrose, Colorado 81403, United States | Montrose | CO | US | proposed_standard_address | 38.379160, -107.834850 |
| 1785424161417 | Rocky Mountain Rebar | 686 Industrial Boulevard, Delta, Colorado 81416, United States | Delta | CO | US | proposed_standard_address | 38.753610, -108.033520 |
| 1784749744236 | Root Fire Fertilizer | 15921 B Road, Delta, Colorado 81416, United States | Delta | CO | US | proposed_standard_address | 38.679230, -108.060932 |
| 1774892559552 | Ross Reels | 1101 Mayfly Dr. Montrose Co | Montrose | CO | US | proposed_reviewed_nonstandard | 38.484673, -107.892732 |
| 1774626755555 | Sample solutions | 540 Hwy 50 business loop Olathe Co | Olathe | CO | US | proposed_reviewed_nonstandard | 38.614280, -107.981636 |
| 1783538016921 | San Juan Fabrication and Powder Coating | 2171 E Main St, Montrose, Colorado 81401, United States | Montrose | CO | US | proposed_standard_address | 38.488732, -107.853957 |
| 1784749010526 | San Juan Metals | 311 North 4th Street, Montrose, CO 81401 | Montrose | CO | US | proposed_standard_address | 38.482600, -107.880780 |
| 1773768981662 | San Juan Sound & Vision | 305 Society Dr Unit A2 | Telluride | CO | US | proposed_product_owner_review | 37.946599, -107.881446 |
| 1773523663615 | San Miguel Power | — | — | — | — | approved_deletion_candidate | 38.261005, -108.547405 |
| 1785017220274 | Saturday Test | Test 1 | Grand Junction | CO | US | proposed_product_owner_review | 39.073390, -108.481060 |
| 1784024425863 | Sav A Tree (Aspen Tree Services) | 101 Campbell Lane, Ridgway, Colorado 81432, United States | Ridgway | CO | US | proposed_standard_address | 38.151186, -107.753115 |
| 1783367712201 | Shavano Architectural Millwork | 4656 N Townsend Ave, Montrose, Colorado 81401, United States | Montrose | CO | US | proposed_standard_address | 38.525941, -107.929231 |
| 1786402394984 | Sheridan Opera House | 110 N Oak St, Telluride, Colorado 81435, United States | Telluride | CO | US | proposed_standard_address | 37.937962, -107.812492 |
| 1780237552233 | Smith's Marketplace | 845 E Lake Mead Pkwy, Henderson, Nevada 89015, United States | — | — | — | approved_deletion_candidate | 36.053219, -114.972197 |
| 1784928529332 | Smugglers Brew Pub | 225 S Pine St, Telluride, Colorado 81435, United States | Telluride | CO | US | proposed_standard_address | 37.935730, -107.811765 |
| 1774472098207 | Spares In Motion | 372 27 1/2 Rd Grand Junction, Colorado 81501, United States | Grand Junction | CO | US | proposed_reviewed_nonstandard | 39.058999, -108.542592 |
| 1785777205852 | Spartan Drill Tools | 1882 HWY 6 & 50 Fruita, Colorado 81521, United States | Fruita | CO | US | proposed_reviewed_nonstandard | 39.141121, -108.704720 |
| 1782502701222 | Spendrup Fan Co | 2768 C 1/2 Rd, Grand Junction, Colorado 81501, United States | Grand Junction | CO | US | proposed_standard_address | 39.058578, -108.539228 |
| 1773245804570 | SSD Plastics | 360 Bonny St. Grand Junction, Co 81501 | Grand Junction | CO | US | proposed_reviewed_nonstandard | 39.057760, -108.543939 |
| 1775772599374 | St. Mary's Hospital and Regional Medical Center | 2635 N 7th St, Grand Junction, Colorado 81501, United States | Grand Junction | CO | US | proposed_standard_address | 39.089694, -108.562910 |
| 1783368230674 | Stone Ridge Roofing & Siding | 7898 5550 Road, Olathe, Colorado 81425, United States | Olathe | CO | US | proposed_standard_address | 38.578646, -108.049050 |
| 1779814087926 | Stout Coneyors | 19382 South Townsend Avenue, Montrose, Colorado 81403, United States | Montrose | CO | US | proposed_standard_address | 38.401780, -107.838790 |
| 1784927576107 | Stronghouse Brew Pub | 283 S Fir St, Telluride, Colorado 81435, United States | Telluride | CO | US | proposed_standard_address | 37.935928, -107.812501 |
| 1773259424778 | Stuart Steel | 685 W Gunnison Ave. Grand Junction, Co 81501 | Grand Junction | CO | US | proposed_reviewed_nonstandard | 39.072265, -108.578002 |
| 1785945563782 | Sunshine Peak Apartment Homes | 748 Cedar Creek Ave, Montrose, Colorado 81401, United States | Montrose | CO | US | proposed_standard_address | 38.490216, -107.875324 |
| 1780531032917 | Superior Fire Protection | 65790 Racine Rd, Montrose, Colorado 81403, United States | Montrose | CO | US | proposed_standard_address | 38.421300, -107.857879 |
| 1783367334595 | SynSysCo | 120 N Selig Ave, Montrose, Colorado 81401, United States | Montrose | CO | US | proposed_standard_address | 38.478963, -107.879613 |
| 1785946570630 | TEI Rock Drills | 210 Apollo Rd, Montrose, Colorado 81401, United States | Montrose | CO | US | proposed_standard_address | 38.466170, -107.877730 |
| 1775676640342 | Telluride City Water Department | 12000 Colorado Highway 145, Telluride, Colorado 81435, United States | Telluride | CO | US | proposed_standard_address | 37.949200, -107.874047 |
| 1781638122044 | Telluride Deliveries | 461 Ponderosa Drive, Ridgway, Colorado 81432, United States | Ridgway | CO | US | proposed_standard_address | 38.187420, -107.794360 |
| 1783464103612 | Telluride Land Works | 92 Boulders Way, Mountain Village, CO 81435 | Mountain Village | CO | US | proposed_standard_address | 37.942730, -107.861430 |
| 1784927308615 | Telluride School Maintenance | 747 West Galena Avenue, Telluride, Colorado 81435, United States | Telluride | CO | US | proposed_standard_address | 37.941110, -107.818235 |
| 1773522765882 | Telluride Ski & Golf Warehouse | 110 Prospect Creek | Mountain Village | CO | US | proposed_product_owner_review | 37.925385, -107.844725 |
| 1774547695916 | Telluride Storage | 650 S Park Dr. Telluride, Co 81435 | Telluride | CO | US | proposed_reviewed_nonstandard | 37.946199, -107.913703 |
| 1781035187489 | Telluride Tire and Auto Service | 120 Society Dr, Telluride, Colorado 81435, United States | Telluride | CO | US | proposed_standard_address | 37.947532, -107.873277 |
| 1785532174060 | TelTech Communications | 2135 I-70BL, Grand Junction, Colorado 81501, United States | Grand Junction | CO | US | proposed_standard_address | 39.067402, -108.538676 |
| 1785026232258 | Test Florida | Test 2 | — | — | — | approved_deletion_candidate | 30.285815, -86.016480 |
| 1785535582229 | Test Stop Prestige Nails & Spa | 879 Struthers Ave B, Grand Junction, Colorado 81501, United States | — | — | — | approved_deletion_candidate | 39.055527, -108.558239 |
| 1786308792426 | Test Sunday Delete Account | Test 1 | — | — | — | approved_deletion_candidate | 39.070214, -108.486921 |
| 1779648434111 | The | — | — | — | — | approved_deletion_candidate | 39.891934, 116.382325 |
| 1773607064220 | The Home Depot | Brand | — | — | — | approved_deletion_candidate | 34.885518, -117.059826 |
| 1774364604011 | The Peaks Resort and Spa | 136 Country Club Dr. Mountain Village, Colorado 81435, United States | Mountain Village | CO | US | proposed_reviewed_nonstandard | 37.938960, -107.847848 |
| 1780956135701 | The River Club | 550 W Depot Ave, Telluride, Colorado 81435, United States | Telluride | CO | US | proposed_standard_address | 37.937260, -107.817245 |
| 1783644125509 | The Village Market | 455 Mountain Village Blvd B, Mountain Village, Colorado 81435, United States | Mountain Village | CO | US | proposed_standard_address | 37.932430, -107.854158 |
| 1775072167473 | Thermo Fluids | 725 South 5th Street, Grand Junction, Colorado 81501, United States | Grand Junction | CO | US | proposed_standard_address | 39.060920, -108.564870 |
| 1782933510648 | Timberline Ace Hardware | 200 East Colorado Avenue, Telluride, Colorado 81435, United States | Telluride | CO | US | proposed_standard_address | 37.936678, -107.809700 |
| 1781295975881 | Tolin Mechanical | 810 North Crest Drive Unit 4, Grand Junction, Colorado 81506, United States | Grand Junction | CO | US | proposed_standard_address | 39.121638, -108.536208 |
| 1783539407151 | Tom's Electric Motor and Pump Service | 1128 N Townsend Ave, Montrose, Colorado 81401, United States | Montrose | CO | US | proposed_standard_address | 38.488154, -107.887131 |
| 1781638582897 | Town of Mtn Village Maintenance Shop | 317 Adams Ranch Road, Mountain Village, Colorado 81435, United States | Mountain Village | CO | US | proposed_standard_address | 37.943000, -107.860560 |
| 1781035010183 | Town of Telluride Shop | 1370 West Black Bear Road, Telluride, Colorado 81435, United States | Telluride | CO | US | proposed_standard_address | 37.938528, -107.825439 |
| 1781296631870 | Transwest Truck Trailer RV | 2236 Sanford Dr, Grand Junction, Colorado 81505, United States | Grand Junction | CO | US | proposed_standard_address | 39.112612, -108.638898 |
| 1775490519307 | Tri-State Generation and Transmission Association | 2200 S Rio Grande Ave, Montrose, Colorado 81401, United States | Montrose | CO | US | proposed_standard_address | 38.462991, -107.871754 |
| 1784025380300 | Tribe Interior Design | 135 West Colorado Avenue, Telluride, Colorado 81435, United States | Telluride | CO | US | proposed_standard_address | 37.937604, -107.811491 |
| 1784215076329 | Tuxedo Corn Company Shipping Warehouse | 59751 David Rd, Olathe, Colorado 81425, United States | Olathe | CO | US | proposed_standard_address | 38.607819, -107.972686 |
| 1781547234019 | Two Skirts | 127 W Colorado Ave, Telluride, Colorado 81435, United States | Telluride | CO | US | proposed_standard_address | 37.937397, -107.811388 |
| 1784749165517 | U Joint Off Road | 124 Apollo Road, Montrose, CO 81401 | Montrose | CO | US | proposed_standard_address | 38.467261, -107.876816 |
| 1785532478190 | Union Pacific Depot | 2790 Riverside Pkwy, Grand Junction, Colorado 81501, United States | Grand Junction | CO | US | proposed_standard_address | 39.065175, -108.537733 |
| 1778860941658 | USA Finishing | 711 South 6th Street, Grand Junction, Colorado 81501, United States | Grand Junction | CO | US | proposed_standard_address | 39.061694, -108.563060 |
| 1778611148271 | Venture Motorsports | 730 Scarlet Street, Grand Junction, Colorado 81505, United States | Grand Junction | CO | US | proposed_standard_address | 39.110412, -108.637565 |
| 1778529744173 | Village Court Apartments | 415 Mountain Village Boulevard, Mountain Village, Colorado 81435, United States | Mountain Village | CO | US | proposed_standard_address | 37.934671, -107.854808 |
| 1785791345613 | West Coast Wheel Accessories | 565 S Commercial Dr, Grand Junction, Colorado 81505, United States | Grand Junction | CO | US | proposed_standard_address | 39.086206, -108.585584 |
| 1773259342401 | West Gunnison Avenue | Grand Junction, Mesa County, Colorado, 81501, United States | Grand Junction | CO | US | proposed_reviewed_nonstandard | 39.072756, -108.578502 |
| 1782313825446 | Western Implement Co | 4520 N Townsend Ave, Montrose, Colorado 81401, United States | Montrose | CO | US | proposed_standard_address | 38.524591, -107.927971 |
| 1775583327848 | Western Skyway | 21 Creative Place, Montrose, Colorado 81401, United States | Montrose | CO | US | proposed_standard_address | 38.510260, -107.896620 |
| 1774628684781 | Western Workmen | 3220 Springfield Rd. Grand Junction, Colorado 81503, United States | Grand Junction | CO | US | proposed_reviewed_nonstandard | 39.030791, -108.455265 |
| 1775851672633 | Wets Dreams River Supply | 739 3rd Avenue, Grand Junction, Colorado 81501, United States | Grand Junction | CO | US | proposed_standard_address | 39.060030, -108.559770 |
| 1774472216023 | Whitewater Building Materials | 940 S 10th St.. Grand Junction, Colorado 81501, United States | Grand Junction | CO | US | proposed_reviewed_nonstandard | 39.058696, -108.555647 |
| 1784928759184 | Wilkinson Public Library | 100 W Pacific Ave, Telluride, Colorado 81435, United States | Telluride | CO | US | proposed_standard_address | 37.936235, -107.811459 |
| 1779465182698 | Woodstove Warehouse | 946 S 7th St, Grand Junction, Colorado 81501, United States | Grand Junction | CO | US | proposed_standard_address | 39.058566, -108.560851 |
| 1781233735706 | WUS Nucla Housing | 27587 Ee28 Road, Naturita, Colorado 81422, United States | Naturita | CO | US | proposed_standard_address | 38.221320, -108.560890 |
| 1785284839716 | WWE LLC Weber Ranch | 436 County Road 3a, Ridgway, Colorado 81432, United States | Ridgway | CO | US | proposed_standard_address | 38.119540, -107.731250 |
| 1786402492223 | Zinque Design | 373 E Colorado Ave, Telluride, Colorado 81435, United States | Telluride | CO | US | proposed_standard_address | 37.936555, -107.808085 |

## Approval Boundary

The original 21 exception rows and their completed Product Owner decisions are recorded in
[FreightIQ City & Driver Search V1 — Locality Exception Review](FreightIQCityDriverSearchV1LocalityExceptionReview.md).

The Product Owner subsequently approved the grouped mapping, retained the Burton, Michigan stop,
and marked the Henderson, Nevada stop as an additional deletion candidate. After the cleanup, the
Product Owner reviewed and approved the four post-snapshot stops. The final mapping contains 227
approved locality rows and retains the 14 deleted candidates as historical review evidence.

Before any production backfill:

1. Review every proposed row and every held row.
2. Resolve only held rows supported by reliable evidence; guessing is prohibited.
3. Present the final approved and unresolved counts.
4. Generate a stop-ID-specific database change from the approved rows.
5. Obtain separate operational approval after the Phase 2 schema is locally verified and applied
   through the documented migration workflow.
