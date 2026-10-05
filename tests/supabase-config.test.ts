import assert from "node:assert/strict";
import test from "node:test";
// @ts-ignore Node's native TypeScript test runner requires the explicit extension.
import { resolveSupabaseConfig } from "../utils/supabase-config.ts";

const local = {
  EXPO_PUBLIC_LOCAL_TEST_MODE: "true",
  EXPO_PUBLIC_SUPABASE_URL: "http://192.168.1.160:54321",
  EXPO_PUBLIC_SUPABASE_ANON_KEY: "synthetic-public-test-key",
};
test("normal configuration keeps the existing production endpoint", () => {
  assert.equal(resolveSupabaseConfig(false, {}).url, "https://finjqunyuyfxiesumuxk.supabase.co");
});
test("explicit development mode permits the Mac local address", () => {
  assert.equal(resolveSupabaseConfig(true, local).url, local.EXPO_PUBLIC_SUPABASE_URL);
});
test("release runtime refuses local mode", () => {
  assert.throws(() => resolveSupabaseConfig(false, local));
});
test("local mode rejects hosted endpoints and malformed connection settings", () => {
  for (const url of [
    "https://finjqunyuyfxiesumuxk.supabase.co",
    "http://8.8.8.8:54321",
    "http://192.168.1.160:80",
    "http://user:pass@192.168.1.160:54321",
    "http://192.168.1.160:54321/path",
    "http://192.168.1.160:54321?host=remote",
  ]) {
    assert.throws(() => resolveSupabaseConfig(true, { ...local, EXPO_PUBLIC_SUPABASE_URL: url }));
  }
  assert.throws(() => resolveSupabaseConfig(true, { EXPO_PUBLIC_LOCAL_TEST_MODE: "true" }));
});
test("recording mode remains loopback only", () => {
  const recording = {
    ...local,
    EXPO_PUBLIC_LOCAL_TEST_MODE: "false",
    EXPO_PUBLIC_RECORDING_MODE: "true",
  };
  assert.throws(() => resolveSupabaseConfig(true, recording));
  assert.equal(
    resolveSupabaseConfig(true, {
      ...recording,
      EXPO_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    }).recordingMode,
    true,
  );
});
