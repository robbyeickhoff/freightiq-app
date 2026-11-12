const name = "FreightIQNavigationActivity";

module.exports = function addNavigationActivityTarget(project, bundleIdentifier) {
  const objects = project.hash.project.objects;
  const parent = project.getFirstTarget().firstTarget;
  const existing = Object.values(objects.PBXNativeTarget)
    .some((target) => target.name?.replaceAll('"', "") === name);
  if (existing) return;

  const target = project.addTarget(name, "app_extension", name, `${bundleIdentifier}.navigation-activity`);
  const sources = project.addBuildPhase([], "PBXSourcesBuildPhase", "Sources", target.uuid);
  const group = project.getFirstProject().firstProject.mainGroup;
  for (const path of [
    "../native-navigation/NavigationActivityAttributes.swift",
    "../navigation-live-activity/NavigationActivityWidget.swift",
  ]) {
    const file = project.addFile(path, group, { sourceTree: "SOURCE_ROOT" });
    const id = project.generateUuid();
    objects.PBXBuildFile[id] = { isa: "PBXBuildFile", fileRef: file.fileRef, fileRef_comment: file.basename };
    sources.buildPhase.files.push({ value: id, comment: `${file.basename} in Sources` });
  }
  for (const config of objects.XCConfigurationList[target.pbxNativeTarget.buildConfigurationList].buildConfigurations) {
    const entry = objects.XCBuildConfiguration[config.value];
    const hostConfigs = objects.XCConfigurationList[parent.buildConfigurationList].buildConfigurations;
    const host = objects.XCBuildConfiguration[hostConfigs.find((item) =>
      objects.XCBuildConfiguration[item.value].name === entry.name).value].buildSettings;
    Object.assign(entry.buildSettings, {
      INFOPLIST_FILE: "../navigation-live-activity/Info.plist",
      GENERATE_INFOPLIST_FILE: "YES",
      APPLICATION_EXTENSION_API_ONLY: "YES",
      IPHONEOS_DEPLOYMENT_TARGET: "16.4",
      SWIFT_VERSION: "5.0",
      TARGETED_DEVICE_FAMILY: '"1,2"',
      CODE_SIGN_STYLE: "Automatic",
      DEVELOPMENT_TEAM: host.DEVELOPMENT_TEAM ?? '""',
      CURRENT_PROJECT_VERSION: host.CURRENT_PROJECT_VERSION ?? "1",
      MARKETING_VERSION: host.MARKETING_VERSION ?? "1.0",
    });
  }
};
