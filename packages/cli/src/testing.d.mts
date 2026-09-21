import type {
  PluginManifest,
  HostSnapshot,
  PluginContext,
  PanelDescriptor,
} from "@simplebench/plugin-sdk";
export declare function createTestHost(
  manifest: PluginManifest,
  initial?: Partial<HostSnapshot>,
): Promise<{
  context: PluginContext;
  views: Map<string, unknown>;
  commands: Map<string, () => unknown>;
  fills: Map<string, unknown>;
  opened: PanelDescriptor[];
  setSnapshot(value: Partial<HostSnapshot>): void;
  render(panel?: PanelDescriptor): Promise<string>;
  dispose(): void;
}>;
