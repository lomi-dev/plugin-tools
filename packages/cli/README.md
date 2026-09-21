# Lomi plugin CLI candidate

Commands: `lomi-plugin check`, `build`, `package`, `doctor`. `--json` returns
schemaVersion 1. `doctor --app <path>` inspects installation metadata without
launching it. Exit codes are 0 success, 1 invalid project/runtime failure, 2 invalid
arguments. M1 uses manual folder import and has no dev or host test command.

Install SDK 1.1.0-alpha.0 in the author project. Executable plugins also need
React/React DOM 19.2.8, TypeScript 7.0.2 and matching React types. The SDK peer is
optional only so theme/generator tooling can diagnose a missing SDK without an
install-time registry request. Every project still requires the SDK.

`defineConfig` types entry, manifest and explicit assets. `./testing` exports
`createTestHost`: an in-memory context for registrations, commands, snapshots,
small state and cleanup. It does not simulate native trust, dirty dialogs,
persistence across application restarts, or the desktop renderer. Workspace
identity in this helper uses project path and workspace name because the public
snapshot has no workspace ID; use desktop tests for same-named workspaces.

This is an unpublished local candidate. Follow the repository README to install
its tarball. Apache-2.0.
