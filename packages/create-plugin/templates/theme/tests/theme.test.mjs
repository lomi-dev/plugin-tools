import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validatePackage } from '@simplebench/plugin-sdk/package';
test('theme is data-only and supports both appearances', async () => {
  const { manifest, files } = await validatePackage('package');
  assert.equal(manifest.entry, undefined);
  const theme = JSON.parse(files.get('theme/theme.jsonc').toString());
  assert.equal(theme.version, 2);
  assert.equal(theme.appearance, 'adaptive');
  assert.ok(theme.light.tokens['--color-primary']);
  assert.ok(theme.dark.tokens['--color-primary']);
  assert.equal([...files.keys()].some(path => /\.m?js$/.test(path)), false);
});
