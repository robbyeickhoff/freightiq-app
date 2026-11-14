const appJson = require("./app.json");

module.exports = ({ config }) => {
  const isDevelopment = process.env.APP_VARIANT === "development";
  const enableNavigation = process.env.FREIGHTIQ_EMBEDDED_NAVIGATION === "1";
  const enableAndroidNavigation =
    isDevelopment && process.env.FREIGHTIQ_ANDROID_EMBEDDED_NAVIGATION === "1";
  const iosBundleIdentifier = isDevelopment
    ? "com.robbyeickhof.mfi.dev"
    : appJson.expo.ios.bundleIdentifier;
  const googleMaps3DIOSAPIKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_3D_IOS_API_KEY ?? "";
  const googleMaps3DAndroidAPIKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_3D_ANDROID_API_KEY ?? "";
  const enable3DYardViewIOS = googleMaps3DIOSAPIKey.length > 0;
  const enable3DYardViewAndroid = googleMaps3DAndroidAPIKey.length > 0;
  const plugins = [...(appJson.expo.plugins ?? [])];
  if (isDevelopment) {
    plugins.push(["expo-dev-client", { addGeneratedScheme: false }]);
  }
  if (enableNavigation) {
    plugins.push("./plugins/withFreightIQNavigation.js");
  }

  if (enableAndroidNavigation) {
    plugins.push("./plugins/withFreightIQAndroidNavigation.js");
  }
  if (enableNavigation || enableAndroidNavigation) {
    plugins.push(["expo-build-properties", {
      ...(enableNavigation && { ios: { enableSceneSupport: true } }),
      ...(enableAndroidNavigation && {
        android: { extraMavenRepos: ["https://api.mapbox.com/downloads/v2/releases/maven"] },
      }),
    }]);
  }

  if (enable3DYardViewIOS || enable3DYardViewAndroid) {
    plugins.push("./plugins/withFreightIQ3DYardView.js");
  }

  return {
    ...config,
    ...appJson.expo,
    scheme: isDevelopment ? ["mfi-dev", "exp+mfi-dev"] : appJson.expo.scheme,
    name: isDevelopment ? "FreightIQ Dev" : appJson.expo.name,
    experiments: {
      ...appJson.expo.experiments,
      ...(enableNavigation || enableAndroidNavigation
        ? { inlineModules: { watchedDirectories: [
            ...(enableNavigation ? ["native-navigation"] : []),
            ...(enableAndroidNavigation ? ["native-navigation-android"] : []),
          ] } }
        : {}),
    },
    plugins,
    ios: {
      ...appJson.expo.ios,
      bundleIdentifier: iosBundleIdentifier,
      infoPlist: {
        ...appJson.expo.ios?.infoPlist,
        ...(enable3DYardViewIOS
          ? {
              FreightIQGoogleMaps3DAPIKey: googleMaps3DIOSAPIKey,
            }
          : {}),
      },
    },
    android: {
      ...appJson.expo.android,
      package: isDevelopment
        ? "com.robbyeickhof.mfi.dev"
        : appJson.expo.android.package,
      config: {
        ...appJson.expo.android?.config,
        googleMaps: {
          ...appJson.expo.android?.config?.googleMaps,
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
    },
    extra: {
      ...appJson.expo.extra,
      ...(enableNavigation && {
        eas: {
          ...appJson.expo.extra.eas,
          build: {
            experimental: {
              ios: {
                appExtensions: [{
                  targetName: "FreightIQNavigationActivity",
                  bundleIdentifier: `${iosBundleIdentifier}.navigation-activity`,
                }],
              },
            },
          },
        },
      }),
      mapboxPublicToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN,
      enable3DYardViewIOS,
      enable3DYardViewAndroid,
    },
  };
};
