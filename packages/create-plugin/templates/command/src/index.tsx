import type { PluginContext } from '@simplebench/plugin-sdk';
export function activate(context: PluginContext) {
  context.registerCommand('__ID__.open', () => {
    console.info(context.snapshot().workspaceName ?? 'No workspace selected');
  });
}
