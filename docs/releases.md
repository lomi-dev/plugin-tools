# CLI releases

This repository publishes only `@lomi-dev/plugin-cli`. Generator and templates
belong to [create-lomi-plugin](https://github.com/lomi-dev/create-lomi-plugin),
and the contract belongs to [plugin-sdk](https://github.com/lomi-dev/plugin-sdk).
CLI, generator and SDK versions can advance independently.

1. Review SDK compatibility and pin its full source commit/version in
   sdk-source.json. Review the generator release and pin its exact npm version
   and SHA-512 integrity in generator-source.json. Generator code is not copied
   here; the archive test verifies the downloaded bytes before executing it.
2. Update the CLI package version when its published bytes change. Run check,
   test, format:check and test:archives. Require Linux, macOS and Windows CI.
   The suite covers four generated templates, Workspace info, runtime identity,
   packaging, error preservation and SDK import regressions.
3. Download the successful Linux candidate archive and candidate-artifacts.json.
   Verify source commit, SHA-256 and SHA-512. Publish only the CLI tarball with
   interactive npm 2FA, or use the configured trusted publishing workflow.
   SDK and generator entries in the report are integration dependencies, not
   artifacts to republish. Existing versions and release assets are immutable.
4. Configure npm trusted publishing for `@lomi-dev/plugin-cli` using GitHub owner
   `lomi-dev`, repository `plugin-tools`, workflow `publish.yml`, environment
   `npm`, with direct publishing permission. Enable NPM_PUBLISH_READY only after
   account configuration. The workflow uses Node 24/npm 11.5.1, OIDC/provenance
   and the exact verified Linux archive; it does not rebuild before publishing.
5. Run test:registry and the public release workflow on all three systems after
   publication. The generator pin stays fixed while the CLI candidate advances; this smoke
   test explicitly upgrades scaffold dependencies to the published CLI/SDK pair.
   A template update requiring the new CLI belongs in a later generator release.
6. Record native results separately using desktop-qualification.md. Prerelease
   publication does not establish stable desktop compatibility.

The npm owner is `maciejkolerski`, with 2FA. Trusted publishing is prepared but
not enabled. The generator requires its own publisher configuration in its new
repository. Historical combined releases through v0.1.0-alpha.1 remain available.

Rollback by restoring the previous dependency and lockfile or generator pin;
retain older archives and publish a new version for corrected package bytes.
