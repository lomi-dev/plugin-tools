# Plugin tools

Follow CONTRIBUTING.md. Keep the plugin runtime contract in the separate plugin-sdk repository.
Do not add private host imports, workspace dependencies to published metadata, or
unavailable dev scripts to generated projects. Preserve existing user files on
errors and interruption. Test installed tarballs outside both repositories.
GitHub repository metadata and npm scope ownership are confirmed. Pin exact
registry versions in author projects; preserve previously published archives. Never claim desktop validation based
on the in-memory testing helper or browser tests with mocked native commands.
