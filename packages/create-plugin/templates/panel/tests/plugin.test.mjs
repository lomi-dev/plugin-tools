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
    await host.context.executeCommand('__ID__.open');
  assert.deepEqual(host.opened[0].state, { showPath: true });
  assert.match(await host.render(), /Example/);
  assert.match(await host.render(), /\/example/);
  host.setSnapshot({ workspaceName: 'Second workspace', appearance: 'light' });
  assert.match(await host.render(), /Second workspace/);
  assert.match(await host.render(), /light/);
  host.opened[0].state = { showPath: false };
  assert.doesNotMatch(await host.render(), /\/example/);
  await host.context.executeCommand('__ID__.open');
  assert.equal(host.opened.length, 2);
  await host.context.executeCommand('__ID__.open');
  assert.equal(host.opened.length, 2);
    host.setSnapshot({ workspaceName: null });
    await assert.rejects(host.context.executeCommand('__ID__.open'));
  } finally { host.dispose(); }
  assert.equal(host.commands.size, 0);
  assert.equal(host.views.size, 0);
});
