# Create Lomi plugin candidate

`create-lomi-plugin <directory> --id author.name --name "Name" --template panel`

Templates: panel, sidebar, command, theme. In a terminal the generator asks for
missing answers. Without a terminal, ID and display name are required. The panel
is the default template. `--json` emits schemaVersion 1 without prompts.

The destination must be new or empty. Generation installs no dependencies and
creates no Git repository. Existing user files are preserved on error or
interruption. After installing dependencies, commit the new lockfile before CI.

This alpha is distributed as a GitHub prerelease archive. Generated projects
pin tested SDK/CLI release URLs; run `pnpm install --ignore-scripts`. npm
publication requires account and scope configuration. M1 has no dev command. Apache-2.0.
