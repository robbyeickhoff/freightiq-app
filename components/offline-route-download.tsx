import Constants from "expo-constants";
import { requireOptionalNativeModule } from "expo";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { AppState, Platform, Text, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { useAppTheme } from "@/context/theme-context";
import { containsOfflineStop, offlineRouteBounds, type OfflineRouteBounds } from "@/utils/offline-route-coverage";
import { calculateRoutePlan } from "@/utils/route-plan";
import type { TodayRouteStop } from "@/utils/todays-route";

type OfflineNavigation = {
  addListener(event: "onOfflineDownloadProgress", listener: (event: { fraction: number }) => void): { remove(): void };
  offlineRouteCoverage(): Promise<OfflineRouteBounds | null>;
  downloadOfflineRoute(bounds: OfflineRouteBounds): Promise<void>;
  cancelOfflineRouteDownload(): Promise<void>;
  removeOfflineRoute(): Promise<void>;
};

const navigation = Platform.OS === "ios" ? requireOptionalNativeModule<OfflineNavigation>("FreightIQNavigation") : null;

export function OfflineRouteDownload({ stops, enabled }: { stops: TodayRouteStop[]; enabled: boolean }) {
  if (!navigation?.offlineRouteCoverage) return null;
  return <OfflineRouteControl native={navigation} stops={stops} enabled={enabled} />;
}

function OfflineRouteControl({ native, stops, enabled }: {
  native: OfflineNavigation;
  stops: TodayRouteStop[];
  enabled: boolean;
}) {
  const { colors } = useAppTheme();
  const [coverage, setCoverage] = useState<OfflineRouteBounds | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const operation = useRef<AbortController | null>(null);
  const ready = enabled && stops.length > 0 && coverage && stops.every((stop) => containsOfflineStop(coverage, { latitude: stop.lat, longitude: stop.lng }));
  const canDownload = enabled && stops.length > 0;

  useEffect(() => {
    let mounted = true;
    const refresh = () => {
      void native.offlineRouteCoverage().then((value) => {
        if (mounted && !operation.current) setCoverage(value);
      }).catch(() => {
        if (mounted && !operation.current) setCoverage(null);
      });
    };
    refresh();
    const appState = AppState.addEventListener("change", (state) => { if (state === "active") refresh(); });
    const listener = native.addListener("onOfflineDownloadProgress", ({ fraction }) => {
      if (operation.current && Number.isFinite(fraction)) setProgress(Math.min(99, Math.round(fraction * 100)));
    });
    return () => {
      mounted = false;
      appState.remove();
      listener.remove();
      if (operation.current) {
        operation.current.abort();
        void native.cancelOfflineRouteDownload().catch(() => {});
      }
    };
  }, [native]);

  async function download() {
    if (operation.current || busy || !canDownload) return;
    const controller = new AbortController();
    operation.current = controller;
    setProgress(0);
    setMessage("");
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 30_000);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) throw new Error("Allow location access to prepare your route.");
      if (controller.signal.aborted) throw new Error("Route preparation cancelled.");
      const location = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener("abort", () => reject(new Error("Route preparation cancelled.")), { once: true });
        }),
      ]);
      const plan = await calculateRoutePlan(location.coords, stops, Constants.expoConfig?.extra?.mapboxPublicToken ?? "", controller.signal);
      if (controller.signal.aborted) throw new Error("Route preparation cancelled.");
      const bounds = offlineRouteBounds([location.coords, ...plan.coordinates, ...stops.map((stop) => ({
        latitude: stop.lat, longitude: stop.lng,
      }))]);
      if (!bounds) throw new Error("This route covers too much area for one offline download.");
      clearTimeout(timeout);
      await native.downloadOfflineRoute(bounds);
      const installed = await native.offlineRouteCoverage();
      setCoverage(installed);
      if (!installed) throw new Error("Offline download could not be verified. Please try again.");
    } catch (error) {
      if (timedOut) setMessage("Route preparation timed out. Please try again.");
      else if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : "Could not download. Please try again.");
    } finally {
      clearTimeout(timeout);
      operation.current = null;
      setProgress(null);
      setCancelling(false);
    }
  }

  async function remove() {
    setBusy(true);
    setMessage("");
    try {
      await native.removeOfflineRoute();
      setCoverage(null);
    } catch {
      setMessage("Could not remove the download. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!canDownload && !coverage && progress === null && !message) return null;
  const status = progress !== null
    ? cancelling ? "Cancelling…" : progress === 0 ? "Preparing…" : `Downloading · ${progress}%`
    : ready ? "Ready for Offline Use" : coverage ? "Update available" : "Not downloaded";
  return <View style={{ marginHorizontal: 16, marginTop: 8, paddingLeft: 12, paddingRight: 4, borderRadius: 12, backgroundColor: colors.surface }}>
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 8 }}>
      <AppIcon name={ready && progress === null ? "complete" : "download"} size={21}
        color={ready && progress === null ? colors.success : colors.textSecondary} />
      <View style={{ flex: 1, minWidth: 96, paddingVertical: 6 }}>
        <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>Offline Route</Text>
        <Text style={{ color: ready && progress === null ? colors.success : colors.textSecondary }} accessibilityLiveRegion="polite">
          {status}
        </Text>
      </View>
      {progress !== null ? (
        <AppButton size="compact" variant="tertiary" disabled={cancelling} onPress={() => {
          setCancelling(true);
          operation.current?.abort();
          void native.cancelOfflineRouteDownload().catch(() => {});
        }}>Cancel</AppButton>
      ) : <>
        {canDownload && !ready ? <AppButton size="compact" variant="tertiary" disabled={busy}
          accessibilityLabel={coverage ? "Update offline download" : "Download for offline use"} onPress={() => void download()}>
          {coverage ? "Update" : "Download"}
        </AppButton> : null}
        {coverage ? <AppButton size="icon" variant="tertiary" disabled={busy} accessibilityLabel="Remove offline download" onPress={() => void remove()}>
          <AppIcon name="delete" size={18} color={busy ? colors.disabled : colors.danger} />
        </AppButton> : null}
      </>}
    </View>
    {message ? <Text accessibilityRole="alert" style={{ color: colors.textSecondary, paddingBottom: 8 }}>{message}</Text> : null}
  </View>;
}
