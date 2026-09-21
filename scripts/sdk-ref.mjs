import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = JSON.parse(
  await readFile(new URL("../sdk-source.json", import.meta.url), "utf8"),
);
assert.equal(source.repository, "lomi-dev/plugin-sdk");
assert.match(source.ref, /^[0-9a-f]{40}$/);
const cli = JSON.parse(
  await readFile(
    new URL("../packages/cli/package.json", import.meta.url),
    "utf8",
  ),
);
assert.equal(source.version, cli.peerDependencies["@lomi-dev/plugin-sdk"]);
console.log(`ref=${source.ref}`);
