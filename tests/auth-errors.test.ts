import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node verification requires extensions.
import { friendlyAuthError } from "../utils/auth-errors.ts";

test("weak password errors use calm, concise guidance", () => {
  assert.equal(
    friendlyAuthError({ message: "Password rejected", code: "weak_password" }),
    "Please choose a stronger password.",
  );
});

test("unrelated authentication errors keep their existing guidance", () => {
  assert.equal(
    friendlyAuthError({ message: "Invalid login credentials" }),
    "Incorrect email or password.",
  );
  assert.equal(
    friendlyAuthError({ message: "Network request failed" }),
    "FreightIQ could not connect. Check your connection and try again.",
  );
});
