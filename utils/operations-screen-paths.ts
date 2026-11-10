export function operationsScreenPaths(pathname: string) {
  const overNavigation = pathname === "/navigation-operations" || pathname.startsWith("/navigation-operations/");
  return {
    overNavigation,
    board: overNavigation ? "/navigation-operations" : "/(tabs)/operations",
    compose: overNavigation ? "/navigation-operations/compose" : "/(tabs)/operations/compose",
    map: overNavigation ? "/navigation-operations/map" : "/(tabs)/operations/map",
    reportContent: overNavigation ? "/navigation-operations/report-content" : "/(tabs)/profile/report-content",
  } as const;
}
