// Local-only final shared-read closure rehearsal, with captured rollback before mutations.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, realpathSync, existsSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
const args=process.argv.slice(2);
assert.equal(args.length,3);assert.equal(args[0],'--local');assert.equal(args[1],'--evidence-dir');
assert.equal(realpathSync('.'),'/Users/robbyeickhoff/mfi');
assert.ok(isAbsolute(args[2])&&existsSync(args[2]));
const context=JSON.parse(execFileSync('docker',['context','inspect','desktop-linux'],{encoding:'utf8'}));
assert.ok(context[0].Endpoints.docker.Host.startsWith('unix://'));
function sql(input){
 try{return execFileSync('docker',['--context','desktop-linux','exec','-i','supabase_db_mfi','psql','-X','-U','postgres','-Atq','-v','ON_ERROR_STOP=1'],
 {input,encoding:'utf8',maxBuffer:8*1024*1024,stdio:['pipe','pipe','pipe']}).trim();}
 catch {throw new Error('Local cutover SQL failed; credentials/query values withheld.');}
}
const status=JSON.parse(execFileSync('npx',['supabase','status','-o','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
const endpoint=new URL(status.API_URL);
assert.equal(endpoint.origin,'http://127.0.0.1:54321');
const service=createClient(endpoint.href,status.SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const source=readFileSync('supabase/tests/database/bot_scrape_guarded_cutover.sql','utf8');
const names=[...source.slice(source.indexOf('insert into cutover_functions'),source.indexOf('select is(')).matchAll(/\('([a-z0-9_]+)'\)/g)].map(m=>m[1]);
assert.equal(names.length,22);
const functions=`select p.oid from pg_proc p where p.pronamespace='public'::regnamespace and p.proname in (${names.map(n=>`'${n}'`).join(',')})`;
const tables="'public.mfi_stops'::regclass,'public.mfi_reports'::regclass,'public.mfi_report_votes'::regclass,'public.operations_updates'::regclass,'public.operations_update_confirmations'::regclass";
const aclQuery=`set search_path=pg_catalog;
with acl as (
 select 'function' kind,p.oid::regprocedure::text object,null::text col,x.* from pg_proc p
 cross join lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner)))x where p.oid in (${functions})
 union all select 'table',c.oid::regclass::text,null,x.* from pg_class c
 cross join lateral aclexplode(coalesce(c.relacl,acldefault('r',c.relowner)))x where c.oid in (${tables})
 union all select 'column',a.attrelid::regclass::text,a.attname,x.* from pg_attribute a
 cross join lateral aclexplode(a.attacl)x where a.attrelid in (${tables}) and a.attnum>0 and not a.attisdropped
) select coalesce(jsonb_agg(to_jsonb(acl) order by kind,object,col,grantee,privilege_type),'[]') from acl;`;
const before=JSON.parse(sql(aclQuery));
const roles=JSON.parse(sql('select jsonb_object_agg(oid::text,rolname) from pg_roles;'));
const quote=s=>'"'+s.replaceAll('"','""')+'"';
const grants=before.filter(x=>(x.grantee===0||['anon','authenticated'].includes(roles[x.grantee]))&&x.privilege_type===(x.kind==='function'?'EXECUTE':'SELECT'));
assert.ok(grants.length>0);assert.ok(grants.every(x=>roles[x.grantor]==='postgres'));
const restore='begin;\n'+grants.map(x=>`grant ${x.privilege_type}${x.col?` (${quote(x.col)})`:''} on ${x.kind==='function'?'function':'table'} ${x.object} to ${x.grantee===0?'PUBLIC':quote(roles[x.grantee])}${x.is_grantable?' with grant option':''};`).join('\n')+"\nnotify pgrst,'reload schema';commit;";
const rollback=join(args[2],`guarded-cutover-rollback-${randomUUID()}.sql`);
writeFileSync(rollback,restore,{mode:0o600,flag:'wx'});
const fingerprint=`select jsonb_build_object(
 'stops',(select md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from public.mfi_stops t),
 'reports',(select md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from public.mfi_reports t),
 'ops',(select md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from public.operations_updates t),
 'library',(select md5(to_jsonb(c)::text) from private.freightiq_read_guard_config c),
 'operations',(select md5(to_jsonb(c)::text) from private.operations_read_guard_config c));`;
const dataBefore=sql(fingerprint);
const savedLibrary=JSON.parse(sql('select to_jsonb(c) from private.freightiq_read_guard_config c'));
const savedOps=JSON.parse(sql('select to_jsonb(c) from private.operations_read_guard_config c'));
const restoreConfig=(table,record)=>{
 const fields=Object.keys(record).filter(k=>k!=='singleton');
 sql(`update private.${table} set (${fields.join(',')})=(select ${fields.join(',')} from jsonb_populate_record(null::private.${table},'${JSON.stringify(record).replaceAll("'","''")}'::jsonb))`);
};
let id;let closed=false;let passed=0;
const probe=async(token,path,body,expected)=>{
 const res=await fetch(endpoint.origin+'/rest/v1/'+path,{method:body===undefined?'GET':'POST',headers:{apikey:status.ANON_KEY,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
 const data=await res.json();
 assert.ok(expected.includes(res.status),`${path}: unexpected HTTP ${res.status}`);
 if(expected.includes(403))assert.equal(data.code,'42501');
 if(res.status===429)assert.equal(data.data,null);
 passed++;return data;
};
try{
 const email=`cutover-${randomUUID()}@example.invalid`;const password=randomUUID()+'aA!';
 const created=await service.auth.admin.createUser({email,password,email_confirm:true});assert.equal(created.error,null);id=created.data.user.id;
 const client=createClient(endpoint.href,status.ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 const signed=await client.auth.signInWithPassword({email,password});assert.equal(signed.error,null);const token=signed.data.session.access_token;
 const stop='cutover-http-'+id;
 await probe(token,'rpc/create_freightiq_stop_v1',{p_stop_id:stop,p_name:'Synthetic final cutover',p_address:null,p_lat:39,p_lng:-108},[200]);
 const definitions=JSON.parse(sql(`select jsonb_agg(jsonb_build_object('name',proname,'args',proargnames[1:pronargs])) from pg_proc where oid in (${functions})`));
 assert.equal(definitions.length,22);
 const closure=source.slice(source.indexOf('create temporary table cutover_functions'),source.indexOf('select is('))+
 source.slice(source.indexOf('do $closure$'),source.indexOf('$closure$;')+'$closure$;'.length);
 closed=true;
 sql('begin;'+closure+"\nnotify pgrst,'reload schema';commit;");
 sql(`update private.freightiq_read_guard_config set enabled=true,request_capacity=3,request_refill=0.001,metadata_capacity=1000,metadata_refill=1,detail_capacity=1000,detail_refill=1;
 update private.operations_read_guard_config set enabled=true,request_capacity=120,request_refill=2,row_capacity=20000,row_refill=100;`);
 for(const credential of [status.ANON_KEY,token]){
  for(const name of ['mfi_stops','mfi_reports','mfi_report_votes','operations_updates','operations_update_confirmations'])
   await probe(credential,`${name}?select=id&limit=1`,undefined,[401,403]);
  await probe(credential,'mfi_stops?select=id,mfi_reports(id)&limit=1',undefined,[401,403]);
  for(const fn of definitions)await probe(credential,'rpc/'+fn.name,Object.fromEntries(fn.args.map(a=>[a,null])),[401,403]);
 }
 const detail=await probe(token,'rpc/read_freightiq_guarded_v1',{p_operation:'stop_detail',p_args:{p_stop_id:stop}},[200]);
 assert.equal(detail.data[0].id,stop);
 await probe(token,'rpc/read_freightiq_guarded_v1',{p_operation:'route_stops',p_args:{p_stop_ids:[stop]}},[200]);
 await probe(token,'rpc/read_freightiq_guarded_v1',{p_operation:'stop_summaries',p_args:{p_stop_ids:[stop]}},[200]);
 await probe(token,'rpc/read_freightiq_guarded_v1',{p_operation:'stop_detail',p_args:{p_stop_id:stop}},[429]);
 await probe(token,'rpc/read_operations_guarded_v1',{},[200]);
 await probe(token,'rpc/save_freightiq_report_v1',{p_stop_id:stop},[200]);
 await probe(token,'rpc/get_owned_freightiq_stop_editor_v1',{p_stop_id:stop},[200]);
 console.log(`${passed} actual HTTP probes passed with all 22 bypass functions and five direct-table paths closed.`);
}finally{
 if(closed)sql(restore);
 restoreConfig('freightiq_read_guard_config',savedLibrary);restoreConfig('operations_read_guard_config',savedOps);
 if(id){sql(`delete from public.mfi_stops where user_id='${id}'`);const deleted=await service.auth.admin.deleteUser(id);assert.equal(deleted.error,null);}
 assert.deepEqual(JSON.parse(sql(aclQuery)),before,'Effective permissions were not restored');
 assert.equal(sql(fingerprint),dataBefore,'Data or phone policy changed');
 console.log('Exact effective permissions, shared data and original phone policies restored; synthetic account removed. Rollback file: '+rollback);
}
