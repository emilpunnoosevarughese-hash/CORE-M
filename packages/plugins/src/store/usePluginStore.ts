import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { InstalledPlugin } from '../types/manifest';
import { PluginLoader } from '../loader/loader';
import { WorkerSandbox } from '../sandbox/WorkerSandbox';
import { IframeSandbox } from '../sandbox/IframeSandbox';
import { globalEventBus } from '../runtime/EventBus';

interface PluginState {
  plugins: InstalledPlugin[];
  activeSandboxes: Map<string, WorkerSandbox | IframeSandbox>;
  
  installPlugin: (urlOrManifestStr: string, isRemote?: boolean) => Promise<void>;
  enablePlugin: (id: string, code?: string) => Promise<void>;
  disablePlugin: (id: string) => void;
  uninstallPlugin: (id: string) => void;
  getPlugin: (id: string) => InstalledPlugin | undefined;
}

export const usePluginStore = create<PluginState>()(
  persist(
    (set, get) => ({
      plugins: [],
      activeSandboxes: new Map(),

      installPlugin: async (urlOrManifestStr: string, isRemote = false) => {
        const manifest = isRemote 
          ? await PluginLoader.loadRemoteManifest(urlOrManifestStr)
          : await PluginLoader.loadLocalManifest(urlOrManifestStr);
          
        const installed: InstalledPlugin = {
          ...manifest,
          installedAt: Date.now(),
          isEnabled: false,
        };

        set((state) => ({
          plugins: [...state.plugins.filter(p => p.id !== installed.id), installed]
        }));
      },

      enablePlugin: async (id: string, code?: string) => {
        const plugin = get().plugins.find(p => p.id === id);
        if (!plugin) throw new Error('Plugin not found');
        if (plugin.isEnabled) return;

        let sandbox: WorkerSandbox | IframeSandbox;

        // In a real implementation, we would pass an API handler here.
        const apiHandler = async (api: string, method: string, args: any[]) => {
          console.log(`[Plugin API] ${plugin.id} calling ${api}.${method}`, args);
          // Stub: returning true for now
          return true;
        };

        if (plugin.executionModel === 'worker') {
          // If code is not provided, we should ideally fetch it from plugin.entry.
          // For now, we assume code is passed if it's a local test plugin.
          sandbox = new WorkerSandbox(plugin, code || 'console.log("Empty plugin")');
          sandbox.onApiCall = apiHandler;
        } else if (plugin.executionModel === 'panel') {
          // Panels should be mounted to a specific DOM node, which usually happens in the React layer.
          // For now, we throw an error if attempted to be instantiated strictly from the headless store,
          // OR we could attach it to a hidden div. Let's just create a generic container for now.
          const container = document.createElement('div');
          container.id = `plugin-panel-${plugin.id}`;
          container.style.display = 'none'; // Hidden by default, UI layer can reparent it
          document.body.appendChild(container);
          
          sandbox = new IframeSandbox(plugin, container);
          sandbox.onApiCall = apiHandler;
        } else {
          throw new Error('Native plugins not yet supported');
        }

        const sandboxes = new Map(get().activeSandboxes);
        sandboxes.set(id, sandbox);

        set((state) => ({
          activeSandboxes: sandboxes,
          plugins: state.plugins.map(p => p.id === id ? { ...p, isEnabled: true } : p)
        }));
        
        globalEventBus.emit('plugin.enabled', { id });
      },

      disablePlugin: (id: string) => {
        const { activeSandboxes, plugins } = get();
        const sandbox = activeSandboxes.get(id);
        
        if (sandbox) {
          sandbox.terminate();
          const newSandboxes = new Map(activeSandboxes);
          newSandboxes.delete(id);
          set({ activeSandboxes: newSandboxes });
        }

        set({
          plugins: plugins.map(p => p.id === id ? { ...p, isEnabled: false } : p)
        });
        
        globalEventBus.emit('plugin.disabled', { id });
      },

      uninstallPlugin: (id: string) => {
        get().disablePlugin(id);
        set((state) => ({
          plugins: state.plugins.filter(p => p.id !== id)
        }));
      },

      getPlugin: (id: string) => get().plugins.find(p => p.id === id)
    }),
    {
      name: 'coreM_PluginStore',
      partialize: (state) => ({ plugins: state.plugins }), // Do not persist sandboxes
    }
  )
);
