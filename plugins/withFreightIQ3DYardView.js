const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const POD_LINE =
  "  pod 'GoogleMaps3DBinary', :podspec => '../plugins/GoogleMaps3DBinary.podspec'";

module.exports = function withFreightIQ3DYardView(config) {
  return withDangerousMod(config, [
    "ios",
    async (modConfig) => {
      const podfilePath = path.join(modConfig.modRequest.platformProjectRoot, "Podfile");
      const podfile = fs.readFileSync(podfilePath, "utf8");

      if (podfile.includes(POD_LINE.trim())) {
        return modConfig;
      }

      const targetMatch = podfile.match(/^target '[^']+' do$/m);
      if (!targetMatch) {
        throw new Error("Unable to configure FreightIQ 3D Yard View: iOS target was not found.");
      }

      fs.writeFileSync(
        podfilePath,
        podfile.replace(targetMatch[0], `${targetMatch[0]}\n${POD_LINE}`),
      );
      return modConfig;
    },
  ]);
};
