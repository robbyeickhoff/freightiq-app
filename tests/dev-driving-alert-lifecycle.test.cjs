const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const source=fs.readFileSync('utils/operations-driving-alerts.ts','utf8');
const policy=source.slice(source.indexOf('const isIPhoneDev'),source.indexOf('export const DRIVING_TASK'));
const start=source.slice(source.indexOf('export async function startDrivingAlerts'),source.indexOf('export async function stopDrivingAlerts'));
function harness(dev=true){
 const store=new Map(),state={session:null,failure:null},calls={start:0,stop:0},listeners=[];
 let registered=false;
 const c={exports:{},Promise,Date,Error,Platform:{OS:'ios'},Constants:{expoConfig:{ios:{bundleIdentifier:dev?'com.robbyeickhof.mfi.dev':'com.robbyeickhof.mfi'}}},AppState:{currentState:'active',addEventListener:(_,f)=>{listeners.push(f);return{remove(){}}}},POINTER:'owner',DRIVING_TASK:'task',
 AsyncStorage:{getItem:async k=>store.get(k)||null,setItem:async(k,v)=>store.set(k,v)},
 Location:{hasStartedLocationUpdatesAsync:async()=>registered,stopLocationUpdatesAsync:async()=>{calls.stop++;registered=false},startLocationUpdatesAsync:async()=>{calls.start++;registered=true},hasServicesEnabledAsync:async()=>true,requestForegroundPermissionsAsync:async()=>({granted:true}),requestBackgroundPermissionsAsync:async()=>({granted:true}),Accuracy:{Balanced:3}},
 Notifications:{requestPermissionsAsync:async()=>({granted:true})},supabase:{auth:{getSession:async()=>({data:{session:{user:{id:'u'}}}})}},channelsReady:async()=>true,refreshDrivingSnapshot:async()=>true,serialized:async f=>f(),read:async()=>state,write:async()=>{},stopDrivingAlerts:async(id,failure)=>{calls.stop++;registered=false;store.delete('owner');state.session=null;state.failure=failure}};
 vm.runInNewContext(ts.transpileModule(policy+start,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,c);
 return{c,store,state,calls,registered:()=>registered,background(){c.AppState.currentState='background';listeners.forEach(f=>f('background'))},async settle(){for(let i=0;i<20;i++)await Promise.resolve()}};
}
test('Dev stops saved alert task on launch and when backgrounded; never auto restarts',async()=>{
 const h=harness();h.store.set('owner','u');h.c.exports.installDevDrivingAlertCleanup();await h.settle();assert.equal(h.store.has('owner'),false);
 await h.c.exports.startDrivingAlerts('u','route');assert.ok(h.registered());h.background();await h.settle();assert.equal(h.registered(),false);assert.equal(h.state.session,null);assert.equal(h.calls.start,1);
});
test('production background alerts remain active',async()=>{
 const h=harness(false);h.c.exports.installDevDrivingAlertCleanup();await h.c.exports.startDrivingAlerts('u','route');h.background();await h.settle();assert.ok(h.registered());assert.ok(h.state.session);assert.equal(h.calls.stop,0);
});
test('backgrounding during native Start prevents a late session from surviving',async()=>{
 const h=harness();h.c.exports.installDevDrivingAlertCleanup();await h.settle();let release;const gate=new Promise(r=>release=r);const native=h.c.Location.startLocationUpdatesAsync;h.c.Location.startLocationUpdatesAsync=async()=>{await gate;await native()};
 const started=h.c.exports.startDrivingAlerts('u','route');await h.settle();h.background();release();await assert.rejects(started);await h.settle();assert.equal(h.registered(),false);assert.equal(h.state.session,null);
});
test('Dev clears registered task even without a saved owner',async()=>{
 const h=harness();await h.c.Location.startLocationUpdatesAsync();h.c.exports.installDevDrivingAlertCleanup();await h.settle();assert.equal(h.registered(),false);
});
test('Android Dev retains background alerts',async()=>{
 const h=harness();h.c.Platform.OS='android';h.c.exports.installDevDrivingAlertCleanup();await h.c.exports.startDrivingAlerts('u','route');h.background();await h.settle();assert.ok(h.registered());assert.ok(h.state.session);assert.equal(h.calls.stop,0);
});
