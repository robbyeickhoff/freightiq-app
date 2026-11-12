const { withInfoPlist, withXcodeProject } = require("@expo/config-plugins");

const addNavigationActivityTarget = require("./addNavigationActivityTarget");

// Opt-in native integration until owner acceptance; production keeps its current behavior.
module.exports = function withFreightIQNavigation(config) {
  config = withInfoPlist(config, (mod) => {
    mod.modResults.NSSupportsLiveActivities = true;
    mod.modResults.MBXAccessToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
    if (process.env.FREIGHTIQ_STOP_RESTRICTION_TEST === "1") {
      mod.modResults.FreightIQStopRestrictionTest = true;
    } else {
      delete mod.modResults.FreightIQStopRestrictionTest;
    }
    mod.modResults.UIBackgroundModes = [...new Set([
      ...(mod.modResults.UIBackgroundModes ?? []), "location", "audio",
    ])];
    return mod;
  });
  return withXcodeProject(config, (mod) => {
    const project = mod.modResults;
    const objects = project.hash.project.objects;
    const root = project.getFirstProject().firstProject;
    const target = project.getFirstTarget().firstTarget;
    objects.XCRemoteSwiftPackageReference ??= {};
    objects.XCSwiftPackageProductDependency ??= {};
    const packageId = project.generateUuid();
    const url = "https://github.com/mapbox/mapbox-navigation-ios.git";
    const existing = Object.entries(objects.XCRemoteSwiftPackageReference)
      .find(([, value]) => value.repositoryURL === `"${url}"`);
    const reference = existing?.[0] ?? packageId;
    if (!existing) {
      objects.XCRemoteSwiftPackageReference[reference] = {
        isa: "XCRemoteSwiftPackageReference",
        repositoryURL: `"${url}"`,
        requirement: { kind: "exactVersion", version: "3.34.1" },
      };
      root.packageReferences ??= [];
      root.packageReferences.push({ value: reference, comment: "Mapbox Navigation" });
    }
    target.packageProductDependencies ??= [];
    for (const product of ["MapboxNavigationCore", "MapboxNavigationUIKit"]) {
      if (target.packageProductDependencies.some((item) => item.comment === product)) continue;
      const productId = project.generateUuid();
      const buildId = project.generateUuid();
      objects.XCSwiftPackageProductDependency[productId] = {
        isa: "XCSwiftPackageProductDependency", package: reference, productName: product,
      };
      target.packageProductDependencies.push({ value: productId, comment: product });
      objects.PBXBuildFile[buildId] = {
        isa: "PBXBuildFile", productRef: productId, productRef_comment: product,
      };
      const frameworks = target.buildPhases.find((phase) =>
        objects.PBXFrameworksBuildPhase?.[phase.value]);
      objects.PBXFrameworksBuildPhase[frameworks.value].files.push({
        value: buildId, comment: `${product} in Frameworks`,
      });
    }
    addNavigationActivityTarget(project, mod.ios.bundleIdentifier);
    return mod;
  });
};
