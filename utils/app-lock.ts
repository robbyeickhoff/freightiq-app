import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { Platform } from "react-native";

export type AppLockBackgroundTimeout = 600000 | 1800000 | 3600000 | "restart-only";

export const DEFAULT_APP_LOCK_BACKGROUND_TIMEOUT_MS: AppLockBackgroundTimeout = 1800000;

type AppLockListener = (userId: string, enabled: boolean) => void;
type AppLockTimeoutListener = (userId: string, timeout: AppLockBackgroundTimeout) => void;

const listeners = new Set<AppLockListener>();
const timeoutListeners = new Set<AppLockTimeoutListener>();

function appLockKey(userId: string) {
  return `freightiq:app-lock:v1:${userId}`;
}

function appLockTimeoutKey(userId: string) {
  return `freightiq:app-lock-timeout:v1:${userId}`;
}

export type AppLockCapability = {
  available: boolean;
  label: "Face ID" | "Touch ID" | "Biometrics";
  reason: "available" | "no-hardware" | "not-enrolled" | "strong-biometric-required";
};

export async function getAppLockCapability(): Promise<AppLockCapability> {
  const [hasHardware, isEnrolled, types, enrolledLevel] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
    LocalAuthentication.getEnrolledLevelAsync(),
  ]);

  const label =
    Platform.OS === "ios"
      ? types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
        ? "Face ID"
        : "Touch ID"
      : "Biometrics";

  if (!hasHardware) return { available: false, label, reason: "no-hardware" };
  if (!isEnrolled) return { available: false, label, reason: "not-enrolled" };
  if (
    Platform.OS === "android" &&
    enrolledLevel !== LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG
  ) {
    return { available: false, label, reason: "strong-biometric-required" };
  }

  return { available: true, label, reason: "available" };
}

export async function authenticateForAppLock(
  label: AppLockCapability["label"],
  copy?: {
    promptDescription?: string;
    promptMessage?: string;
    promptSubtitle?: string;
  },
) {
  return LocalAuthentication.authenticateAsync({
    biometricsSecurityLevel: "strong",
    cancelLabel: "Cancel",
    disableDeviceFallback: false,
    fallbackLabel: "Use Passcode",
    promptDescription:
      copy?.promptDescription ?? "Confirm it’s you to open your signed-in FreightIQ app.",
    promptMessage: copy?.promptMessage ?? `Unlock FreightIQ with ${label}`,
    promptSubtitle: copy?.promptSubtitle ?? "FreightIQ App Lock",
  });
}

export async function getAppLockEnabled(userId: string) {
  return (await AsyncStorage.getItem(appLockKey(userId))) === "true";
}

export async function getAppLockBackgroundTimeout(
  userId: string,
): Promise<AppLockBackgroundTimeout> {
  const storedValue = await AsyncStorage.getItem(appLockTimeoutKey(userId));
  if (storedValue === "600000") return 600000;
  if (storedValue === "3600000") return 3600000;
  if (storedValue === "restart-only") return "restart-only";
  return DEFAULT_APP_LOCK_BACKGROUND_TIMEOUT_MS;
}

export async function setAppLockBackgroundTimeout(
  userId: string,
  timeout: AppLockBackgroundTimeout,
) {
  await AsyncStorage.setItem(appLockTimeoutKey(userId), String(timeout));
  timeoutListeners.forEach((listener) => listener(userId, timeout));
}

export async function setAppLockEnabled(userId: string, enabled: boolean) {
  if (enabled) {
    await AsyncStorage.setItem(appLockKey(userId), "true");
  } else {
    await AsyncStorage.removeItem(appLockKey(userId));
  }

  listeners.forEach((listener) => listener(userId, enabled));
}

export async function clearAppLockPreference(userId: string) {
  await Promise.all([
    AsyncStorage.removeItem(appLockKey(userId)),
    AsyncStorage.removeItem(appLockTimeoutKey(userId)),
  ]);
  listeners.forEach((listener) => listener(userId, false));
  timeoutListeners.forEach((listener) => listener(userId, DEFAULT_APP_LOCK_BACKGROUND_TIMEOUT_MS));
}

export function subscribeToAppLockPreference(listener: AppLockListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function subscribeToAppLockBackgroundTimeout(listener: AppLockTimeoutListener) {
  timeoutListeners.add(listener);
  return () => {
    timeoutListeners.delete(listener);
  };
}
