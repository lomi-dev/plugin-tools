import { access, readFile, realpath } from "node:fs/promises";
import { join } from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { sdk } from "./project.mjs";

export async function doctor(cwd, app, cliVersion) {
  const checks = [];
  const add = (code, status, message, hint = "") =>
    checks.push({ code, status, message, hint });
  const [major, minor] = process.versions.node.split(".").map(Number);
  add(
    "NODE_VERSION",
    major > 22 || (major === 22 && minor >= 14) ? "ok" : "error",
    process.version,
    "Use Node 22.14 or newer.",
  );
  let api;
  try {
    api = await sdk(cwd);
    add("SDK_VERSION", "ok", api.compatibility.sdk);
  } catch (error) {
    add(error.code, "error", error.message, error.hint);
  }
  const require = createRequire(join(cwd, "package.json"));
  for (const name of ["react", "react-dom", "typescript"]) {
    try {
      const path = require.resolve(`${name}/package.json`);
      const value = JSON.parse(await readFile(path, "utf8"));
      const expected = name === "typescript" ? "7.0.2" : "19.2.8";
      add(
        "DEPENDENCY_VERSION",
        value.version === expected ? "ok" : "error",
        `${name}: ${value.version}`,
        `Use ${name}@${expected}. Theme-only projects do not need React.`,
      );
      if (name === "react" && api) {
        const fromSDK = createRequire(
          api.require.resolve("@lomi-dev/plugin-sdk/build"),
        );
        if (
          (await realpath(fromSDK.resolve("react"))) !==
          (await realpath(require.resolve("react")))
        )
          add(
            "REACT_DUPLICATE",
            "error",
            "SDK and project resolve different React copies.",
            "Align React peer versions and reinstall dependencies.",
          );
      }
    } catch {
      add(
        "DEPENDENCY_MISSING",
        name === "typescript" ? "error" : "warning",
        `${name} is not installed.`,
        "React is only required for executable plugins.",
      );
    }
  }
  if (!app && process.platform === "darwin") {
    for (const candidate of ["/Applications/Lomi.app"]) {
      try {
        await access(candidate);
        app = candidate;
        break;
      } catch {}
    }
  }
  if (!app)
    add(
      "HOST_MISSING",
      "warning",
      "No application selected or detected.",
      "Install Lomi and pass --app <path>. Build and manual import remain available.",
    );
  else {
    try {
      await access(app);
      let version = "unknown";
      if (process.platform === "darwin" && app.endsWith(".app")) {
        version = execFileSync(
          "/usr/libexec/PlistBuddy",
          [
            "-c",
            "Print :CFBundleShortVersionString",
            join(app, "Contents/Info.plist"),
          ],
          { encoding: "utf8", timeout: 5000 },
        ).trim();
      }
      add("HOST_FOUND", "ok", `${app} (${version})`);
      add(
        "HOST_UNVERIFIED",
        "warning",
        "This host has no qualified development handshake.",
        "M1 supports manual import only. No binary is launched by doctor; runtime compatibility and debug support need a desktop test.",
      );
      if (/^0\.[0-3]\./.test(version))
        add(
          "HOST_TOO_OLD",
          "error",
          `Host ${version} predates the 0.4.0 plugin baseline.`,
          "Install a compatible release and repeat manual qualification.",
        );
      if (version !== "unknown" && version !== "0.4.0")
        add(
          "HOST_VERSION",
          "warning",
          `Host ${version} is outside the source baseline 0.4.0.`,
          "Verify this version with a clean desktop profile before distribution.",
        );
    } catch (error) {
      add(
        "HOST_MISSING",
        "error",
        error.message,
        "Correct --app to the installed application path.",
      );
    }
  }
  return {
    platform: `${process.platform}-${process.arch}`,
    cli: cliVersion,
    packageManager: process.env.npm_config_user_agent ?? null,
    checks,
    ok: checks.every((item) => item.status !== "error"),
  };
}
