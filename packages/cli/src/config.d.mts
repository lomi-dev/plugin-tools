export interface PluginConfig {
  entry?: string;
  manifest?: string;
  assets?: string[];
}
export declare function defineConfig(config: PluginConfig): PluginConfig;
