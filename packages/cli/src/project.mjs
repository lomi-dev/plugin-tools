import { readFile, lstat } from "node:fs/promises";
import { resolve, join, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { parse as parseJSONC } from "jsonc-parser";

export class Diagnostic extends Error {
  constructor(
    code,
    message,
    file = "",
    hint = "Correct the project and run the command again.",
    exitCode = 1,
  ) {
    super(message);
    Object.assign(this, { code, file, hint, exitCode });
  }
}
export async function sdk(cwd) {
  const require = createRequire(join(cwd, "package.json"));
  const load = async (path) =>
    import(pathToFileURL(require.resolve(`@lomi-dev/plugin-sdk/${path}`)).href);
  try {
    const compatibility = await load("compatibility");
    if (compatibility.compatibility.sdk !== "1.1.0-alpha.0")
      throw new Error("Expected SDK 1.1.0-alpha.0.");
    return {
      ...(await load("manifest")),
      ...(await load("package")),
      ...compatibility,
      load,
      require,
    };
  } catch (error) {
    throw new Diagnostic(
      "SDK_VERSION",
      error.message,
      "package.json",
      "Install @lomi-dev/plugin-sdk@1.1.0-alpha.0 from the tested release or candidate archive.",
    );
  }
}
const forbidden =
  /(^|\/)(node_modules|\.git|\.env(?:\..*)?|src|tests|\.github)(\/|$)|\.(tsx?|map)$/;
export async function project(cwd, typecheck = true) {
  const api = await sdk(cwd);
  let config = {};
  const configPath = join(cwd, "lomi-plugin.config.mjs");
  try {
    await lstat(configPath);
    config = (await import(pathToFileURL(configPath).href)).default;
  } catch (error) {
    if (error.code !== "ENOENT")
      throw new Diagnostic("PLUGIN_CONFIG", error.message, configPath);
  }
  if (
    !config ||
    typeof config !== "object" ||
    Array.isArray(config) ||
    Object.keys(config).some(
      (k) => !["entry", "manifest", "assets"].includes(k),
    )
  )
    throw new Diagnostic(
      "PLUGIN_CONFIG",
      "Expected entry, manifest and assets only.",
      configPath,
    );
  config = {
    entry: "src/index.tsx",
    manifest: "plugin.json",
    assets: [],
    ...config,
  };
  if (
    !Array.isArray(config.assets) ||
    new Set(config.assets).size !== config.assets.length
  )
    throw new Diagnostic(
      "PLUGIN_CONFIG",
      "assets must be a list of unique paths.",
      configPath,
    );
  let manifest;
  try {
    const bytes = await readFile(await api.safePath(cwd, config.manifest));
    if (bytes.length > api.limits.manifestBytes)
      throw new Error("Manifest exceeds 256 KiB.");
    manifest = api.parsePlugin(JSON.parse(bytes.toString("utf8")));
  } catch (error) {
    throw new Diagnostic(
      "PLUGIN_MANIFEST",
      error.message,
      config.manifest,
      "Use the SDK schema and correct the indicated field or contribution reference.",
    );
  }
  const assets = new Map();
  for (const path of config.assets) {
    try {
      if (forbidden.test(path))
        throw new Error(
          "Do not include source, secrets, dependencies or repository files.",
        );
      const source = await api.safePath(cwd, path);
      if ((await lstat(source)).isDirectory()) {
        for (const [name, bytes] of await api.packageFiles(source)) {
          if (forbidden.test(`${path}/${name}`))
            throw new Error(`Forbidden asset: ${path}/${name}`);
          assets.set(`${path}/${name}`, bytes);
        }
      } else assets.set(path, await readFile(source));
    } catch (error) {
      throw new Diagnostic(
        "PLUGIN_ASSET",
        error.message,
        path,
        "Use explicit existing project-relative regular files. Remove symlinks and private files.",
      );
    }
  }
  for (const path of manifest.stylesheets ?? [])
    if (!assets.has(path))
      throw new Diagnostic(
        "PLUGIN_ASSET",
        "Declared stylesheet must be listed in assets.",
        path,
      );
  for (const theme of manifest.contributes?.themes ?? []) {
    const path = `${theme.path}/theme.jsonc`,
      bytes = assets.get(path);
    if (!bytes)
      throw new Diagnostic(
        "PLUGIN_THEME",
        "Include the theme directory in assets with a theme.jsonc file.",
        path,
      );
    const errors = [];
    const value = parseJSONC(bytes.toString("utf8"), errors, {
      allowTrailingComma: true,
    });
    if (
      errors.length ||
      !value ||
      value.version !== 2 ||
      typeof value.name !== "string" ||
      !value.name.trim() ||
      (value.appearance &&
        !["adaptive", "light", "dark"].includes(value.appearance))
    )
      throw new Diagnostic(
        "PLUGIN_THEME",
        "Expected a version 2 theme with a name and valid appearance.",
        path,
      );
    for (const resource of [
      ...Object.values(value.resources?.assets ?? {}),
      ...(value.resources?.stylesheets ?? []),
      ...(value.iconTheme ? [value.iconTheme.path] : []),
    ]) {
      api.packagePath(resource);
      if (!assets.has(`${theme.path}/${resource}`))
        throw new Diagnostic(
          "PLUGIN_ASSET",
          "Missing theme resource.",
          `${theme.path}/${resource}`,
        );
    }
  }
  if (manifest.entry) {
    try {
      await api.safePath(cwd, config.entry);
    } catch (error) {
      throw new Diagnostic("PLUGIN_ENTRY", error.message, config.entry);
    }
    if (typecheck) {
      try {
        execFileSync(
          process.execPath,
          [
            join(
              dirname(api.require.resolve("typescript/package.json")),
              "bin/tsc",
            ),
            "--noEmit",
          ],
          {
            cwd,
            encoding: "utf8",
            timeout: 120000,
            maxBuffer: 4 * 1024 * 1024,
          },
        );
      } catch (error) {
        throw new Diagnostic(
          "PLUGIN_TYPES",
          error.stdout || error.message,
          "tsconfig.json",
          "Fix the TypeScript errors before building.",
        );
      }
    }
  }
  return { api, config, manifest, assets };
}

export async function buildProject(cwd, signal) {
  const result = await project(cwd);
  try {
    const { buildPlugin } = await result.api.load("build");
    const output = await buildPlugin({ ...result.config, cwd, signal });
    return { ...result, output };
  } catch (error) {
    throw new Diagnostic(
      "PLUGIN_BUILD",
      error.message,
      result.config.entry,
      "Bundle browser dependencies, remove Node/private imports and use literal dynamic imports. The previous package is preserved.",
    );
  }
}
