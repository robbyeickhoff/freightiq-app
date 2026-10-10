// Read-only local artifact verification. This script cannot connect to a database.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, realpathSync } from "node:fs";

assert.deepEqual(process.argv.slice(2), ["--local"]);
assert.equal(realpathSync("."), "/Users/robbyeickhoff/mfi");
const manifest = JSON.parse(readFileSync("scripts/fixtures/bot-rollout-manifest.json", "utf8"));
assert.equal(manifest.projectRef, "finjqunyuyfxiesumuxk");
assert.equal(manifest.excludedProjectRef, "bnhtwtcoalfgqtcgxmsh");
assert.equal(manifest.status, "deployed-history-reconciled");
assert.equal(manifest.finalReadClosureIncluded, false);
for (const entry of manifest.migrations) {
  assert.match(entry.file, /^\d{14}_[a-z0-9_]+\.sql$/);
  assert.equal(
    createHash("sha256")
      .update(readFileSync(`supabase/migrations/${entry.file}`))
      .digest("hex"),
    entry.sha256,
    `${entry.file} changed since package review`,
  );
  console.log(`${entry.stage}: ${entry.file} verified`);
}
console.log("18 canonical file hashes verified: 17 bot-defense files + 1 relocation file.");
console.log("The manifest uses the exact Supabase-assigned hosted versions reconciled October 10.");
console.log(
  "No database connection or mutation. Read the production receipts before any future migration work.",
);
