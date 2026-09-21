import { useHostContext, type PluginContext, type ViewProps } from '@simplebench/plugin-sdk';
export function WorkspaceInfo({ panel, setState }: ViewProps) {
  const host = useHostContext();
  const showPath = typeof panel.state === 'object' && panel.state !== null && !Array.isArray(panel.state) && panel.state.showPath === true;
  return <section className="lomi-workspace-info">
    <h2>{host.workspaceName ?? 'No workspace selected'}</h2>
    <label><input type="checkbox" checked={showPath} onChange={event => setState({ showPath: event.target.checked })} /> Show project path</label>
    {showPath && <p>{host.projectPath ?? 'No project selected'}</p>}
    <p>Appearance: {host.appearance}</p>
  </section>;
}
export function activate(context: PluginContext) {
  context.registerView('__ID__.view', WorkspaceInfo);
  context.registerCommand('__ID__.open', async () => {
    await context.openView('__ID__.view', { showPath: true });
  });
}
