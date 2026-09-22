# Plugin CLI

Follow CONTRIBUTING.md. This repository owns the CLI and the Workspace info example.
SDK source belongs to plugin-sdk; generator and templates belong to create-lomi-plugin.
Do not copy their sources here. Test candidate CLI archives with the exact npm
generator pinned in generator-source.json, verifying its integrity before use.
Preserve user files and existing runtime compatibility. Desktop qualification is
separate from in-memory helper tests and mocked browser tests.
