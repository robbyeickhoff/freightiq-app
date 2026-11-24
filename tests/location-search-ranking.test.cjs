const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const c={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync('utils/location-search-ranking.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,c);const rank=c.exports.rankLocationSearchResults;
const row=(id,source,distanceMeters,name='Acme',locality)=>({id,source,distanceMeters,name,locality});
test('nearby first, FreightIQ preferred within nearby region, farther exact matches later',()=>{
 const data=[row('farstop','freightiq',500000),row('localplace','place',500),row('regionalplace','place',70000),row('localstop','freightiq',20000,'Acme warehouse')];
 assert.deepEqual(Array.from(rank(data,'Acme'),x=>x.id),['localstop','localplace','regionalplace','farstop']);
});
test('distance precedes exact text within a source and region',()=>{
 const data=[row('exact','place',10000),row('close','place',200,'Acme depot')];assert.equal(rank(data,'Acme')[0].id,'close');
});
test('explicit destination city outranks nearby results elsewhere',()=>{
 const data=[row('local','freightiq',200,'Acme','Grand Junction'),row('target','place',150000,'Acme','Telluride')];assert.equal(rank(data,'Acme Telluride')[0].id,'target');
});
test('unknown or invalid distance is never considered nearby; stable ties preserve provider order',()=>{
 const data=[row('unknown','freightiq',undefined),row('negative','place',-1),row('real','place',200),row('nan','place',NaN)];assert.deepEqual(Array.from(rank(data,'Acme'),x=>x.id),['real','unknown','negative','nan']);
});
test('Stops-only list uses same nearby and distance priorities without hiding results',()=>{
 const data=[row('distant','freightiq',300000),row('near2','freightiq',5000),row('near1','freightiq',1000)];assert.deepEqual(Array.from(rank(data,'Acme'),x=>x.id),['near1','near2','distant']);
});
