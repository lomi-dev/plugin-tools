# __ID__

Template: `theme`. Uses host API 1 and the Lomi 0.4.0 source baseline.
SDK 1.1.0-alpha.0 and CLI 0.1.0-alpha.0 are pinned GitHub prerelease archives while npm publication is pending.

Run `pnpm install --ignore-scripts` to download the pinned SDK and CLI archives.
Commit the generated `pnpm-lock.yaml` before enabling CI.
Run `pnpm check`, `pnpm test`, `pnpm build`, then `pnpm package`.
Tests exercise the built plugin with an in-memory context, without a desktop host.

Import `package/` in Settings > Plugins. For code plugins, enable and approve the
content revision. Open a workspace, then use Commands to run the declared command.
Themes appear in Settings > Themes after import without code approval.
Change the source, build again, disable the old plugin and import the new folder.
Approve the new revision; use Restart SimpleBench if the previous code was evaluated.
Restart follows normal unsaved-work guards. M1 has no `dev` command.

The ZIP contains `plugin.json` at its root. Recipients extract it before importing.
The checksum identifies the ZIP, not the host's trusted content revision.
Review dependency and asset licenses before distributing your plugin.
This template uses Apache-2.0; replace the license if your project requires it.

## Polski

Uruchom `pnpm install --ignore-scripts`, aby pobrać przypięte archiwa SDK i CLI.
Zapisz utworzony `pnpm-lock.yaml` przed włączeniem CI. Publikacja npm jest otwarta.
Uruchom `pnpm check`, `pnpm test`, `pnpm build`, a następnie `pnpm package`.
Testy używają atrapy kontekstu i nie sprawdzają aplikacji desktopowej.
Zaimportuj folder `package/` w Settings > Plugins. Plugin z kodem wymaga włączenia
i zatwierdzenia rewizji. Otwórz workspace i uruchom komendę w Commands.
Motyw wybierz w Settings > Themes. Po zmianach zbuduj paczkę, wyłącz stary plugin,
ponów import i zatwierdzenie. W razie potrzeby użyj Restart SimpleBench.
Odbiorca rozpakowuje ZIP przed importem. M1 nie zawiera polecenia `dev`.
