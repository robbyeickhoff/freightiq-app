import * as TaskManager from "expo-task-manager";
import type { LocationObject } from "expo-location";
import {
  DRIVING_TASK,
  handleDrivingLocation,
  stopPriorDrivingAccount,
} from "./operations-driving-alerts";

// Expo requires this definition at module scope, including on background launches.
TaskManager.defineTask(DRIVING_TASK, async ({ data, error }) => {
  if (error) {
    await stopPriorDrivingAccount(null, "Session stopped by the device");
    return;
  }
  const locations = (data as { locations?: LocationObject[] } | undefined)?.locations;
  if (!Array.isArray(locations)) return;
  for (const location of locations) {
    try {
      await handleDrivingLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy ?? Infinity,
        timestamp: location.timestamp,
      });
    } catch {
      // A native notification/task failure must not leave an apparently active session.
      await stopPriorDrivingAccount(null, "Session stopped after a device error");
    }
  }
});
