#!/usr/bin/env node
import { parseArgs } from "node:util";
import { readFile } from "node:fs/promises";
import { Diagnostic, project, buildProject } from "./project.mjs";
import { packageProject } from "./package.mjs";
import { doctor } from "./doctor.mjs";
const version = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
).version;
let json = process.argv.includes("--json");
let command;
const controller = new AbortController();
const interrupt = () =>
  controller.abort(
    new Diagnostic(
      "CLI_INTERRUPTED",
      "Command interrupted.",
      "",
      "The previous package and releases are preserved.",
    ),
  );
process.once("SIGINT", interrupt);
process.once("SIGTERM", interrupt);
try {
  let args;
  try {
    args = parseArgs({
      options: {
        json: { type: "boolean" },
        app: { type: "string" },
        help: { type: "boolean", short: "h" },
        version: { type: "boolean", short: "v" },
      },
      allowPositionals: true,
    });
  } catch (error) {
    throw new Diagnostic(
      "CLI_ARGUMENT",
      error.message,
      "",
      "Run lomi-plugin --help.",
      2,
    );
  }
  json = args.values.json;
  command = args.positionals[0];
  if (args.values.version) console.log(version);
  else if (args.values.help)
    console.log(
      "lomi-plugin <check|build|package|doctor> [--json]\nlomi-plugin doctor [--app <path>]\nM1 uses manual folder import in Settings > Plugins.",
    );
  else {
    if (
      args.positionals.length !== 1 ||
      !["check", "build", "package", "doctor"].includes(command) ||
      (args.values.app && command !== "doctor")
    )
      throw new Diagnostic(
        "CLI_ARGUMENT",
        "Expected check, build, package or doctor.",
        "",
        "Run lomi-plugin --help. Development mode is not part of M1.",
        2,
      );
    let result;
    if (command === "check") {
      const { manifest } = await project(process.cwd());
      result = {
        id: manifest.id,
        checks: ["types", "manifest", "input-assets"],
        bundleChecked: false,
      };
    } else if (command === "build") {
      const { output } = await buildProject(process.cwd(), controller.signal);
      result = { output, bundleChecked: true };
    } else if (command === "package")
      result = await packageProject(process.cwd(), version, controller.signal);
    else result = await doctor(process.cwd(), args.values.app, version);
    const ok = result.ok !== false;
    if (json)
      console.log(JSON.stringify({ schemaVersion: 1, command, ok, result }));
    else
      console.log(
        `${command}: ${ok ? "passed" : "failed"}\n${JSON.stringify(result, null, 2)}`,
      );
    if (!ok) process.exitCode = 1;
  }
} catch (error) {
  const diagnostic = {
    code: error.code ?? "CLI_FAILURE",
    message: error.message,
    file: error.file ?? "",
    hint: error.hint ?? "Correct the reported problem and retry.",
  };
  if (json)
    console.log(
      JSON.stringify({
        schemaVersion: 1,
        command: command ?? null,
        ok: false,
        diagnostics: [diagnostic],
      }),
    );
  else
    console.error(
      `${diagnostic.code}\n${diagnostic.file}: ${diagnostic.message}\n${diagnostic.hint}`,
    );
  process.exitCode = error.exitCode ?? 1;
}

process.removeListener("SIGINT", interrupt);
process.removeListener("SIGTERM", interrupt);
