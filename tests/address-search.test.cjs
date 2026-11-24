const test=require('node:test'),assert=require('node:assert/strict'),ts=require('typescript'),fs=require('node:fs'),vm=require('node:vm');
const c={exports:{},Set};vm.runInNewContext(ts.transpileModule(fs.readFileSync('utils/address-search.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,c);
const {addressVariations,searchAddressVariations}=c.exports;
const query='240 South Mahoney Drive, Telluride, Colorado 81435';
const candidate={mapbox_id:'mahoney',name:'240 Mahoney Drive',full_address:'240 Mahoney Drive, Telluride, Colorado 81435, United States',context:{region:{region_code:'CO'}}};
test('direction omission recovers a candidate without replacing originals',async()=>{
 const original={mapbox_id:'street',name:'Mahoney Drive',place_formatted:'Telluride, Colorado 81435'};const calls=[];
 const r=await searchAddressVariations(query,async q=>{calls.push(q);return q===query?[original]:[candidate,{...candidate,mapbox_id:'wrong',full_address:'240 Mahoney Drive, San Jose, California 95127'}]});
 assert.equal(calls.length,2);assert.equal(r.length,2);assert.equal(r[0].mapbox_id,'mahoney');assert.ok(r[0].fallbackQuery);assert.equal(r[1],original);
});
test('matching primary and POI searches do not retry',async()=>{
 for(const q of ['240 Mahoney Drive Telluride CO 81435','Owl Meadows']){let calls=0;await searchAddressVariations(q,async()=>{calls++;return[candidate]});assert.equal(calls,1)}
});
test('preserves number/locality/unit and never changes to opposite direction',()=>{
 const v=Array.from(addressVariations('120 N River Rd, Olathe CO 81425 Unit 2'));
 assert.equal(v.length,2);for(const q of v){assert.match(q,/^120 /);assert.ok(q.endsWith(', Olathe CO 81425 Unit 2'));assert.ok(!q.includes('south'))}
});
test('optional failures retain primary results; primary failure is reported',async()=>{
 let i=0;const original={mapbox_id:'a',name:'Town'};let r=await searchAddressVariations(query,async()=>{if(i++)throw Error('network');return[original]});assert.equal(r[0],original);
 await assert.rejects(searchAddressVariations(query,async()=>{throw Error('network')}));
});
test('cancellation stops retries and duplicates are suppressed',async()=>{
 let calls=0;await searchAddressVariations(query,async()=>{calls++;return[]},{aborted:true});assert.equal(calls,1);
 const r=await searchAddressVariations(query,async q=>q===query?[]:[candidate,candidate]);assert.equal(r.length,1);
});
test('wrong house number and opposite-direction results are not added',async()=>{
 const r=await searchAddressVariations(query,async q=>q===query?[]:[{...candidate,full_address:'242 Mahoney Drive, Telluride, Colorado 81435'},{...candidate,mapbox_id:'north',name:'240 North Mahoney Drive',full_address:'240 North Mahoney Drive, Telluride, Colorado 81435'}]);assert.equal(r.length,0);
});
test('partial abbreviated or spelled direction recovers before street type is typed',async()=>{
 for(const q of ['240 S Mahoney','240 South Mahoney','240 S. Mahoney']) {
  const calls=[];const r=await searchAddressVariations(q,async v=>{calls.push(v);return v===q?[{mapbox_id:'nebraska',name:'240 South Maloney Drive',full_address:'240 South Maloney Drive, North Platte, Nebraska 69101'}]:[candidate]});
  assert.equal(calls[1],'240 mahoney');assert.equal(r[0].mapbox_id,'mahoney');assert.ok(r[0].fallbackQuery);assert.equal(calls.length,2);
 }
});
test('partial fallback keeps explicit locality and rejects wrong number, prefix and direction',async()=>{
 const r=await searchAddressVariations('240 S Mahoney, Telluride CO 81435',async q=>q.startsWith('240 S ')?[]:[candidate,{...candidate,mapbox_id:'wrong-city',full_address:'240 Mahoney Drive, San Jose California 95127'},{...candidate,mapbox_id:'wrong-number',full_address:'2400 Mahoney Drive, Telluride CO 81435'},{...candidate,mapbox_id:'wrong-direction',full_address:'240 North Mahoney Drive, Telluride CO 81435'}]);
 assert.equal(r.length,1);assert.equal(r[0].mapbox_id,'mahoney');
 assert.equal(Array.from(addressVariations('240 S Ma'))[0],'240 south ma');
 assert.equal(addressVariations('240 South').length,0);
});

test('street autocomplete accepts unfinished final words without relaxing house number or direction',async()=>{
 for(const fragment of ['Mah','Maho','Mahon','Mahone','Mahoney']) {
  for(const direction of ['S','South']) {
   const query=`240 ${direction} ${fragment}`;
   const r=await searchAddressVariations(query,async q=>q===query?[]:[candidate,{...candidate,mapbox_id:'wrong-number',full_address:'2400 Mahoney Drive, Telluride CO 81435'},{...candidate,mapbox_id:'wrong-direction',full_address:'240 North Mahoney Drive, Telluride CO 81435'},{...candidate,mapbox_id:'wrong-street',full_address:'240 Maloney Drive, Telluride CO 81435'}]);
   assert.equal(r.length,1,query);assert.equal(r[0].mapbox_id,'mahoney',query);
  }
 }
});

test('a distant primary prefix match does not suppress the directional variation lookup',async()=>{
 const calls=[];const q='240 S Maho';
 const r=await searchAddressVariations(q,async v=>{calls.push(v);return v===q?[{mapbox_id:'distant',name:'240 South Mahogany Street',full_address:'240 South Mahogany Street, Somewhere'}]:[candidate]});
 assert.equal(calls.length,2);assert.equal(r[0].mapbox_id,'mahoney');
 assert.equal(c.exports.isLocalAddressPrefix(q),true);
 assert.equal(c.exports.isLocalAddressPrefix(q+', Telluride'),false);
 assert.equal(c.exports.isLocalAddressPrefix('240 Mahoney Drive Telluride'),false);
});
test('number plus compass direction searches immediately, expanding S without dropping it',async()=>{
 const calls=[];const nearby={mapbox_id:'south-ave',name:'240 South Avenue',full_address:'240 South Avenue, Grand Junction, Colorado 81501'};
 const r=await searchAddressVariations('240 S',async q=>{calls.push(q);return[nearby]});
 assert.equal(calls[0],'240 south');assert.equal(r[0].mapbox_id,'south-ave');
 assert.equal(c.exports.isLocalAddressPrefix('240 S'),true);
 assert.equal(c.exports.isLocalAddressPrefix('240 S, Telluride'),false);
 assert.ok(!Array.from(addressVariations('240 S')).some(q=>q.trim()==='240'));
});

test('house-number-only autocomplete starts with local address results',()=>{
 for(const q of ['240',' 240 ','120','1234','12A','120-122']){
  assert.equal(c.exports.isLocalAddressPrefix(q),true,q);
  assert.equal(c.exports.isStreetAddressQuery(q),true,q);
  assert.deepEqual(Array.from(addressVariations(q)),[],q);
 }
 assert.equal(c.exports.isLocalAddressPrefix('240 S Mahoney, Telluride'),false);
 assert.equal(c.exports.isStreetAddressQuery('Coffee'),false);
});

test('empty local house-number search retries with confirmed city without changing query',async()=>{
 const calls=[];const nearby={mapbox_id:'local',name:'2403 Riverside Parkway'};
 const results=await c.exports.searchNearbyAddressSuggestions('240',async(q,near)=>{calls.push({q,near});return near?[nearby]:[]},async()=> 'Grand Junction, CO, US');
 assert.equal(results[0],nearby);assert.equal(calls.length,2);
 assert.equal(calls[0].q,'240');assert.equal(calls[1].q,'240');
 assert.equal(calls[1].near,'Grand Junction, CO, US');
});
test('successful results and explicit town searches never trigger nearby-city fallback',async()=>{
 for(const q of ['240','240 S Mahoney, Telluride']){
  let resolved=0;const original=q==='240'?[candidate]:[];
  const results=await c.exports.searchNearbyAddressSuggestions(q,async()=>original,async()=>{resolved++;return 'Wrong town'});
  assert.equal(resolved,0);assert.equal(results.length,original.length);
 }
});
test('optional locality failure, absent locality and cancellation stay safe',async()=>{
 for(const resolve of [async()=>{throw Error('offline')},async()=>null]){
  const results=await c.exports.searchNearbyAddressSuggestions('240',async()=>[],resolve);
  assert.equal(results.length,0);
 }
 const signal={aborted:false};let calls=0;
 const results=await c.exports.searchNearbyAddressSuggestions('240',async()=>{calls++;return[]},async()=>{signal.aborted=true;return 'Grand Junction'},signal);
 assert.equal(calls,1);assert.equal(results.length,0);
});
test('more street letters remove unrelated nearby fuzzy matches before distance ranking',async()=>{
 const q='240 S Mahone';
 const results=await c.exports.searchNearbyAddressSuggestions(q,async value=>value===q?
  [{mapbox_id:'nearby-but-wrong',name:'240 South Avenue',full_address:'240 South Avenue, Grand Junction Colorado'}]:[candidate],async()=>null);
 assert.equal(results.length,1);assert.equal(results[0].mapbox_id,'mahoney');
});
