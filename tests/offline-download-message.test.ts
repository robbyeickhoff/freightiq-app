import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node strip-types uses explicit extensions.
import { offlineDownloadMessage } from "../utils/offline-download-message.ts";

test("offline errors stay readable and never expose Swift implementation details", () => {
  assert.equal(offlineDownloadMessage(new Error("DOWNLOAD: undefined reason (at ExpoModulesCore/Promise.swift:65)")), "Could not download this route. Check your connection and try again.");
  assert.equal(offlineDownloadMessage(new Error("OfflineRouteException: Not enough storage. (at FreightIQNavigation.swift:65)")), "Not enough storage.");
  assert.equal(offlineDownloadMessage({ message: "Offline map resources could not be downloaded." }), "Offline map resources could not be downloaded.");
  assert.equal(offlineDownloadMessage(null), "Could not download this route. Check your connection and try again.");
});
