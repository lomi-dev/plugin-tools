import { mkdir, readFile, copyFile, writeFile } from "node:fs/promises";
import { resolve, join, basename } from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
export const root = resolve(import.meta.dirname, "..");
export function run(command, args, cwd, options = {}) {
  const cli = command === "pnpm" ? process.env.npm_execpath : undefined;
  const env = { ...process.env };
  delete env.NODE_PATH;
  const result = spawnSync(
    cli ? process.execPath : command,
    cli ? [cli, ...args] : args,
    {
      cwd,
      env,
      encoding: "utf8",
      timeout: 180000,
      maxBuffer: 8 * 1024 * 1024,
      ...options,
    },
  );
  if (result.status !== 0)
    throw new Error(
      `${command} ${args.join(" ")} (exit ${result.status})\n${result.stdout}\n${result.stderr}\n${result.error ?? ""}`,
    );
  return result.stdout;
}
export async function pack() {
  const output = join(root, "artifacts");
  await mkdir(output, { recursive: true });
  let sdk;
  if (process.env.LOMI_SDK_TARBALL) {
    sdk = join(output, "sdk.tgz");
    await copyFile(resolve(process.env.LOMI_SDK_TARBALL), sdk);
  } else {
    const source = resolve(
      process.env.LOMI_SDK_REPO ?? join(root, "../plugin-sdk"),
    );
    const metadata = JSON.parse(
      await readFile(join(source, "package.json"), "utf8"),
    );
    if (metadata.name !== "@lomi-dev/plugin-sdk")
      throw new Error(
        "LOMI_SDK_REPO must point to the standalone plugin-sdk repository.",
      );
    run("pnpm", ["pack", "--pack-destination", output], source);
    sdk = join(
      output,
      `${metadata.name.replace("@", "").replace("/", "-")}-${metadata.version}.tgz`,
    );
  }
  const result = { sdk };
  for (const [key, folder] of [
    ["cli", "cli"],
    ["generator", "create-plugin"],
  ]) {
    const directory = join(root, "packages", folder);
    run("pnpm", ["pack", "--pack-destination", output], directory);
    const metadata = JSON.parse(
      await readFile(join(directory, "package.json"), "utf8"),
    );
    result[key] = join(
      output,
      `${metadata.name.replace("@", "").replace("/", "-")}-${metadata.version}.tgz`,
    );
  }
  const archives = [];
  for (const [kind, path] of Object.entries(result)) {
    const bytes = await readFile(path);
    archives.push({
      kind,
      file: basename(path),
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      integrity: `sha512-${createHash("sha512").update(bytes).digest("base64")}`,
    });
  }
  await writeFile(
    join(output, "candidate-artifacts.json"),
    JSON.stringify(
      {
        schemaVersion: 1,
        sourceCommit: run("git", ["rev-parse", "HEAD"], root).trim(),
        sdkSource: process.env.LOMI_SDK_TARBALL
          ? "provided-archive"
          : JSON.parse(await readFile(join(root, "sdk-source.json"), "utf8")),
        archives,
      },
      null,
      2,
    ) + "\n",
  );
  return result;
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  console.log(JSON.stringify(await pack(), null, 2));
