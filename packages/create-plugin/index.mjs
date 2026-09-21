#!/usr/bin/env node
import { parseArgs } from "node:util";
import { createInterface } from "node:readline/promises";
import {
  cp,
  lstat,
  readdir,
  mkdtemp,
  mkdir,
  readFile,
  writeFile,
  rm,
  link,
} from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const inputError = (message) =>
  Object.assign(new Error(message), { code: "GENERATOR_INPUT", exitCode: 2 });
const templates = ["panel", "sidebar", "command", "theme"];
export async function generate({
  directory,
  id,
  name,
  template = "panel",
  signal,
}) {
  if (
    typeof id !== "string" ||
    id.length > 100 ||
    !/^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+$/.test(id)
  )
    throw inputError(
      "Use --id author.name with lowercase ASCII letters, digits and hyphens.",
    );
  if (
    typeof name !== "string" ||
    !name.trim() ||
    name.length > 160 ||
    /[\x00-\x1f]/.test(name)
  )
    throw inputError("Use a nonempty --name of at most 160 characters.");
  if (!templates.includes(template))
    throw inputError("Use --template panel, sidebar, command or theme.");
  const target = resolve(directory);
  let existing = false,
    createdTarget = false;
  try {
    const stat = await lstat(target);
    if (
      stat.isSymbolicLink() ||
      !stat.isDirectory() ||
      (await readdir(target)).length
    )
      throw new Error("Destination must be a new or empty real directory.");
    existing = true;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  await mkdir(dirname(target), { recursive: true });
  const staging = await mkdtemp(join(dirname(target), ".lomi-create-"));
  const owned = [];
  try {
    const source = new URL(`./templates/${template}/`, import.meta.url);
    await cp(source, staging, { recursive: true });
    async function substitute(path) {
      for (const item of await readdir(path, { withFileTypes: true })) {
        const file = join(path, item.name);
        if (item.isDirectory()) await substitute(file);
        else {
          const text = await readFile(file, "utf8");
          await writeFile(
            file,
            text.replace(
              /__ID__|__NAME_JSON__|__NPM_NAME__/g,
              (token) =>
                ({
                  __ID__: id,
                  __NAME_JSON__: JSON.stringify(name),
                  __NPM_NAME__: id.replaceAll(".", "-"),
                })[token],
            ),
          );
        }
      }
    }
    await substitute(staging);
    signal?.throwIfAborted();
    if (!existing) {
      // Reserve the destination without replacing a directory created concurrently.
      await mkdir(target);
      createdTarget = true;
    }
    async function publish(from, to) {
      for (const item of await readdir(from, { withFileTypes: true })) {
        signal?.throwIfAborted();
        const src = join(from, item.name),
          dst = join(to, item.name);
        if (item.isDirectory()) {
          await mkdir(dst);
          owned.push([dst, true]);
          await publish(src, dst);
        } else {
          await link(src, dst);
          owned.push([dst, false]);
        }
      }
    }
    await publish(staging, target);
    return target;
  } catch (error) {
    for (const [path, directory] of owned.reverse()) {
      try {
        if (directory) await (await import("node:fs/promises")).rmdir(path);
        else await rm(path);
      } catch {}
    }
    // Never recursively remove the user's destination, including concurrent files.
    if (createdTarget) {
      try {
        await (await import("node:fs/promises")).rmdir(target);
      } catch {}
    }
    throw error;
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const controller = new AbortController();
  const abort = () => controller.abort(new Error("Generation interrupted."));
  process.once("SIGINT", abort);
  process.once("SIGTERM", abort);
  let json = process.argv.includes("--json");
  try {
    const { values, positionals } = parseArgs({
      options: {
        id: { type: "string" },
        name: { type: "string" },
        template: { type: "string" },
        json: { type: "boolean" },
        help: { type: "boolean", short: "h" },
      },
      allowPositionals: true,
    });
    json = values.json;
    if (values.help)
      console.log(
        'create-lomi-plugin <directory> [--id author.name --name "Display name" --template panel|sidebar|command|theme] [--json]\nWithout a terminal, --id and --name are required. No dependencies are installed.',
      );
    else {
      if (positionals.length !== 1)
        throw inputError("Provide exactly one destination directory.");
      if (
        process.stdin.isTTY &&
        !json &&
        (!values.id || !values.name || !values.template)
      ) {
        const prompt = createInterface({
          input: process.stdin,
          output: process.stderr,
        });
        try {
          values.name ??= await prompt.question("Display name: ", {
            signal: controller.signal,
          });
          values.id ??= await prompt.question("Plugin ID (author.name): ", {
            signal: controller.signal,
          });
          values.template ??=
            (await prompt.question(
              "Template (panel/sidebar/command/theme) [panel]: ",
              { signal: controller.signal },
            )) || "panel";
        } finally {
          prompt.close();
        }
      }
      const directory = await generate({
        directory: positionals[0],
        ...values,
        signal: controller.signal,
      });
      if (json)
        console.log(JSON.stringify({ schemaVersion: 1, ok: true, directory }));
      else
        console.log(
          `Created ${directory}\nOpen this directory, then run:\npnpm install\npnpm check\npnpm test\npnpm build\nImport package/ in Settings > Plugins.\npnpm package\nM1 has no dev command. Candidate packages require the local archive instructions until publication.`,
        );
    }
  } catch (error) {
    const exitCode =
      error.exitCode ?? (error.code?.startsWith("ERR_PARSE_ARGS") ? 2 : 1);
    const code = exitCode === 2 ? "GENERATOR_INPUT" : "GENERATOR_FAILURE";
    if (json)
      console.log(
        JSON.stringify({
          schemaVersion: 1,
          ok: false,
          diagnostics: [
            {
              code,
              file: error.path ?? "",
              message: error.message,
              hint: "Run create-lomi-plugin --help. Existing files are preserved.",
            },
          ],
        }),
      );
    else console.error(`${code}: ${error.message}`);
    process.exitCode = exitCode;
  } finally {
    process.removeListener("SIGINT", abort);
    process.removeListener("SIGTERM", abort);
  }
}
