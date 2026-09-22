import test from "node:test";
import assert from "node:assert/strict";
import { archive } from "../packages/cli/src/package.mjs";

test("ZIP is deterministic regardless of input order", () => {
  const files = [
    ["plugin.json", Buffer.from("{}")],
    ["assets/żółć.txt", Buffer.from("test")],
  ];
  assert.deepEqual(archive(new Map(files)), archive(new Map(files.reverse())));
});
