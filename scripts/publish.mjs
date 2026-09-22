import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { root, run } from "./pack.mjs";

const report = JSON.parse(
  await readFile(join(root, "artifacts/candidate-artifacts.json"), "utf8"),
);
assert.equal(report.sourceCommit, process.env.GITHUB_SHA);
const paths = [];
for (const [kind, folder] of [["cli", "cli"]]) {
  const metadata = JSON.parse(
    await readFile(join(root, "packages", folder, "package.json"), "utf8"),
  );
  assert.match(
    metadata.version,
    /^\d+\.\d+\.\d+-[a-zA-Z0-9.-]+$/,
    "Only qualified prereleases use this workflow.",
  );
  const file = `${metadata.name.replace("@", "").replace("/", "-")}-${metadata.version}.tgz`;
  const entry = report.archives.find((value) => value.kind === kind);
  assert.equal(entry.file, file);
  const path = join(root, "artifacts", file);
  const bytes = await readFile(path);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), entry.sha256);
  assert.equal(
    `sha512-${createHash("sha512").update(bytes).digest("base64")}`,
    entry.integrity,
  );
  paths.push(path);
}
for (const path of paths) {
  console.log(
    run(
      "npm",
      [
        "publish",
        path,
        "--access",
        "public",
        "--tag",
        "next",
        "--provenance",
        ...(process.argv.includes("--dry-run") ? ["--dry-run"] : []),
      ],
      root,
    ),
  );
}
