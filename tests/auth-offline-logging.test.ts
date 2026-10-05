import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { _request } = require("../node_modules/@supabase/auth-js/dist/main/lib/fetch.js");

test("recognized offline failures still reject as retryable without duplicate console errors", async () => {
  const logged: unknown[] = [];
  const original = console.error;
  console.error = (...args) => {
    logged.push(args);
  };
  try {
    for (const message of [
      "fetch failed: UnexpectedException: The Internet connection appears to be offline. (at ExpoModulesCore/Promise.swift:56)",
      "Error: fetch failed: java.net.ConnectException: Failed to connect to /192.168.1.160:54321",
      "Failed to fetch",
      "Network request failed",
      "Load failed",
    ]) {
      await assert.rejects(
        _request(
          async () => {
            throw new Error(message);
          },
          "GET",
          "http://test.invalid",
        ),
        (error: any) =>
          error.name === "AuthRetryableFetchError" &&
          error.status === 0 &&
          error.message === message,
      );
    }
    assert.equal(logged.length, 0);
    await assert.rejects(
      _request(
        async () => {
          throw new Error("Unexpected implementation bug");
        },
        "GET",
        "http://test.invalid",
      ),
    );
    assert.equal(logged.length, 1, "Unexpected failures remain logged");
  } finally {
    console.error = original;
  }
});

test("auth HTTP refusal is not converted into an offline success", async () => {
  await assert.rejects(
    _request(
      async () =>
        new Response(
          JSON.stringify({ message: "Invalid credentials", error_code: "invalid_credentials" }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        ),
      "GET",
      "http://test.invalid",
    ),
    (error: any) => error.name === "AuthApiError" && error.status === 401,
  );
});
