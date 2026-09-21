# Lomi plugin tools

Local M1 alpha candidate: generator, `check`, `build`, `package`, `doctor`, four
templates and a Workspace info example. SDK source stays in the application
repository. Tools use the existing host API 1 and shared React runtime.

**Not published to npm.** The maintainer has created the npm account `lomidev`;
package scopes and publishing access still need confirmation. Desktop
qualification of the candidate is still pending. There is no `dev` command.

## Try the prepared archives

Use Node 22.14+ and pnpm 11.25.0. Obtain the three tested candidate tarballs from
the maintainer, or prepare them from the candidate SDK checkout as described
under Development. Archives are not included in this repository. Set
`LOMI_ARCHIVES` to their absolute directory; these POSIX commands create the
author project in a fresh temporary directory outside both repositories:

```sh
export LOMI_ARCHIVES="/absolute/path/to/candidate-archives"
LOMI_AUTHOR_ROOT="$(mktemp -d)"
pnpm --package "$LOMI_ARCHIVES/create-lomi-plugin-0.1.0-alpha.0.tgz" dlx create-lomi-plugin "$LOMI_AUTHOR_ROOT/my-plugin" --id example.workspace-info --name "Workspace info" --template panel
cd "$LOMI_AUTHOR_ROOT/my-plugin"
pnpm add -D "@simplebench/plugin-sdk@file:$LOMI_ARCHIVES/simplebench-plugin-sdk-1.1.0-alpha.0.tgz" "@lomi-dev/plugin-cli@file:$LOMI_ARCHIVES/lomi-dev-plugin-cli-0.1.0-alpha.0.tgz" --ignore-scripts
pnpm check
pnpm test
pnpm build
pnpm doctor
pnpm package
```

Distribute the three tarballs to another machine to try this without any Lomi
source checkout, Rust or desktop build tools. Replace the archive paths there.
After public publication, install the exact tested versions from npm instead of
local files. Do not use the planned `pnpm create lomi-plugin` command yet.

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

The archive integration suite requires the candidate SDK `1.1.0-alpha.0`, whose
source changes are still pending in `lomi-dev/lomi`. Its current `main` SDK
`1.0.0` is insufficient. With the candidate checkout available, run
`pnpm test:archives`.

When using the sibling SDK source, first run `pnpm --dir ../lomi install --frozen-lockfile`.
`test:archives` packs the sibling `../lomi` SDK and both tools, installs them into
fresh temporary author directories with a fresh pnpm store, and exercises all
four templates. `LOMI_SDK_REPO` selects another checkout; `LOMI_SDK_TARBALL` selects
an existing archive. `pnpm pack:tools` prepares only the archives. The generated
project does not depend on these source repositories after archive installation.

GitHub Actions runs syntax, formatting and unit checks on Linux, macOS and
Windows. Archive integration jobs remain explicitly skipped until the repository
variable `LOMI_SDK_REF` points to the full commit containing the candidate SDK in
`lomi-dev/lomi`. Passing tool checks alone does not qualify those archives.

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

To lokalny kandydat M1, jeszcze bez publikacji npm. Wymagania: Node 22.14+
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
