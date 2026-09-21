# Release procedure

Status on 2026-09-22: local candidates only. The owner has created the npm account
`lomidev`; local `npm whoami` still returns ENEEDAUTH. The GitHub repository is
`lomi-dev/plugin-tools`, with matching repository metadata in both tool packages.
The GitHub organization `lomi-dev` does not establish npm scope ownership.
Public lookups on 2026-09-21 for `create-lomi-plugin`,
`@lomi-dev/plugin-cli`, `@lomi-dev/plugin-sdk` and `@simplebench/plugin-sdk`
returned 404. A 404 neither reserves a name nor establishes scope ownership.
SDK metadata keeps its existing
`@simplebench/plugin-sdk` name until ownership and the migration target are settled.
The bundler already recognizes both SDK import names without changing the runtime
symbol. The CLI resolves the existing name in this candidate.

1. Log in as `lomidev` and enable 2FA. Create or obtain access to the intended
   organization. Confirm ownership using `npm whoami`, `npm org ls <scope>` and
   package access checks. Do not put credentials in this repository.
2. Confirm the final SDK, CLI and generator names. If switching SDK scope, update
   package metadata, CLI resolution, templates, examples and tests together, then
   rerun archive tests. Preserve the old bundler import alias and runtime symbol.
3. Merge the SDK foundation into `lomi-dev/lomi`. Pin the tools repository variable
   `LOMI_SDK_REF` to that full 40-character host commit. Until then, tool syntax,
   formatting and unit checks run on all three operating systems, while archive
   integration jobs are explicitly skipped. A green tool check does not qualify
   the SDK archives. Verify the full archive matrix after setting the variable.
4. Run `pnpm test:archives`. Review the SDK and tool tarballs in `artifacts/` and
   `archive-validation.json`. Record their SHA-256 values and the source commits.
5. First publication needs the authenticated package owner. Publish those exact
   SDK bytes using `npm publish ./<sdk.tgz> --access public --tag next`, then the CLI
   and generator archives in that order. Never substitute `latest` for `next`.
6. Configure trusted publishers in each npm package's settings. SDK uses
   `lomi-dev/lomi` / `plugin-sdk.yml`; tools use `lomi-dev/plugin-tools` /
   `publish.yml`. Environment is `npm`. These values must match the real owner and
   repository. Enable `NPM_PUBLISH_READY=true` only after this setup and metadata
   review. Later workflows publish their tested archives without rebuilding them.
7. Use a new temporary folder and empty pnpm store. Install the exact prerelease
   generator from npm, generate each template and run install/check/test/build/
   package. No file overrides or local SDK may be present. Record registry
   integrity and tarball hashes. Repeat the manual desktop checklist in
   `desktop-qualification.md` with the installed host.
8. Only then mark REL-02 and public M1 complete. Publish the matching PL/EN docs.
   Promote stable tags only after their own qualification; M1 remains alpha.

OIDC jobs use Node 24 and npm 11.5.1. npm documents a minimum of npm 11.5.1 and
Node 22.14.0, checked on 2026-09-21:
[trusted publishing](https://docs.npmjs.com/trusted-publishers/).

Rollback: keep immutable versions, stop promotion, point users to the previous
qualified set and publish a new fix version. Plugin recipients disable the bad
revision, import the previous extracted folder and approve it. A rollback does
not migrate incompatible panel state.
