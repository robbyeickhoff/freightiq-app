const { AndroidConfig, withProjectBuildGradle, withStringsXml, withAndroidManifest } = require("@expo/config-plugins");

const dependencyBlock = `
project(":expo") {
    plugins.withId("com.android.library") {
        dependencies.add("api", "com.mapbox.navigationcore:android-ndk27:3.35.0")
    }
}
`;

module.exports = function withFreightIQAndroidNavigation(config) {
  const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
  if (!token) throw new Error("Mapbox navigation requires a public access token.");
  config = withAndroidManifest(config, (mod) => {
    const permissions = mod.modResults.manifest["uses-permission"] ??= [];
    const name = "android.permission.POST_PROMOTED_NOTIFICATIONS";
    if (!permissions.some((permission) => permission.$["android:name"] === name)) {
      permissions.push({ $: { "android:name": name } });
    }
    return mod;
  });
  config = withStringsXml(config, (mod) => {
    mod.modResults = AndroidConfig.Strings.setStringItem(
      [{ $: { name: "mapbox_access_token" }, _: token }],
      mod.modResults,
    );
    return mod;
  });
  return withProjectBuildGradle(config, (mod) => {
    const build = mod.modResults;
    if (build.language !== "groovy") {
      throw new Error("Unable to configure Mapbox Navigation for this Android Gradle project.");
    }
    if (!build.contents.includes(dependencyBlock)) {
      build.contents += dependencyBlock;
    }
    return mod;
  });
};
