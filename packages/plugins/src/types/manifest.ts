export type PluginCategory = 
  | 'video-effect' 
  | 'audio-effect' 
  | 'transition'
  | 'color-grading'
  | 'ai-tool'
  | 'export-format'
  | 'template'
  | 'motion-graphics'
  | 'text-preset'
  | 'subtitle'
  | 'font'
  | 'lut-pack'
  | 'sticker'
  | 'icon'
  | 'background'
  | 'media-provider'
  | 'storage-provider'
  | 'importer'
  | 'exporter'
  | 'automation'
  | 'workflow'
  | 'analytics'
  | 'developer-tool'
  | 'other';

export type PluginPermission = 
  | 'timeline.read'
  | 'timeline.write'
  | 'playback.read'
  | 'playback.control'
  | 'asset.read'
  | 'asset.write'
  | 'project.read'
  | 'project.write'
  | 'filesystem.read'
  | 'filesystem.write'
  | 'network'
  | 'clipboard'
  | 'notifications'
  | 'ai'
  | 'cloud'
  | 'export'
  | 'settings'
  | 'render'
  | 'plugins';

export type PluginExecutionModel = 'worker' | 'panel' | 'native';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  license?: string;
  website?: string;
  repository?: string;
  description: string;
  category: PluginCategory;
  executionModel: PluginExecutionModel;
  supportedCoreMVersion: string;
  dependencies?: Record<string, string>;
  permissions: PluginPermission[];
  entry: string; // Path to the entry file (worker JS, or panel HTML)
  icon?: string; // Path to icon
  screenshots?: string[]; // Paths to screenshots
}

export interface InstalledPlugin extends PluginManifest {
  installedAt: number;
  isEnabled: boolean;
  localPath?: string; // For locally installed ZIP plugins
}
