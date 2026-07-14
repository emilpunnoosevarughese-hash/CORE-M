export interface PluginEventBus {
  on(event: string, callback: (payload: any) => void): void;
  off(event: string, callback: (payload: any) => void): void;
  emit(event: string, payload: any): void;
}

export interface CoreAPI {
  timeline: {
    getPlayhead: () => Promise<number>;
    setPlayhead: (time: number) => Promise<void>;
    addTrack: (type: 'video' | 'audio') => Promise<string>;
    addClip: (trackId: string, assetId: string, startTime: number) => Promise<string>;
  };
  playback: {
    play: () => Promise<void>;
    pause: () => Promise<void>;
    getPlaybackState: () => Promise<'playing' | 'paused' | 'stopped'>;
  };
  assets: {
    getAsset: (id: string) => Promise<any>;
    importAsset: (url: string) => Promise<string>;
  };
  render: {
    queueCommand: (command: any) => Promise<void>;
  };
  ui: {
    showNotification: (message: string, type?: 'info' | 'success' | 'error') => Promise<void>;
    registerPanel: (panelId: string, title: string, renderFnName: string) => Promise<void>;
  };
  events: PluginEventBus;
}

export type PluginMessage = 
  | { type: 'API_CALL'; id: string; api: keyof CoreAPI; method: string; args: any[] }
  | { type: 'API_RESPONSE'; id: string; result: any }
  | { type: 'API_ERROR'; id: string; error: string }
  | { type: 'EVENT_SUBSCRIBE'; event: string }
  | { type: 'EVENT_UNSUBSCRIBE'; event: string }
  | { type: 'EVENT_EMIT'; event: string; payload: any }
  | { type: 'EVENT_RECEIVED'; event: string; payload: any }
  | { type: 'PLUGIN_INIT'; manifest: any }
  | { type: 'PLUGIN_READY' };
