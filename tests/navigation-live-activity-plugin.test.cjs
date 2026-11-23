const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('Dev disables Live Activities and cleans them before JavaScript launch', () => {
  const mods = {};
  const sandbox = {
    module: { exports: {} },
    process,
    require(name) {
      if (name === '@expo/config-plugins') {
        return Object.fromEntries(
          ['withInfoPlist', 'withXcodeProject', 'withAppDelegate'].map(key => [
            key, (config, callback) => { mods[key] = callback; return config; },
          ]),
        );
      }
      return () => {};
    },
  };
  vm.runInNewContext(fs.readFileSync(
    path.join(__dirname, '../plugins/withFreightIQNavigation.js'), 'utf8',
  ), sandbox);
  sandbox.module.exports({});

  for (const [identifier, enabled] of [
    ['com.robbyeickhof.mfi.dev', false], ['com.robbyeickhof.mfi', true],
  ]) {
    const mod = { ios: { bundleIdentifier: identifier }, modResults: {} };
    mods.withInfoPlist(mod);
    assert.equal(mod.modResults.NSSupportsLiveActivities, enabled);
  }

  // Model Expo's launch entry without depending on ignored/generated ios files.
  const mod = { modResults: { contents: [
    '  public override func application(',
    '    _ application: UIApplication,',
    '    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil',
    '  ) -> Bool {',
    '    let delegate = ReactNativeDelegate()',
    '    return super.application(application, didFinishLaunchingWithOptions: launchOptions)',
    '  }',
  ].join('\n') } };
  mods.withAppDelegate(mod);
  mods.withAppDelegate(mod);
  const contents = mod.modResults.contents;
  assert.equal(contents.split('NavigationLiveActivity.clearActivitiesOnLaunch()').length - 1, 1);
  assert(contents.indexOf('clearActivitiesOnLaunch()') < contents.indexOf('let delegate = ReactNativeDelegate()'));
  const legacy = { modResults: { contents: contents.replace(
    'clearActivitiesOnLaunch()', 'clearDevelopmentActivities()',
  ) } };
  mods.withAppDelegate(legacy);
  assert.equal(legacy.modResults.contents, contents);
  assert.throws(() => mods.withAppDelegate({ modResults: { contents: 'unexpected template' } }));
});
