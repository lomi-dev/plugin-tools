# Create Lomi plugin

`create-lomi-plugin <directory> --id author.name --name "Name" --template panel`

Templates: panel, sidebar, command, theme. In a terminal the generator asks for
missing answers. Without a terminal, ID and display name are required. The panel
is the default template. `--json` emits schemaVersion 1 without prompts.

The destination must be new or empty. Generation installs no dependencies and
creates no Git repository. Existing user files are preserved on error or
interruption. After installing dependencies, commit the new lockfile before CI.

Generate with `pnpm create lomi-plugin@0.1.0-alpha.1 my-plugin`. Projects pin
SDK and CLI versions from npm; run `pnpm install --ignore-scripts`, then
`pnpm check`, `pnpm test`, `pnpm build` and `pnpm run doctor`.
This is an alpha using manual desktop import. M1 has no dev command. Apache-2.0.
