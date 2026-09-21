import {
  mkdtemp,
  writeFile,
  readFile,
  mkdir,
  cp,
  readdir,
  symlink,
  realpath,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { pack, run, root } from "./pack.mjs";
const packed = await pack();
const directory = await realpath(
  await mkdtemp(join(tmpdir(), "lomi-archives-")),
);
const archives = {};
await mkdir(join(directory, "archives"));
for (const [name, path] of Object.entries(packed)) {
  archives[name] = join(directory, "archives", `${name}.tgz`);
  await cp(path, archives[name]);
}
process.env.npm_config_store_dir = join(directory, "store");
process.env.npm_config_cache = join(directory, "npm-cache");
console.log(`Isolated author projects with a fresh store: ${directory}`);
const runner = join(directory, "generator");
await mkdir(runner);
await writeFile(
  join(runner, "package.json"),
  JSON.stringify({
    private: true,
    dependencies: { "create-lomi-plugin": `file:${archives.generator}` },
  }),
);
run("pnpm", ["install", "--ignore-scripts"], runner);
const results = [];
for (const template of [
  "panel",
  "sidebar",
  "command",
  "theme",
  "workspace-info",
]) {
  const project = join(directory, `autor żółć ${template}`);
  if (template === "workspace-info")
    await cp(join(root, "examples/workspace-info"), project, {
      recursive: true,
    });
  else {
    run(
      "pnpm",
      [
        "exec",
        "create-lomi-plugin",
        project,
        "--id",
        `example.${template}`,
        "--name",
        `Żółć ${template} "test"`,
        "--template",
        template,
        "--json",
      ],
      runner,
    );
  }
  const pkgPath = join(project, "package.json");
  run(
    "pnpm",
    [
      "add",
      "-D",
      `@lomi-dev/plugin-sdk@file:${archives.sdk}`,
      `@lomi-dev/plugin-cli@file:${archives.cli}`,
      "--ignore-scripts",
    ],
    project,
  );
  if (template !== "theme") {
    await writeFile(
      join(project, "src/contract-types.ts"),
      `import { defineConfig } from '@lomi-dev/plugin-cli'; import { createTestHost } from '@lomi-dev/plugin-cli/testing'; import type { PluginManifest } from '@lomi-dev/plugin-sdk'; defineConfig({ assets: ['LICENSE'] }); declare const manifest: PluginManifest; const host = await createTestHost(manifest); host.context.snapshot(); host.dispose();\n// @ts-expect-error Configuration keys are closed.\ndefineConfig({ unknown: true });\n`,
    );
  }
  const checkJSON = JSON.parse(
    run("pnpm", ["exec", "lomi-plugin", "check", "--json"], project),
  );
  assert.equal(checkJSON.schemaVersion, 1);
  assert.equal(checkJSON.result.bundleChecked, false);
  for (const command of ["check", "test", "build", "package", "doctor"]) {
    const output = run("pnpm", [command], project);
    await writeFile(join(directory, `${template}-${command}.log`), output);
  }
  const artifact = join(project, "artifacts", `example.${template}-0.1.0.zip`);
  const before = await readFile(artifact);
  assert.throws(
    () => run("pnpm", ["package"], project),
    /PLUGIN_RELEASE_EXISTS/,
  );
  assert.deepEqual(await readFile(artifact), before);
  const goodManifest = await readFile(join(project, "plugin.json"), "utf8");
  await writeFile(
    join(project, "plugin.json"),
    goodManifest.replace('"hostApi": 1', '"hostApi": 2'),
  );
  assert.throws(() => run("pnpm", ["build"], project), /PLUGIN_MANIFEST/);
  assert.equal(
    await readFile(join(project, "package/plugin.json"), "utf8"),
    goodManifest,
  );
  await writeFile(join(project, "plugin.json"), goodManifest);
  results.push({
    template,
    sha256: createHash("sha256").update(before).digest("hex"),
    checks: [
      "check",
      "test",
      "build",
      "package",
      "doctor",
      "no-overwrite",
      "failed-build-preservation",
    ],
  });
}
const panel = join(directory, "autor żółć panel");
run("pnpm", ["add", "mitt@3.0.1", "--ignore-scripts"], panel);
const sourcePath = join(panel, "src/index.tsx");
const original = await readFile(sourcePath, "utf8");
await writeFile(
  sourcePath,
  original +
    '\nimport mitt from "mitt";\nexport function dependencyProbe() { const bus = mitt(); let value = 0; bus.on("tick", () => value++); bus.emit("tick"); return value; }\nexport const lazyProbe = () => import("./details");\n',
);
await writeFile(join(panel, "src/details.ts"), "export const value = 42;\n");
run("pnpm", ["build"], panel);
await writeFile(
  join(panel, "probe.mjs"),
  `import assert from 'node:assert/strict'; import { readFile } from 'node:fs/promises'; import { createTestHost } from '@lomi-dev/plugin-cli/testing'; const host = await createTestHost(JSON.parse(await readFile('plugin.json', 'utf8'))); try { const plugin = await import('./package/dist/index.js'); assert.equal(plugin.dependencyProbe(), 1); assert.equal((await plugin.lazyProbe()).value, 42); } finally { host.dispose(); }`,
);
run("node", ["probe.mjs"], panel);
const offline = join(directory, "offline-package");
await cp(join(panel, "package"), offline, { recursive: true });
await writeFile(join(offline, "package.json"), '{"type":"module"}');
await writeFile(
  join(panel, "offline-probe.mjs"),
  `import assert from 'node:assert/strict'; import { readFile } from 'node:fs/promises'; import { pathToFileURL } from 'node:url'; import { createTestHost } from '@lomi-dev/plugin-cli/testing'; const host = await createTestHost(JSON.parse(await readFile('plugin.json', 'utf8'))); try { const plugin = await import(pathToFileURL(${JSON.stringify(join(offline, "dist/index.js"))})); assert.equal(plugin.dependencyProbe(), 1); assert.equal((await plugin.lazyProbe()).value, 42); } finally { host.dispose(); }`,
);
run("node", ["offline-probe.mjs"], panel);
const metadata = JSON.parse(
  await readFile(join(panel, "package.json"), "utf8"),
);
metadata.devDependencies["@simplebench/plugin-sdk"] = `file:${archives.sdk}`;
await writeFile(join(panel, "package.json"), JSON.stringify(metadata));
run("pnpm", ["install", "--no-frozen-lockfile", "--ignore-scripts"], panel);
run("pnpm", ["install", "--frozen-lockfile", "--ignore-scripts"], panel);
await writeFile(
  sourcePath,
  original +
    '\nexport { HostContext as oldContext } from "@simplebench/plugin-sdk";\nexport { HostContext as newContext } from "@lomi-dev/plugin-sdk";\nexport { useState as sharedUseState } from "react";\n',
);
run("pnpm", ["build"], panel);
await writeFile(
  join(panel, "identity-probe.mjs"),
  `import assert from 'node:assert/strict'; import { readFile } from 'node:fs/promises'; import { createTestHost } from '@lomi-dev/plugin-cli/testing'; const host = await createTestHost(JSON.parse(await readFile('plugin.json', 'utf8'))); try { const plugin = await import('./package/dist/index.js'); const runtime = globalThis[Symbol.for('simplebench.plugin-api.v1')]; assert.equal(plugin.oldContext, runtime.sdk.HostContext); assert.equal(plugin.newContext, runtime.sdk.HostContext); assert.equal(plugin.sharedUseState, runtime.react.useState); } finally { host.dispose(); }`,
);
run("node", ["identity-probe.mjs"], panel);
const map = JSON.parse(
  await readFile(join(panel, "package/dist/index.js.map"), "utf8"),
);
assert.equal(map.sourcesContent, undefined);
await writeFile(
  join(panel, "interrupt-probe.mjs"),
  `import assert from 'node:assert/strict'; import { readFile } from 'node:fs/promises'; import { buildPlugin } from '@lomi-dev/plugin-sdk/build'; const before = await readFile('package/dist/index.js'); const controller = new AbortController(); const pending = buildPlugin({ assets: ['view.css', 'LICENSE'], signal: controller.signal }); setTimeout(() => controller.abort(), 1); await assert.rejects(pending); assert.deepEqual(await readFile('package/dist/index.js'), before);`,
);
run("node", ["interrupt-probe.mjs"], panel);
const built = await readFile(join(panel, "package/dist/index.js"));
assert.doesNotMatch(built.toString(), /from ["']mitt["']/);
for (const bad of [
  'import fs from "node:fs"; console.log(fs);',
  "export const bad = (path: string) => import(path);",
  'import { createRoot } from "react-dom/unsupported"; console.log(createRoot);',
]) {
  await writeFile(sourcePath, original + "\n" + bad);
  assert.throws(() => run("pnpm", ["build"], panel));
  assert.deepEqual(await readFile(join(panel, "package/dist/index.js")), built);
}
await writeFile(sourcePath, original);
await symlink(join(panel, "LICENSE"), join(panel, "linked-license"));
await writeFile(
  join(panel, "lomi-plugin.config.mjs"),
  'export default { assets: ["linked-license", "view.css"] };',
);
assert.throws(() => run("pnpm", ["check"], panel), /symbolic links/);
const report = {
  schemaVersion: 1,
  date: new Date().toISOString(),
  platform: `${process.platform}-${process.arch}`,
  node: process.version,
  archives,
  directory,
  desktopTested: false,
  results,
  regressions: [
    "registry-dependency",
    "literal-dynamic-import",
    "node-import-rejection",
    "nonliteral-import-rejection",
    "react-subpath-rejection",
    "symlink-rejection",
    "offline-package-import",
    "old-new-context-identity",
    "shared-react-identity",
    "source-maps-without-source",
    "interrupted-build-preservation",
    "json-output",
  ],
};
await writeFile(
  join(root, "artifacts/archive-validation.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
