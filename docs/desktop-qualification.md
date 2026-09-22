# Desktop qualification

The available machine is macOS ARM64. `/Applications/Lomi.app` reports
0.4.0. This identifies the installation; it does not certify this candidate.
No Windows, Linux or Intel macOS desktop runner was available in this session.

The existing native smoke runner depends on the `native-smoke` feature and XDG
paths. The installed macOS release does not expose that probe, and XDG variables
do not isolate all macOS application paths. Do not run it against the ordinary
profile or silently treat its browser substitute as native evidence.

Use a separate OS test account or an explicitly qualified disposable host profile:

1. Copy only the extracted plugin ZIP to the test account, without node_modules.
2. Disconnect network access and open the installed application. Record its
   version, binary hash, OS/architecture and the ZIP hash.
3. Import the folder in Settings > Plugins. Confirm metadata appears before any
   code runs. Enable it and approve the exact revision through the normal UI.
4. Open a workspace and the plugin command. Check the panel, checkbox, workspace
   updates, appearance and sidebar singleton. Restart and check the saved state.
5. Import the theme-only template and select it without enabling executable code.
6. Build a changed plugin, disable the old revision, import and approve the new
   one, then use the guarded restart when required. Preserve unavailable state.
7. Test safe startup and disable/uninstall. Keep the report and screenshots.

The retained-document dirty guard cases are covered by existing host tests, not
by the simplified public test helper. Native Save/Discard/Cancel qualification is
still required before a desktop compatibility claim.
