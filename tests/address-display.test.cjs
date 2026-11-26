const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),cp=require('node:child_process'),os=require('node:os'),path=require('node:path');
const c={exports:{},RegExp};vm.runInNewContext(ts.transpileModule(fs.readFileSync('utils/address-display.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,c);
const {abbreviateRoadText,abbreviateAddress,displayStopName,ROAD_TYPE_ABBREVIATIONS}=c.exports;
const cases=[['West Pacific Avenue','W Pacific Ave'],['326 North Fir Street','326 N Fir St'],['South','South'],['East Main Road','E Main Rd'],['Main Road East','Main Rd E'],['Gunnison River Drive','Gunnison River Dr'],['461 Ponderosa Drive','461 Ponderosa Dr'],['125 3rd Avenue','125 3rd Ave'],['North River Road','N River Rd'],['County Road 17','County Rd 17'],['Highway 50 West','Hwy 50 W'],['Main Street / US 50','Main St / US 50'],['Turn right onto Main Street. Continue on Oak Drive.','Turn right onto Main St. Continue on Oak Dr.'],['120 Main Street North Apt 2','120 Main St N Apt 2'],['120 Main Street #4','120 Main St #4'],['Drive Street','Drive St'],['Avenue Road','Avenue Rd'],['US 50 / CO 141 West','US 50 / CO 141 W'],['Grand Junction','Grand Junction'],['Street Food Market','Street Food Market'],['Driveway','Driveway'],['5 Rue Émile Street','5 Rue Émile St'],['Main St','Main St']];
test('road suffixes abbreviate consistently, including numbered roads and maneuver text',()=>{for(const [input,expected] of cases){assert.equal(abbreviateRoadText(input),expected,input);assert.equal(abbreviateRoadText(expected),expected)}});
test('address display preserves locality and original data; business names stay original',()=>{
 const original='461 Ponderosa Drive, Grand Terrace, Colorado 81432';assert.equal(abbreviateAddress(original),'461 Ponderosa Dr, Grand Terrace, Colorado 81432');assert.equal(original,'461 Ponderosa Drive, Grand Terrace, Colorado 81432');
 assert.equal(displayStopName('3759 Ponderosa Drive'),'3759 Ponderosa Dr');assert.equal(displayStopName('Street Food Market'),'Street Food Market');assert.equal(displayStopName('River Road Supply'),'River Road Supply');assert.equal(displayStopName('North West Supply'),'North West Supply');assert.equal(abbreviateAddress('326 North Fir Street, North Bend, OR'),'326 N Fir St, North Bend, OR');
 assert.equal(abbreviateAddress('120 Main Street\nUnit 2\nGrand Terrace, CO'),'120 Main St\nUnit 2\nGrand Terrace, CO');
 for(const [word,short] of Object.entries(ROAD_TYPE_ABBREVIATIONS))assert.equal(abbreviateRoadText('123 Maple '+word), '123 Maple '+short);
});
test('native suffix tables match the shared display vocabulary',()=>{
 const swift=fs.readFileSync('native-navigation/FreightIQNavigation.swift','utf8').split('private let displayedRoadPattern')[0];const kotlin=fs.readFileSync('native-navigation-android/FreightIQAndroidNavigationView.kt','utf8').split('private val displayedRoadPattern')[0];
 for(const [key,value] of Object.entries(ROAD_TYPE_ABBREVIATIONS)){assert.ok(swift.includes(`"${key}": "${value}"`),key);assert.ok(kotlin.includes(`"${key}" to "${value}"`),key)}
});
test('iPhone native formatter executes the same street and maneuver cases',{skip:process.platform!=='darwin'},()=>{
 const source=fs.readFileSync('native-navigation/FreightIQNavigation.swift','utf8');const begin=source.indexOf('// Screen text only:');const end=source.indexOf('func navigationRoadKey(');const dir=fs.mkdtempSync(path.join(os.tmpdir(),'fiq-address-display-'));
 try{fs.writeFileSync(path.join(dir,'Checks.swift'),'import Foundation\n'+source.slice(begin,end)+cases.map(([input,expected])=>`precondition(abbreviatedRoadText(${JSON.stringify(input)}) == ${JSON.stringify(expected)})`).join('\n'));cp.execFileSync('xcrun',['swift',path.join(dir,'Checks.swift')])}finally{fs.rmSync(dir,{recursive:true,force:true})}
});
test('preview instructions use road names without appended references',()=>{
 const format=c.exports.displayPreviewInstruction;
 assert.equal(format('Turn left onto Patterson Road/F.','Patterson Road','F'),'Turn left onto Patterson Rd.');
 assert.equal(format('Turn right onto North 1st Street / 26.','North 1st Street','26'),'Turn right onto N 1st St.');
 assert.equal(format('Turn right onto D 1/2 Road/D ½.','D 1/2 Road','D ½'),'Turn right onto D 1/2 Rd.');
 assert.equal(format('Turn right onto US 50.', '', 'US 50'),'Turn right onto US 50.');
 assert.equal(format('Turn left.','Patterson Road','F'),'Turn left.');
});
