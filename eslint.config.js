// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
    rules: {
      // SDK 57 enables this new React rule across existing effects. Preserve the accepted runtime
      // behavior during the maintenance upgrade; effect refactors require a separate review.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);
