import { mkdir, mkdtemp, rm, writeFile, link, lstat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { createHash } from "node:crypto";
import { zipSync, unzipSync } from "fflate";
import { Diagnostic, buildProject } from "./project.mjs";

export function archive(files) {
  const input = Object.create(null);
  for (const [name, bytes] of [...files].sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0,
  ))
    input[name] = [
      new Uint8Array(bytes),
      { mtime: new Date(1980, 0, 1), os: 3, attrs: 0o100644 << 16 },
    ];
  return Buffer.from(zipSync(input, { level: 9 }));
}
export async function packageProject(cwd, cliVersion, signal) {
  const { api, manifest, output } = await buildProject(cwd, signal);
  const { files } = await api.validatePackage(output);
  const bytes = archive(files),
    digest = createHash("sha256").update(bytes).digest("hex");
  const artifacts = join(cwd, "artifacts");
  await mkdir(artifacts, { recursive: true });
  if ((await lstat(artifacts)).isSymbolicLink())
    throw new Diagnostic(
      "PLUGIN_PACKAGE",
      "artifacts cannot be a symlink.",
      artifacts,
    );
  const staging = await mkdtemp(join(cwd, ".lomi-package-"));
  const published = [];
  try {
    const extracted = join(staging, "verify");
    await mkdir(extracted);
    const roundtrip = unzipSync(bytes);
    for (const [name, data] of Object.entries(roundtrip)) {
      api.packagePath(name);
      await mkdir(dirname(join(extracted, name)), { recursive: true });
      await writeFile(join(extracted, name), data, { flag: "wx" });
      if (!files.get(name)?.equals(Buffer.from(data)))
        throw new Error(`Archive differs: ${name}`);
    }
    if (Object.keys(roundtrip).length !== files.size)
      throw new Error("Archive file count differs.");
    await api.validatePackage(extracted);
    const stem = `${manifest.id}-${manifest.version}`;
    const report = {
      schemaVersion: 1,
      id: manifest.id,
      version: manifest.version,
      cli: cliVersion,
      sdk: api.compatibility.sdk,
      sha256: digest,
      desktopTested: false,
      files: [...files].map(([path, value]) => ({
        path,
        bytes: value.length,
        sha256: createHash("sha256").update(value).digest("hex"),
      })),
    };
    const results = [
      [`${stem}.zip`, bytes],
      [`${stem}.sha256`, `${digest}  ${stem}.zip\n`],
      [`${stem}.validation.json`, `${JSON.stringify(report, null, 2)}\n`],
    ];
    for (const [name, data] of results) {
      const target = join(artifacts, name);
      try {
        await lstat(target);
        throw new Diagnostic(
          "PLUGIN_RELEASE_EXISTS",
          "This release already exists.",
          target,
          "Choose a new plugin version or explicitly move the existing artifacts.",
        );
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
      await writeFile(join(staging, name), data, { flag: "wx" });
    }
    signal?.throwIfAborted();
    for (const [name] of results) {
      const target = join(artifacts, name);
      await link(join(staging, name), target);
      published.push(target);
    }
    return { artifacts: published, sha256: digest, files: files.size };
  } catch (error) {
    for (const path of published) await rm(path);
    throw error;
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}
