import { InstalledPlugin, PluginPermission } from '../types/manifest';
import { PluginMessage } from '../types/api';
import { globalEventBus } from '../runtime/EventBus';

export class WorkerSandbox {
  private worker: Worker;
  private manifest: InstalledPlugin;
  private subscriptions: Set<string> = new Set();
  public onApiCall?: (api: string, method: string, args: any[]) => Promise<any>;

  constructor(manifest: InstalledPlugin, code: string) {
    this.manifest = manifest;

    // Create a blob URL for the worker code to execute it securely
    // We prepend a setup script to inject the secure PluginAPI global object.
    const setupScript = `
      self.PluginAPI = {
        _callbacks: new Map(),
        _messageId: 0,
        invoke: function(api, method, args) {
          return new Promise((resolve, reject) => {
            const id = String(++this._messageId);
            this._callbacks.set(id, { resolve, reject });
            self.postMessage({ type: 'API_CALL', id, api, method, args });
          });
        },
        events: {
          on: function(event, callback) {
            // Keep track of local callbacks
            if (!this._listeners) this._listeners = new Map();
            if (!this._listeners.has(event)) {
              this._listeners.set(event, new Set());
              self.postMessage({ type: 'EVENT_SUBSCRIBE', event });
            }
            this._listeners.get(event).add(callback);
          },
          off: function(event, callback) {
            if (this._listeners && this._listeners.has(event)) {
              this._listeners.get(event).delete(callback);
              if (this._listeners.get(event).size === 0) {
                 self.postMessage({ type: 'EVENT_UNSUBSCRIBE', event });
              }
            }
          },
          emit: function(event, payload) {
            self.postMessage({ type: 'EVENT_EMIT', event, payload });
          }
        }
      };

      // Restrict environment
      const window = undefined;
      const document = undefined;
      const localStorage = undefined;
      const indexedDB = undefined;

      self.onmessage = function(e) {
        const data = e.data;
        if (data.type === 'API_RESPONSE') {
          const cb = self.PluginAPI._callbacks.get(data.id);
          if (cb) { cb.resolve(data.result); self.PluginAPI._callbacks.delete(data.id); }
        } else if (data.type === 'API_ERROR') {
          const cb = self.PluginAPI._callbacks.get(data.id);
          if (cb) { cb.reject(new Error(data.error)); self.PluginAPI._callbacks.delete(data.id); }
        } else if (data.type === 'EVENT_RECEIVED') {
           if (self.PluginAPI.events._listeners && self.PluginAPI.events._listeners.has(data.event)) {
             self.PluginAPI.events._listeners.get(data.event).forEach(cb => cb(data.payload));
           }
        }
      };
    `;

    const blob = new Blob([setupScript, '\n', code], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);

    this.worker = new Worker(blobUrl);
    
    this.worker.onmessage = this.handleMessage.bind(this);
    
    // Revoke the blob URL to avoid memory leaks
    URL.revokeObjectURL(blobUrl);

    // Initialize the plugin
    this.worker.postMessage({ type: 'PLUGIN_INIT', manifest } as PluginMessage);
  }

  private hasPermission(requiredPerm: PluginPermission): boolean {
    return this.manifest.permissions.includes(requiredPerm);
  }

  private async handleMessage(e: MessageEvent) {
    const msg = e.data as PluginMessage;

    if (msg.type === 'API_CALL') {
      try {
        // PERMISSION CHECKS (Basic Mapping)
        if (msg.api === 'timeline' && msg.method.startsWith('get') && !this.hasPermission('timeline.read')) throw new Error('Missing timeline.read permission');
        if (msg.api === 'timeline' && msg.method.startsWith('set') && !this.hasPermission('timeline.write')) throw new Error('Missing timeline.write permission');
        
        if (this.onApiCall) {
          const result = await this.onApiCall(msg.api, msg.method, msg.args);
          this.worker.postMessage({ type: 'API_RESPONSE', id: msg.id, result } as PluginMessage);
        } else {
          throw new Error('API Handler not attached');
        }
      } catch (err: any) {
        this.worker.postMessage({ type: 'API_ERROR', id: msg.id, error: err.message } as PluginMessage);
      }
    } else if (msg.type === 'EVENT_SUBSCRIBE') {
      const handler = (payload: any) => this.worker.postMessage({ type: 'EVENT_RECEIVED', event: msg.event, payload } as PluginMessage);
      globalEventBus.on(msg.event, handler);
      this.subscriptions.add(msg.event);
    } else if (msg.type === 'EVENT_EMIT') {
      globalEventBus.emit(msg.event, msg.payload);
    }
  }

  public terminate() {
    this.worker.terminate();
    this.subscriptions.clear();
  }
}
