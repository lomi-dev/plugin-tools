import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  readFile,
  writeFile,
  cp,
  realpath,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { run, root } from "./pack.mjs";

const metadata = JSON.parse(
  await readFile(join(root, "packages/create-plugin/package.json"), "utf8"),
);
const registry = process.argv.includes("--registry");
const cliMetadata = JSON.parse(
  await readFile(join(root, "packages/cli/package.json"), "utf8"),
);
const sdkSource = JSON.parse(
  await readFile(join(root, "sdk-source.json"), "utf8"),
);
const generatorURL = `https://github.com/lomi-dev/plugin-tools/releases/download/v${metadata.version}/create-lomi-plugin-${metadata.version}.tgz`;
const generatorSpec = registry ? metadata.version : generatorURL;
const directory = await realpath(
  await mkdtemp(join(tmpdir(), "lomi-public-release-")),
);
process.env.npm_config_store_dir = join(directory, "store");
process.env.npm_config_cache = join(directory, "cache");
process.env.npm_config_registry = "https://registry.npmjs.org";
const registryPackages = [];
if (registry) {
  for (const [name, version] of [
    [metadata.name, metadata.version],
    [cliMetadata.name, cliMetadata.version],
    ["@lomi-dev/plugin-sdk", sdkSource.version],
  ]) {
    const dist = JSON.parse(
      run("pnpm", ["view", `${name}@${version}`, "dist", "--json"], root),
    );
    assert.match(dist.integrity, /^sha512-/);
    assert.ok(dist.tarball.startsWith("https://registry.npmjs.org/"));
    registryPackages.push({ name, version, ...dist });
  }
}
const runner = join(directory, "runner");
await mkdir(runner);
await writeFile(
  join(runner, "package.json"),
  JSON.stringify(
    {
      private: true,
      packageManager: "pnpm@11.25.0",
      dependencies: { "create-lomi-plugin": generatorSpec },
    },
    null,
    2,
  ),
);
console.log(`Installing public generator ${generatorSpec}`);
run("pnpm", ["install", "--ignore-scripts"], runner);
const results = [];
for (const template of [
  "panel",
  "sidebar",
  "command",
  "theme",
  "workspace-info",
]) {
  const project = join(directory, template);
  if (template === "workspace-info")
    await cp(join(root, "examples/workspace-info"), project, {
      recursive: true,
      filter: (path) =>
        !path
          .split(/[\\/]/)
          .some((part) =>
            ["node_modules", "package", "artifacts"].includes(part),
          ),
    });
  else
    run(
      "pnpm",
      [
        "exec",
        "create-lomi-plugin",
        project,
        "--id",
        `example.${template}`,
        "--name",
        `Public ${template}`,
        "--template",
        template,
        "--json",
      ],
      runner,
    );
  const pkg = JSON.parse(await readFile(join(project, "package.json"), "utf8"));
  for (const [name, spec] of Object.entries({
    ...pkg.dependencies,
    ...pkg.devDependencies,
  })) {
    assert.doesNotMatch(spec, /^(file:|link:|workspace:)/, name);
  }
  if (registry) {
    assert.equal(
      pkg.devDependencies["@lomi-dev/plugin-sdk"],
      sdkSource.version,
    );
    assert.equal(
      pkg.devDependencies["@lomi-dev/plugin-cli"],
      cliMetadata.version,
    );
  }
  console.log(`Testing public ${template} without dependency overrides`);
  run("pnpm", ["install", "--ignore-scripts"], project);
  run("pnpm", ["install", "--frozen-lockfile", "--ignore-scripts"], project);
  for (const command of ["check", "test", "build", "doctor", "package"]) {
    await writeFile(
      join(directory, `${template}-${command}.log`),
      run("pnpm", ["run", command], project),
    );
  }
  results.push({
    template,
    sdk: pkg.devDependencies["@lomi-dev/plugin-sdk"],
    cli: pkg.devDependencies["@lomi-dev/plugin-cli"],
    lockSHA256: createHash("sha256")
      .update(await readFile(join(project, "pnpm-lock.yaml")))
      .digest("hex"),
    checks: [
      "public-install",
      "frozen-install",
      "check",
      "test",
      "build",
      "doctor",
      "package",
    ],
  });
}
await mkdir(join(root, "artifacts"), { recursive: true });
const report = {
  schemaVersion: 1,
  date: new Date().toISOString(),
  distribution: registry ? "npm" : "github-release",
  generatorSpec,
  registryPackages,
  platform: `${process.platform}-${process.arch}`,
  directory,
  results,
  desktopTested: false,
};
await writeFile(
  join(
    root,
    registry
      ? "artifacts/registry-validation.json"
      : "artifacts/release-validation.json",
  ),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
