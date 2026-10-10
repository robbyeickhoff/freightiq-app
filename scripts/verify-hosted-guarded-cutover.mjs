// Approved main-project post-cutover verification. No shared content/config writes.
// Creates and removes one confirmed example.invalid login; no email is sent.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
assert.deepEqual(process.argv.slice(2),['--approved-hosted','finjqunyuyfxiesumuxk']);
assert.equal(realpathSync('.'),'/Users/robbyeickhoff/mfi');
const ref='finjqunyuyfxiesumuxk',url='https://'+ref+'.supabase.co';
const keys=JSON.parse(execFileSync('npx',['supabase','projects','api-keys','--project-ref',ref,'-o','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
const anon=keys.find(k=>k.name==='anon')?.api_key,serviceKey=keys.find(k=>k.name==='service_role')?.api_key;
assert.ok(anon&&serviceKey);
const options={auth:{persistSession:false,autoRefreshToken:false}};
const service=createClient(url,serviceKey,options),client=createClient(url,anon,options);
const definitions=JSON.parse(readFileSync('scripts/fixtures/hosted-cutover-20261006-acl-before.json','utf8')).functions;
let userId,token,passed=0;
async function probe(bearer,path,body,expected){
 const response=await fetch(url+'/rest/v1/'+path,{method:body===undefined?'GET':'POST',
 headers:{apikey:anon,Authorization:'Bearer '+bearer,'Content-Type':'application/json'},
 body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(15000),redirect:'error'});
 const data=await response.json();
 assert.ok(expected.includes(response.status),path+': unexpected status '+response.status+' code '+data?.code);
 if(expected.includes(403))assert.equal(data.code,'42501',path);
 if(response.status===429)assert.equal(data.data,null,path);
 if(response.status===200)assert.ok(data?.code==null,path+': guarded refusal');
 passed++; return {status:response.status,data};
}
async function guarded(operation,args){return (await probe(token,'rpc/read_freightiq_guarded_v1',{p_operation:operation,p_args:args},[200])).data.data;}
try{
 const email='cutover-verification-'+randomUUID()+'@example.invalid',password=randomUUID()+'aA!';
 const created=await service.auth.admin.createUser({email,password,email_confirm:true});
 assert.equal(created.error,null,'Disposable auth creation failed');userId=created.data.user.id;
 console.log('Disposable auth account created: '+userId);
 const login=await client.auth.signInWithPassword({email,password});assert.equal(login.error,null,'Login failed');token=login.data.session.access_token;
 for(const bearer of [anon,token]){
  for(const table of ['mfi_stops','mfi_reports','mfi_report_votes','operations_updates','operations_update_confirmations'])
   await probe(bearer,table+'?select=id&limit=1',undefined,[401,403]);
  await probe(bearer,'mfi_stops?select=id,mfi_reports(id)&limit=1',undefined,[401,403]);
  for(const fn of definitions)await probe(bearer,'rpc/'+fn.name,Object.fromEntries(fn.args.map(a=>[a,null])),[401,403]);
 }
 console.log('PASS: 56 anonymous/authenticated legacy HTTP probes denied, including embedded reports.');
 const selected=await service.from('mfi_stops').select('id,user_id,city,state_code,country_code,lat,lng,name').order('id').limit(200);
 assert.equal(selected.error,null,'Service role read failed');assert.equal(selected.data.length,200);
 const first=selected.data[0],ids=selected.data.map(s=>s.id);
 const detail=await guarded('stop_detail',{p_stop_id:first.id});assert.equal(detail[0]?.id,first.id);
 const samples=[
 ['route_stops',{p_stop_ids:[first.id]}],['stop_summaries',{p_stop_ids:[first.id]}],
 ['stop_reports',{p_stop_id:first.id,p_result_limit:1}],['stop_stats',{p_stop_ids:[first.id]}],
 ['report_reputation',{p_user_ids:[first.user_id].filter(Boolean)}],
 ['search_stops',{p_search_text:first.name,p_center_lat:first.lat,p_center_lng:first.lng,p_radius_meters:10000,p_result_limit:1}],
 ['match_nearby',{p_name:first.name,p_address:null,p_lat:first.lat,p_lng:first.lng,p_radius_meters:200}],
 ['search_cities',{p_search_text:'Grand',p_result_limit:1}],['search_drivers',{p_search_text:'Rob',p_result_limit:1}],
 ['map_bounds',{p_south_lat:first.lat-.001,p_north_lat:first.lat+.001,p_west_lng:first.lng-.001,p_east_lng:first.lng+.001,p_result_limit:1}],
 ['city_collection',{p_city:first.city||'Grand Junction',p_state_code:first.state_code||'CO',p_country_code:first.country_code||'US',p_result_limit:1,p_result_offset:0}],
 ['city_page',{p_city:first.city||'Grand Junction',p_state_code:first.state_code||'CO',p_country_code:first.country_code||'US',p_result_limit:1,p_cursor:null}],
 ['driver_collection',{p_contributor_id:first.user_id||userId,p_result_limit:1,p_result_offset:0}],
 ['driver_page',{p_contributor_id:first.user_id||userId,p_result_limit:1,p_cursor:null}]
 ];
 for(const [operation,args] of samples)await guarded(operation,args);
 await probe(token,'rpc/read_operations_guarded_v1',{p_area_slug:'grand-junction',p_limit:1,p_cursor:null},[200]);
 await probe(anon,'rpc/read_freightiq_guarded_v1',{p_operation:'stop_detail',p_args:{p_stop_id:first.id}},[401,403]);
 await probe(anon,'rpc/read_operations_guarded_v1',{p_area_slug:null,p_limit:1,p_cursor:null},[401,403]);
 console.log('PASS: all 15 protected stop operation types and Operations respond; anonymous protected reads denied.');
 let refused=false,allowedBatches=0;
 for(let offset=0;offset<200;offset+=50){
  const r=await probe(token,'rpc/read_freightiq_guarded_v1',{p_operation:'route_stops',p_args:{p_stop_ids:ids.slice(offset,offset+50)}},[200,429]);
  if(r.status===429){assert.equal(r.data.code,'FREIGHTIQ_READ_THROTTLED');refused=true;break;}
  allowedBatches++;
 }
 assert.ok(refused,'Expected 200-record bulk probe to reach existing detail budget');
 const repeated=await guarded('stop_detail',{p_stop_id:first.id});assert.equal(repeated[0]?.id,first.id);
 console.log('PASS: existing policy refused bulk collection with HTTP429 and no data; previously read detail remained usable. Allowed 50-row batches: '+allowedBatches);
 console.log('Total HTTP probes passed: '+passed);
}finally{
 if(token){const r=await client.auth.signOut({scope:'global'});assert.equal(r.error,null,'Disposable sign-out failed');}
 if(userId){
  const r=await service.auth.admin.deleteUser(userId);assert.equal(r.error,null,'Disposable account deletion failed');
  const check=await service.auth.admin.getUserById(userId);assert.ok(check.error&&check.data.user===null,'Disposable account remains');
  console.log('PASS: disposable session signed out and account deletion verified. No shared content or policy changed.');
 }
}
