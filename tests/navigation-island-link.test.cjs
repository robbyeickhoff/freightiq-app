const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(require('node:path').join(__dirname, '../app/+native-intent.tsx'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const context = { exports: {}, URL };
vm.runInNewContext(compiled, context);
const redirect = context.exports.redirectSystemPath;

test('cold Island launch enters normal startup; warm links retain navigation', () => {
  for (const path of ['mfi://active-navigation?fromLiveActivity=1', 'mfi:///active-navigation?fromLiveActivity=1', '/active-navigation?fromLiveActivity=1']) {
    assert.equal(redirect({path, initial: true}), '/');
    assert.equal(redirect({path, initial: false}), path);
  }
});
test('other links and navigation starts remain untouched', () => {
  for (const path of ['mfi://active-navigation?previewStart=1', 'mfi://stop?id=123', 'mfi://create-account?referral_code=example', 'https://example.com/active-navigation?fromLiveActivity=1', 'not a URL', '']) {
    assert.equal(redirect({path, initial: true}), path);
  }
});
