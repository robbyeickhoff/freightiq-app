const { withAndroidManifest } = require("expo/config-plugins");

const NAVIGATION_SCHEMES = ["google.navigation", "waze"];

function withNavigationAppQueries(config) {
  return withAndroidManifest(config, (androidConfig) => {
    const manifest = androidConfig.modResults.manifest;
    const queries = manifest.queries?.[0] ?? {};
    const intents = queries.intent ?? [];

    for (const scheme of NAVIGATION_SCHEMES) {
      const alreadyDeclared = intents.some((intent) =>
        intent.data?.some((data) => data.$?.["android:scheme"] === scheme),
      );

      if (!alreadyDeclared) {
        intents.push({
          action: [{ $: { "android:name": "android.intent.action.VIEW" } }],
          category: [{ $: { "android:name": "android.intent.category.BROWSABLE" } }],
          data: [{ $: { "android:scheme": scheme } }],
        });
      }
    }

    queries.intent = intents;
    manifest.queries = [queries];
    return androidConfig;
  });
}

module.exports = withNavigationAppQueries;
