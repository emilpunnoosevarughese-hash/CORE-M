import { InstalledPlugin } from '../types/manifest';
import { PluginMessage } from '../types/api';
import { globalEventBus } from '../runtime/EventBus';

export class IframeSandbox {
  private iframe: HTMLIFrameElement;
  private manifest: InstalledPlugin;
  private subscriptions: Set<string> = new Set();
  public onApiCall?: (api: string, method: string, args: any[]) => Promise<any>;

  constructor(manifest: InstalledPlugin, container: HTMLElement) {
    this.manifest = manifest;
    this.iframe = document.createElement('iframe');
    
    // Hardened Sandbox attributes
    this.iframe.sandbox.add('allow-scripts');
    // We intentionally DO NOT allow 'allow-same-origin'. 
    // This forces the iframe into a unique origin, blocking access to IndexedDB, localStorage, etc.
    
    this.iframe.style.width = '100%';
    this.iframe.style.height = '100%';
    this.iframe.style.border = 'none';
    
    container.appendChild(this.iframe);

    window.addEventListener('message', this.handleWindowMessage.bind(this));

    // Wait for load to inject the API bridge
    this.iframe.onload = () => {
       this.sendMessage({ type: 'PLUGIN_INIT', manifest });
    };

    // Example of a local panel entry
    // In production, this would load a secure blob URL or a specialized local server endpoint
    this.iframe.src = manifest.entry; 
  }

  private sendMessage(msg: PluginMessage) {
    if (this.iframe.contentWindow) {
      this.iframe.contentWindow.postMessage(msg, '*');
    }
  }

  private async handleWindowMessage(e: MessageEvent) {
    if (e.source !== this.iframe.contentWindow) return; // Ignore messages from other iframes
    
    const msg = e.data as PluginMessage;

    if (msg.type === 'API_CALL') {
      try {
        if (this.onApiCall) {
          const result = await this.onApiCall(msg.api, msg.method, msg.args);
          this.sendMessage({ type: 'API_RESPONSE', id: msg.id, result });
        }
      } catch (err: any) {
        this.sendMessage({ type: 'API_ERROR', id: msg.id, error: err.message });
      }
    } else if (msg.type === 'EVENT_SUBSCRIBE') {
      const handler = (payload: any) => this.sendMessage({ type: 'EVENT_RECEIVED', event: msg.event, payload });
      globalEventBus.on(msg.event, handler);
      this.subscriptions.add(msg.event);
    } else if (msg.type === 'EVENT_EMIT') {
      globalEventBus.emit(msg.event, msg.payload);
    }
  }

  public terminate() {
    window.removeEventListener('message', this.handleWindowMessage.bind(this));
    this.subscriptions.clear();
    if (this.iframe.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe);
    }
  }
}
