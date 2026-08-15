const appJson = require("./app.json");

module.exports = ({ config }) => {
  const isDevelopment = process.env.APP_VARIANT === "development";

  return {
    ...config,
    ...appJson.expo,
    name: isDevelopment ? "FreightIQ Dev" : appJson.expo.name,
    ios: {
      ...appJson.expo.ios,
      bundleIdentifier: isDevelopment
        ? "com.robbyeickhof.mfi.dev"
        : appJson.expo.ios.bundleIdentifier,
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
    },
  };
};
