import { PluginManifest } from './manifest';

export interface PluginLifecycleHooks {
  onInstall?: (manifest: PluginManifest) => Promise<void> | void;
  onEnable?: () => Promise<void> | void;
  onDisable?: () => Promise<void> | void;
  onUnload?: () => Promise<void> | void;
  onProjectOpen?: (projectId: string) => Promise<void> | void;
  onProjectClose?: (projectId: string) => Promise<void> | void;
  onTimelineChanged?: () => Promise<void> | void;
  onSelectionChanged?: (selectedIds: string[]) => Promise<void> | void;
  onPlaybackChanged?: (state: 'playing' | 'paused' | 'stopped') => Promise<void> | void;
  onExportStarted?: (config: any) => Promise<void> | void;
  onExportFinished?: (url: string) => Promise<void> | void;
}
