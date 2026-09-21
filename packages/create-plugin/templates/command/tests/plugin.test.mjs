import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createTestHost } from '@lomi-dev/plugin-cli/testing';
test('activation, command behavior and cleanup', async () => {
  const manifest = JSON.parse(await readFile('plugin.json', 'utf8'));
  const host = await createTestHost(manifest);
  try {
    const { activate } = await import('../package/dist/index.js');
    await activate(host.context);
    assert.throws(() => host.context.registerCommand('__ID__.undeclared', () => {}));
    const logs = [];
  const previous = console.info;
  console.info = (message) => logs.push(message);
  try { await host.context.executeCommand('__ID__.open'); } finally { console.info = previous; }
  assert.deepEqual(logs, ['Example']);
    host.setSnapshot({ workspaceName: null });
    await assert.rejects(host.context.executeCommand('__ID__.open'));
  } finally { host.dispose(); }
  assert.equal(host.commands.size, 0);
  assert.equal(host.views.size, 0);
});
