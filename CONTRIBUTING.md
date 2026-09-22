# Contributing

This repository owns `@lomi-dev/plugin-cli` and the Workspace info example.
The SDK source belongs to `lomi-dev/plugin-sdk`; the generator and four templates
belong to `lomi-dev/create-lomi-plugin`. Use Node 22.14+ and pnpm 11.25.0.

Run `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm test`,
`pnpm format:check` and `pnpm test:archives`. The archive test packs the sibling
`../plugin-sdk` by default; `LOMI_SDK_REPO` selects another SDK checkout and
`LOMI_SDK_TARBALL` selects an existing candidate. Generator installation uses the
exact npm version and SHA-512 pin in generator-source.json, without a generator
checkout. CLI candidates and the pinned generator exercise four templates and
Workspace info in fresh directories with a separate dependency store.

`pnpm test:registry` installs the published CLI/SDK versions into projects
created by the pinned generator. These explicit registry upgrades allow CLI
releases to advance independently of template releases. The generator repository
separately verifies its unmodified template dependency pins.
`pnpm test:release` is an alias for this registry check. `pnpm pack:tools` creates
the candidate CLI/SDK archives and downloads the pinned generator for integration
tests; the publishing workflow publishes only the CLI archive.

Keep source and release histories independent. To update the generator baseline,
review its release and record its exact npm version and integrity. Do not bundle
or publish the generator from this repository. Report native qualification
separately from mock tests; no `dev` command exists in M1.

Use English conventional commits: `type(scope): imperative summary`, at most
72 characters. Include an explanatory body and actual results under `Validation:`.
Preserve the user's Git identity and existing changes. Do not add AI attribution.
Commit and push only when requested.
