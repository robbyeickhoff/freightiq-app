const { withAndroidManifest, withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const POD_LINE =
  "  pod 'GoogleMaps3DBinary', :podspec => '../plugins/GoogleMaps3DBinary.podspec'";

module.exports = function withFreightIQ3DYardView(config) {
  let nextConfig = config;

  if (process.env.EXPO_PUBLIC_GOOGLE_MAPS_3D_IOS_API_KEY) {
    nextConfig = withDangerousMod(nextConfig, [
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
  }

  if (process.env.EXPO_PUBLIC_GOOGLE_MAPS_3D_ANDROID_API_KEY) {
    nextConfig = withAndroidManifest(nextConfig, (modConfig) => {
      const application = modConfig.modResults.manifest.application?.[0];
      if (!application) {
        throw new Error("Unable to configure FreightIQ 3D Yard View: Android application was not found.");
      }

      application["meta-data"] = application["meta-data"] ?? [];
      const metadataName = "com.google.android.geo.maps3d.API_KEY";
      const existing = application["meta-data"].find(
        (entry) => entry.$?.["android:name"] === metadataName,
      );
      const value = process.env.EXPO_PUBLIC_GOOGLE_MAPS_3D_ANDROID_API_KEY;
      if (existing) {
        existing.$["android:value"] = value;
      } else {
        application["meta-data"].push({
          $: {
            "android:name": metadataName,
            "android:value": value,
          },
        });
      }
      return modConfig;
    });
  }

  return nextConfig;
};
