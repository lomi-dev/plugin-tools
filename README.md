# Lomi plugin tools

M1 alpha CLI: `check`, `build`, `package`, `doctor`, testing helpers and the
Workspace info example. The generator and four templates live in the separate
[create-lomi-plugin repository](https://github.com/lomi-dev/create-lomi-plugin). SDK source lives in the separate [plugin-sdk repository](https://github.com/lomi-dev/plugin-sdk). Tools use the existing host API 1 and shared React runtime.

SDK 1.1.0-alpha.1 and CLI 0.1.0-alpha.2 are unpublished rebrand candidates.
The npm commands below apply after their publication. Desktop
qualification is still pending. There is no `dev` command.

## Create a plugin

Use Node 22.14+ and pnpm 11.25.0. These POSIX commands download the versioned
npm generator and create a project outside the source repositories:

```sh
LOMI_AUTHOR_ROOT="$(mktemp -d)"
pnpm create lomi-plugin@0.1.0-alpha.3 "$LOMI_AUTHOR_ROOT/my-plugin" --id example.workspace-info --name "Workspace info" --template panel
cd "$LOMI_AUTHOR_ROOT/my-plugin"
pnpm install --ignore-scripts
pnpm check
pnpm test
pnpm build
pnpm run doctor
pnpm package
```

The generated package pins SDK and CLI npm versions. Commit its first lockfile
to retain archive integrity. The author needs no Lomi or SDK checkout, Rust or
desktop build tools. Use the explicit prerelease version shown above.

For development archives, generate using the local generator tarball and replace
the two dependency pins with named `file:` tarball dependencies before installing.
`pnpm test:archives` exercises that path using fresh external projects.

Import `package/` in **Settings > Plugins > Import plugin**. Enable the code plugin
and choose **Trust and enable**. Open a workspace and run **Workspace info** in
Commands. Toggle **Show project path**, switch workspaces and check the saved
choice. The sidebar template declares a singleton per workspace. The command
template logs the current workspace. The theme template is data-only and appears
in Settings > Themes without code activation.

After editing, build again, disable the previous plugin, reimport `package/` and
approve the new revision. If code was already evaluated, use **Restart Lomi**
and resolve normal unsaved-work prompts. Build errors keep the last good folder.

`package` writes a ZIP, SHA-256 and validation JSON to `artifacts/`. The ZIP has
`plugin.json` at its root. Recipients extract it before import. Existing release
files are never overwritten. Increase `plugin.json`'s version for another release.
The archive hash is separate from the host's content trust revision.

## Development

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm format:check
```

The archive suite uses the standalone SDK checkout in `../plugin-sdk`:

```sh
git clone https://github.com/lomi-dev/plugin-sdk.git ../plugin-sdk
pnpm --dir ../plugin-sdk install --frozen-lockfile
pnpm test:archives
```

`LOMI_SDK_REPO` selects another standalone SDK checkout; `LOMI_SDK_TARBALL`
selects an existing archive. `pnpm pack:tools` prepares SDK/CLI archives and
downloads the npm generator pinned in `generator-source.json`, verifying SHA-512
before installing it. A generator source checkout is not required.
Generated projects are installed and tested in fresh external directories with
an isolated dependency store. The application checkout is not required.

GitHub Actions is disabled. Run the complete archive suite manually on Linux,
macOS and Windows before releasing.
`sdk-source.json` pins a reviewed full SDK commit and its compatible version.
Update that file when upgrading SDK. `generator-source.json` independently pins
a reviewed npm generator version and integrity. Test the candidate CLI against
that generator before advancing either baseline. Only CLI is published here.
Generated projects pin registry versions and retain archive integrity in their
lockfiles. Their pnpm configuration allows the two exact, tested Lomi releases
through release-age checks; other dependencies keep the package manager policy.
`pnpm test:registry` verifies all templates and the example against public npm.

The [release procedure](docs/releases.md) explains manual publication,
registry verification and rollback. [Desktop qualification](docs/desktop-qualification.md)
separates pending native tests from the automated in-memory and browser tests.

## Diagnostics

Use `--json` for schemaVersion 1 output. Exit 0 means success, 1 a project or
execution failure, 2 invalid arguments. Diagnostics contain code, message, file
and repair hint. `check` validates inputs and TypeScript; only build/package
inspect generated imports. `doctor` never launches or repairs the application.

| Code                  | Action                                                                |
| --------------------- | --------------------------------------------------------------------- |
| SDK_VERSION           | Install the tested SDK archive/version in the author project.         |
| PLUGIN_MANIFEST       | Fix the indicated field, ID or contribution reference.                |
| PLUGIN_TYPES          | Correct TypeScript errors.                                            |
| PLUGIN_ASSET          | Add the missing explicit asset; remove symlinks/private files.        |
| PLUGIN_BUILD          | Use browser dependencies and literal relative dynamic imports.        |
| PLUGIN_RELEASE_EXISTS | Choose a new version or explicitly move old artifacts.                |
| HOST_UNVERIFIED       | Perform manual import and desktop qualification. M1 has no handshake. |
| REACT_DUPLICATE       | Align React peers and reinstall.                                      |

Theme checks cover JSONC, version/appearance and declared resources. The complete
semantic theme surface validator still belongs to the host; import can report
additional theme errors. CSS local file references are checked. Arbitrary paths
constructed at runtime cannot be inferred by a build validator.

## Polski

To narzędzia M1 alpha z dokładnymi wersjami npm. Wymagania: Node 22.14+
i pnpm 11.25.0. Polecenia powyżej pobierają generator z rejestru i tworzą projekt
poza repozytorium. Autor nie potrzebuje źródeł Lomi ani Rust.

Uruchom `check`, `test`, `build`, `doctor` i `package`. W Settings > Plugins
zaimportuj folder `package/`, włącz plugin i zatwierdź rewizję. Otwórz workspace
i komendę Workspace info. Zmień kod, zbuduj, wyłącz poprzednią wersję, ponów import
i zatwierdzenie. W razie potrzeby użyj Restart Lomi. Nie ma jeszcze `dev`.

ZIP trzeba rozpakować przed importem. Archiwum, suma SHA-256 i raport walidacji
znajdują się w `artifacts/`. Kolejne wydanie wymaga nowej wersji lub jawnego
przeniesienia starych plików. Testy z atrapą kontekstu nie są testem desktopu.
Przed potwierdzeniem zgodności desktopowej pozostaje kwalifikacja natywna.
