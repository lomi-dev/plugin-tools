# Lomi plugin tools

M1 alpha tools: generator, `check`, `build`, `package`, `doctor`, four
templates and a Workspace info example. SDK source lives in the separate [plugin-sdk repository](https://github.com/lomi-dev/plugin-sdk). Tools use the existing host API 1 and shared React runtime.

**Not published to npm.** The maintainer has created the npm account `lomidev`;
package scopes and publishing access still need confirmation. Desktop
qualification of the candidate is still pending. There is no `dev` command.

## Create a plugin

Use Node 22.14+ and pnpm 11.25.0. These POSIX commands download the published
GitHub prerelease generator and create a project outside the source repositories:

```sh
LOMI_AUTHOR_ROOT="$(mktemp -d)"
pnpm --package https://github.com/lomi-dev/plugin-tools/releases/download/v0.1.0-alpha.0/create-lomi-plugin-0.1.0-alpha.0.tgz dlx create-lomi-plugin "$LOMI_AUTHOR_ROOT/my-plugin" --id example.workspace-info --name "Workspace info" --template panel
cd "$LOMI_AUTHOR_ROOT/my-plugin"
pnpm install --ignore-scripts
pnpm check
pnpm test
pnpm build
pnpm run doctor
pnpm package
```

The generated package pins SDK and CLI GitHub prerelease URLs. Commit its first
lockfile to retain archive integrity. The author needs no Lomi or SDK checkout,
Rust or desktop build tools. npm publication remains pending; the planned
`pnpm create lomi-plugin` registry command is not available yet.

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
approve the new revision. If code was already evaluated, use **Restart SimpleBench**
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
selects an existing archive. `pnpm pack:tools` prepares SDK and tool archives.
Generated projects are installed and tested in fresh external directories with
an isolated dependency store. The application checkout is not required.

GitHub Actions runs the complete archive suite on Linux, macOS and Windows.
`sdk-source.json` pins a reviewed full SDK commit and its compatible version.
Update that file when upgrading SDK; the CLI and all templates must agree.
The generated projects currently pin GitHub prerelease tarballs while npm
publishing access is pending. Their first lockfile records archive integrity.
After npm publication, update those pins to the verified exact registry versions.

The [release procedure](docs/releases.md) explains first publication, OIDC,
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

To narzędzia M1 alpha udostępnione przez GitHub Releases, jeszcze bez publikacji npm. Wymagania: Node 22.14+
i pnpm 11.25.0. Polecenia powyżej instalują rzeczywiste archiwa i tworzą projekt
poza repozytorium. Po przeniesieniu archiwów na inną maszynę autor nie potrzebuje
źródeł Lomi ani Rust. Publiczne nazwy pakietów wymagają potwierdzenia własności.

Uruchom `check`, `test`, `build`, `doctor` i `package`. W Settings > Plugins
zaimportuj folder `package/`, włącz plugin i zatwierdź rewizję. Otwórz workspace
i komendę Workspace info. Zmień kod, zbuduj, wyłącz poprzednią wersję, ponów import
i zatwierdzenie. W razie potrzeby użyj Restart SimpleBench. Nie ma jeszcze `dev`.

ZIP trzeba rozpakować przed importem. Archiwum, suma SHA-256 i raport walidacji
znajdują się w `artifacts/`. Kolejne wydanie wymaga nowej wersji lub jawnego
przeniesienia starych plików. Testy z atrapą kontekstu nie są testem desktopu.
Test natywny i instalacja prerelease z rejestru pozostają warunkami publicznego M1.
