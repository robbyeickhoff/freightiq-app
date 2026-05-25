const appJson = require("./app.json");

module.exports = ({ config }) => ({
  ...config,
  ...appJson.expo,
  extra: {
    ...appJson.expo.extra,
    mapboxPublicToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN,
  },
});
