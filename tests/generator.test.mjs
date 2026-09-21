import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generate } from "../packages/create-plugin/index.mjs";
import { archive } from "../packages/cli/src/package.mjs";
test("generator protects files and validates before publishing", async () => {
  const root = await mkdtemp(join(tmpdir(), "lomi-generator-"));
  const directory = join(root, "existing żółć");
  await mkdir(directory);
  await writeFile(join(directory, "keep.txt"), "original");
  const input = { directory, id: "example.test", name: "Test" };
  await assert.rejects(generate(input), /new or empty/);
  assert.equal(await readFile(join(directory, "keep.txt"), "utf8"), "original");
  for (const id of ["../bad", "invalid", "UPPER.name"])
    await assert.rejects(
      generate({ ...input, directory: join(root, "new"), id }),
    );
  assert.deepEqual(await readdir(root), ["existing żółć"]);
});
test("abort cleans staging and preserves a pre-existing empty directory", async () => {
  const directory = await mkdtemp(join(tmpdir(), "lomi-interrupted-"));
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    generate({
      directory,
      id: "example.test",
      name: "Test",
      signal: controller.signal,
    }),
  );
  assert.deepEqual(await readdir(directory), []);
});
test("all templates substitute quotes safely without installing or initializing git", async () => {
  for (const template of ["panel", "sidebar", "command", "theme"]) {
    const directory = await mkdtemp(join(tmpdir(), "lomi-template-"));
    await generate({
      directory,
      id: "example.test",
      name: 'Polska "żółć"',
      template,
    });
    const manifest = JSON.parse(
      await readFile(join(directory, "plugin.json"), "utf8"),
    );
    assert.equal(manifest.name, 'Polska "żółć"');
    const pkg = JSON.parse(
      await readFile(join(directory, "package.json"), "utf8"),
    );
    assert.equal(pkg.scripts.dev, undefined);
    assert.equal((await readdir(directory)).includes("node_modules"), false);
    assert.equal((await readdir(directory)).includes(".git"), false);
  }
});
test("ZIP is deterministic regardless of input order", () => {
  const files = [
    ["plugin.json", Buffer.from("{}")],
    ["assets/żółć.txt", Buffer.from("test")],
  ];
  assert.deepEqual(archive(new Map(files)), archive(new Map(files.reverse())));
});

test("generator JSON distinguishes argument and destination failures", async () => {
  const { spawnSync } = await import("node:child_process");
  const { fileURLToPath } = await import("node:url");
  const bin = fileURLToPath(
    new URL("../packages/create-plugin/index.mjs", import.meta.url),
  );
  const directory = await mkdtemp(join(tmpdir(), "lomi-exit-"));
  await writeFile(join(directory, "keep"), "keep");
  const invalid = spawnSync(process.execPath, [bin, directory, "--json"], {
    encoding: "utf8",
  });
  assert.equal(invalid.status, 2);
  assert.equal(
    JSON.parse(invalid.stdout).diagnostics[0].code,
    "GENERATOR_INPUT",
  );
  const occupied = spawnSync(
    process.execPath,
    [bin, directory, "--id", "example.test", "--name", "Test", "--json"],
    { encoding: "utf8" },
  );
  assert.equal(occupied.status, 1);
  assert.equal(
    JSON.parse(occupied.stdout).diagnostics[0].code,
    "GENERATOR_FAILURE",
  );
});
