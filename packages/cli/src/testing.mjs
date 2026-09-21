import { sdk } from "./project.mjs";
import { pathToFileURL } from "node:url";

export async function createTestHost(manifest, initial = {}) {
  const api = await sdk(process.cwd());
  api.parsePlugin(manifest);
  const snapshot = {
    projectPath: "/example",
    workspaceName: "Example",
    activePanelId: null,
    viewType: null,
    appearance: "dark",
    themeRevision: 1,
    ...initial,
  };
  const views = new Map(),
    commands = new Map(),
    fills = new Map(),
    opened = [],
    disposers = new Set(),
    listeners = new Map(),
    viewWorkspaces = new Map();
  const controller = new AbortController();
  const add = (callback) => {
    if (controller.signal.aborted)
      throw new Error("Plugin context is disposed.");
    let active = true;
    const dispose = () => {
      if (active) {
        active = false;
        disposers.delete(dispose);
        callback();
      }
    };
    disposers.add(dispose);
    return dispose;
  };
  const register = (kind, registry, id, value) => {
    if (
      controller.signal.aborted ||
      !manifest.contributes?.[kind]?.some((v) => v.id === id) ||
      registry.has(id)
    )
      throw new Error(`Undeclared, duplicate or disposed registration: ${id}`);
    registry.set(id, value);
    return add(() => registry.delete(id));
  };
  const context = {
    id: manifest.id,
    signal: controller.signal,
    snapshot: () => ({ ...snapshot }),
    add,
    registerView: (id, view) => register("views", views, id, view),
    registerCommand: (id, handler) =>
      register("commands", commands, id, handler),
    registerFill: (id, fill) => register("fills", fills, id, fill),
    registerDirtyView() {
      throw new Error(
        "Dirty view close dialogs require a desktop integration test.",
      );
    },
    async openView(id, state = null) {
      if (!views.has(id) || controller.signal.aborted)
        throw new Error(`View is not registered: ${id}`);
      api.jsonState(state);
      const definition = manifest.contributes.views.find((v) => v.id === id);
      const workspaceKey = JSON.stringify([
        snapshot.projectPath,
        snapshot.workspaceName,
      ]);
      const previous = opened.find(
        (v) => v.viewType === id && viewWorkspaces.get(v.id) === workspaceKey,
      );
      if (!definition.multiple && previous) return previous.id;
      const panel = {
        type: "plugin",
        id: `test-panel-${opened.length}`,
        title: definition.title,
        owner: manifest.id,
        viewType: id,
        stateVersion: definition.stateVersion,
        state: structuredClone(state),
      };
      opened.push(panel);
      viewWorkspaces.set(panel.id, workspaceKey);
      return panel.id;
    },
    async executeCommand(id) {
      const definition = manifest.contributes?.commands?.find(
        (v) => v.id === id,
      );
      if (
        !commands.has(id) ||
        controller.signal.aborted ||
        (definition?.context?.workspace && !snapshot.workspaceName) ||
        (definition?.context?.viewTypes &&
          !definition.context.viewTypes.includes(snapshot.viewType))
      )
        throw new Error(`Command is unavailable: ${id}`);
      await commands.get(id)();
    },
    subscribe(event, handler) {
      if (controller.signal.aborted)
        throw new Error("Plugin context is disposed.");
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(handler);
      return add(() => listeners.get(event).delete(handler));
    },
    interval(callback, milliseconds) {
      if (controller.signal.aborted)
        throw new Error("Plugin context is disposed.");
      const timer = setInterval(callback, milliseconds);
      return add(() => clearInterval(timer));
    },
    assetUrl(path) {
      api.packagePath(path);
      return `https://plugin.invalid/${manifest.id}/${path}`;
    },
  };
  const symbol = Symbol.for("simplebench.plugin-api.v1");
  const previous = globalThis[symbol];
  let React, HostContext;
  if (manifest.entry) {
    const load = async (name) =>
      import(pathToFileURL(api.require.resolve(name)).href);
    React = await load("react");
    HostContext = React.createContext(snapshot);
    globalThis[symbol] = {
      react: React,
      reactDOM: await load("react-dom"),
      reactDOMClient: await load("react-dom/client"),
      jsx: await load("react/jsx-runtime"),
      jsxDev: await load("react/jsx-dev-runtime"),
      sdk: { HostContext, useHostContext: () => React.useContext(HostContext) },
    };
  }
  return {
    context,
    views,
    commands,
    fills,
    opened,
    setSnapshot(value) {
      Object.assign(snapshot, value);
      for (const handler of listeners.get("context") ?? [])
        handler({ ...snapshot });
    },
    async render(panel = opened[0]) {
      const { renderToStaticMarkup } = await import(
        pathToFileURL(api.require.resolve("react-dom/server")).href
      );
      return renderToStaticMarkup(
        React.createElement(
          HostContext.Provider,
          { value: { ...snapshot } },
          React.createElement(views.get(panel.viewType), {
            panel,
            active: true,
            setState: (value) => {
              api.jsonState(value);
              panel.state = value;
            },
            onFocus() {},
            onClose() {},
          }),
        ),
      );
    },
    dispose() {
      controller.abort();
      const errors = [];
      for (const dispose of [...disposers].reverse()) {
        try {
          dispose();
        } catch (error) {
          errors.push(error);
        }
      }
      if (previous === undefined) delete globalThis[symbol];
      else globalThis[symbol] = previous;
      if (errors.length)
        throw new AggregateError(errors, "Test cleanup failed.");
    },
  };
}
