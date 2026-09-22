import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

export const generatorSource = JSON.parse(
  await readFile(new URL("../generator-source.json", import.meta.url), "utf8"),
);
assert.equal(generatorSource.name, "create-lomi-plugin");
assert.match(generatorSource.version, /^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/);
assert.match(generatorSource.integrity, /^sha512-[A-Za-z0-9+/]{86}==$/);
