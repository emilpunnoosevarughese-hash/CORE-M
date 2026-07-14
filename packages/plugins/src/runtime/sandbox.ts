import type { PluginManifest } from '../types/manifest';
import type { PluginMessage } from '../types/api';

export class PluginSandbox {
  private worker: Worker | null = null;
  private manifest: PluginManifest;
  private messageCallbacks: Map<string, { resolve: (val: any) => void; reject: (err: any) => void }> = new Map();
  private messageCounter = 0;
  
  // A callback provided by the host environment (coreM) to handle API requests from this plugin
  private apiHandler: (api: string, method: string, args: any[]) => Promise<any>;

  constructor(manifest: PluginManifest, apiHandler: (api: string, method: string, args: any[]) => Promise<any>) {
    this.manifest = manifest;
    this.apiHandler = apiHandler;
  }

  public async start(pluginCode: string) {
    if (this.worker) {
      this.stop();
    }

    // Create a secure worker from Blob
    // We inject a tiny SDK into the worker so the plugin can call coreM.api...
    const workerScript = `
      // coreM Plugin Worker Sandbox
      const coreM = {
        api: {
          __call: (api, method, args) => {
            return new Promise((resolve, reject) => {
              const id = Math.random().toString(36).substr(2, 9);
              self.__callbacks = self.__callbacks || {};
              self.__callbacks[id] = { resolve, reject };
              self.postMessage({ type: 'API_CALL', id, api, method, args });
            });
          },
          timeline: {
            getPlayhead: () => coreM.api.__call('timeline', 'getPlayhead', []),
            setPlayhead: (time) => coreM.api.__call('timeline', 'setPlayhead', [time]),
            addTrack: (type) => coreM.api.__call('timeline', 'addTrack', [type]),
            addClip: (trackId, assetId, startTime) => coreM.api.__call('timeline', 'addClip', [trackId, assetId, startTime]),
          },
          ui: {
            showNotification: (msg, type) => coreM.api.__call('ui', 'showNotification', [msg, type]),
            registerPanel: (panelId, title, renderFnName) => coreM.api.__call('ui', 'registerPanel', [panelId, title, renderFnName])
          }
        }
      };

      self.onmessage = (e) => {
        const msg = e.data;
        if (msg.type === 'PLUGIN_INIT') {
          // Execute the plugin code
          try {
            eval(msg.code);
            self.postMessage({ type: 'PLUGIN_READY' });
          } catch (err) {
            console.error('[PluginSandbox Error]', err);
          }
        } else if (msg.type === 'API_RESPONSE') {
          if (self.__callbacks && self.__callbacks[msg.id]) {
            self.__callbacks[msg.id].resolve(msg.result);
            delete self.__callbacks[msg.id];
          }
        } else if (msg.type === 'API_ERROR') {
          if (self.__callbacks && self.__callbacks[msg.id]) {
            self.__callbacks[msg.id].reject(new Error(msg.error));
            delete self.__callbacks[msg.id];
          }
        }
      };
    `;

    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    this.worker = new Worker(url);

    this.worker.onmessage = this.handleWorkerMessage.bind(this);
    this.worker.onerror = (e) => {
      console.error(`[PluginSandbox] Worker Error in ${this.manifest.name}:`, e.message);
    };

    // Initialize with actual plugin code
    this.worker.postMessage({ type: 'PLUGIN_INIT', code: pluginCode });

    return new Promise<void>((resolve) => {
      const initCheck = (e: MessageEvent) => {
        if (e.data.type === 'PLUGIN_READY') {
          this.worker?.removeEventListener('message', initCheck);
          resolve();
        }
      };
      this.worker?.addEventListener('message', initCheck);
    });
  }

  public stop() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  private async handleWorkerMessage(e: MessageEvent) {
    const msg = e.data as PluginMessage;
    
    if (msg.type === 'API_CALL') {
      try {
        // Enforce permissions here based on msg.api if needed
        const result = await this.apiHandler(msg.api, msg.method, msg.args);
        this.worker?.postMessage({ type: 'API_RESPONSE', id: msg.id, result });
      } catch (err: any) {
        this.worker?.postMessage({ type: 'API_ERROR', id: msg.id, error: err.message });
      }
    }
  }
}
