import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { run, root } from "./pack.mjs";
async function visit(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    if (
      ["node_modules", "artifacts", ".git", "templates", "examples"].includes(
        entry.name,
      )
    )
      continue;
    const file = join(path, entry.name);
    if (entry.isDirectory()) await visit(file);
    else if (entry.name.endsWith(".mjs"))
      run(process.execPath, ["--check", file], root);
  }
}
await visit(root);
console.log(
  "Tool JavaScript syntax passed. Public types are checked in isolated author projects.",
);
