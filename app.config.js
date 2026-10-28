const appJson = require("./app.json");

module.exports = ({ config }) => {
  const isDevelopment = process.env.APP_VARIANT === "development";
  const plugins = [...(appJson.expo.plugins ?? [])];

  if (isDevelopment) {
    plugins.push("./plugins/withFreightIQ3DYardView.js");
  }

  return {
    ...config,
    ...appJson.expo,
    name: isDevelopment ? "FreightIQ Dev" : appJson.expo.name,
    plugins,
    ios: {
      ...appJson.expo.ios,
      bundleIdentifier: isDevelopment
        ? "com.robbyeickhof.mfi.dev"
        : appJson.expo.ios.bundleIdentifier,
      infoPlist: {
        ...appJson.expo.ios?.infoPlist,
        ...(isDevelopment
          ? {
              FreightIQGoogleMaps3DAPIKey:
                process.env.EXPO_PUBLIC_GOOGLE_MAPS_3D_IOS_API_KEY ?? "",
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
      mapboxPublicToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN,
      enable3DYardView: isDevelopment,
    },
  };
};
