import type { PluginContext } from '@lomi-dev/plugin-sdk';
export function activate(context: PluginContext) {
  context.registerCommand('__ID__.open', () => {
    console.info(context.snapshot().workspaceName ?? 'No workspace selected');
  });
}
