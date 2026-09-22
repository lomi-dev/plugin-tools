# Contributing

The SDK source belongs to the separate `lomi-dev/plugin-sdk` repository. This repository owns the
CLI, generator, templates and examples. Node 22.14+ and pnpm 11.25.0 are required.

Run `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm format:check` and
`pnpm test:archives`. The archive test packs the sibling `../plugin-sdk` checkout by default.
Set `LOMI_SDK_REPO` to another standalone SDK checkout, or `LOMI_SDK_TARBALL` to an already
prepared archive. Author projects are installed under the system temporary
folder and kept with their logs for inspection. They do not use workspace links.

Do not add host development mode before the profile and process protocol exist.
Keep mock tests separate from desktop qualification. A successful Node test does
not qualify WKWebView, WebView2 or WebKitGTK.

Use English comments and commit subjects in the form
`type(scope): short imperative summary`, at most 72 characters. Explain the change
and include a `Validation:` section with actual results. Preserve existing user
changes. Never stage, commit or push without an explicit request.
