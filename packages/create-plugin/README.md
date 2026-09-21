# Create Lomi plugin candidate

`create-lomi-plugin <directory> --id author.name --name "Name" --template panel`

Templates: panel, sidebar, command, theme. In a terminal the generator asks for
missing answers. Without a terminal, ID and display name are required. The panel
is the default template. `--json` emits schemaVersion 1 without prompts.

The destination must be new or empty. Generation installs no dependencies and
creates no Git repository. Existing user files are preserved on error or
interruption. After installing dependencies, commit the new lockfile before CI.

This is an unpublished local candidate. Use its tested tarball until npm account,
names and publication are configured. M1 has no dev command. Apache-2.0.
