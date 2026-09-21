# Release procedure

The source repositories are `lomi-dev/plugin-sdk` and `lomi-dev/plugin-tools`.
The SDK package is `@lomi-dev/plugin-sdk`; CLI and generator are
`@lomi-dev/plugin-cli` and `create-lomi-plugin`. The SDK's bundler preserves the
legacy import and runtime symbol.

npm account `lomidev` exists, but CLI authentication and scope ownership still
need confirmation. Public prerelease tarballs provide the initial distribution.
Generated projects pin their exact GitHub Release URLs and record integrity on
installation. This is a working archive distribution, not an npm publication.
Do not overwrite a published version or replace its release assets.

1. Review an SDK release and update `sdk-source.json` with its full source commit
   and version. Align CLI peer requirements, templates, examples and diagnostics.
   SDK source is in its own repository; tools CI does not clone the application.
2. Run `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm test`,
   `pnpm format:check`, and `pnpm test:archives`. Require the full Linux, macOS
   and Windows archive matrix. Review the tarballs, `candidate-artifacts.json`
   and `archive-validation.json`. Download the exact tested Linux artifacts for
   publication; do not substitute a rebuild from a different source commit.
3. For first npm publication, log in as the authorized owner and verify scope
   access and 2FA. Publish the qualified SDK from `lomi-dev/plugin-sdk` first.
   Replace the template SDK/CLI GitHub archive URLs with the exact verified npm
   versions, update example lockfiles, retest and publish CLI then generator.
   Review availability of the unscoped generator name before first publication.
4. Configure npm trusted publishers: SDK uses `lomi-dev/plugin-sdk` /
   `publish.yml`; both tools use `lomi-dev/plugin-tools` / `publish.yml`.
   The environment is `npm`. Enable direct publishing permission and then set
   `NPM_PUBLISH_READY=true`. The tools workflow tests all three operating systems
   and publishes the exact verified Linux CLI and generator archives with OIDC.
5. Test the generator downloaded from npm in a fresh directory and empty store.
   Generate all four templates and run install/check/test/build/package/doctor
   without file overrides. Record registry integrity and source commits. Archive
   or GitHub URL tests do not count as registry verification.
6. Run the installed host checklist in `desktop-qualification.md`. Only after
   registry and native qualification mark public M1 complete. Prereleases use
   `next`; stable promotion is a separate decision with a supported-version matrix.

The OIDC workflow uses Node 24 and npm 11.5.1. Account configuration follows
[npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).

Rollback: restore the consumer's previous dependency and lockfile, retain older
artifacts, and publish a new corrected version. Do not overwrite releases or
silently migrate incompatible plugin state. Recipients can disable the bad
plugin and reimport a previously qualified package.
