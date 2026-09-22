# CLI releases

This repository publishes only `@lomi-dev/plugin-cli`. Generator and templates
belong to [create-lomi-plugin](https://github.com/lomi-dev/create-lomi-plugin),
and the contract belongs to [plugin-sdk](https://github.com/lomi-dev/plugin-sdk).
CLI, generator and SDK versions can advance independently. GitHub Actions is
disabled; maintainers run validation and publication manually.

1. Review SDK compatibility and pin its full source commit/version in
   sdk-source.json. Review the generator release and pin its exact npm version
   and SHA-512 integrity in generator-source.json. Generator code is not copied
   here; the archive test verifies the downloaded bytes before executing it.
2. Update the CLI package version when its published bytes change. Commit the
   release changes before producing archives. Run `pnpm install --frozen-lockfile`,
   `pnpm check`, `pnpm test`, `pnpm format:check` and `pnpm test:archives` on
   Linux, macOS and Windows. Install the reviewed sibling SDK's dependencies as
   described in README.md, or select its tested archive with `LOMI_SDK_TARBALL`.
   The suite covers four generated templates, Workspace info, runtime identity,
   packaging, error preservation and SDK import regressions.
3. Retain the successful run's CLI tarball from `artifacts/`,
   `candidate-artifacts.json` and `archive-validation.json`. Verify the source
   commit, SHA-256 and SHA-512, and retain reports from all three systems.
   SDK and generator entries in the report are integration dependencies, not
   artifacts to republish. Existing versions and release assets are immutable.
4. Publish only the exact tested CLI tarball using interactive npm 2FA; do not
   rebuild it before publishing. Replace `<new-version>` with the new,
   unpublished version:

   ```sh
   npm publish "./artifacts/lomi-dev-plugin-cli-<new-version>.tgz" --access public --tag next --ignore-scripts --auth-type=web
   ```

5. Run `pnpm test:registry` manually on all three systems after publication and
   compare npm integrity with the tested CLI archive. The generator pin stays
   fixed while the CLI candidate advances; this test explicitly upgrades scaffold
   dependencies to the published CLI/SDK pair. Attach the tested CLI archive and
   reports to a GitHub prerelease at the exact source commit. A template update
   requiring the new CLI belongs in a later generator release.
6. Record native results separately using desktop-qualification.md. Prerelease
   publication does not establish stable desktop compatibility.

The npm owner is `maciejkolerski`, with 2FA. Authenticate with `npm login` when
needed. This repository has no GitHub Actions publishing workflow or OIDC
publication path. Do not commit npm credentials. Historical combined releases
through v0.1.0-alpha.1 remain available.

Rollback by restoring the previous dependency and lockfile or generator pin;
retain older archives and publish a new version for corrected package bytes.
