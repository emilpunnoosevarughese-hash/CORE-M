import { create } from 'zustand';
import type { InstalledPlugin } from '../types/manifest';
import { PluginSandbox } from '../runtime/sandbox';
import { PluginLoader } from '../runtime/loader';
import { createApiHandler } from '../api/bridge';

interface PluginState {
  installedPlugins: InstalledPlugin[];
  activeSandboxes: Map<string, PluginSandbox>;
  isMarketplaceOpen: boolean;
  isPluginManagerOpen: boolean;
  
  // Actions
  installPlugin: (baseUrl: string) => Promise<void>;
  uninstallPlugin: (id: string) => void;
  enablePlugin: (id: string) => Promise<void>;
  disablePlugin: (id: string) => void;
  toggleMarketplace: () => void;
  togglePluginManager: () => void;
}

export const usePluginStore = create<PluginState>((set, get) => ({
  installedPlugins: [],
  activeSandboxes: new Map(),
  isMarketplaceOpen: false,
  isPluginManagerOpen: false,

  installPlugin: async (baseUrl) => {
    try {
      const { manifest, code } = await PluginLoader.fetchPlugin(baseUrl);
      
      const isAlreadyInstalled = get().installedPlugins.some(p => p.id === manifest.id);
      if (isAlreadyInstalled) {
        throw new Error(`Plugin ${manifest.name} is already installed.`);
      }

      const installedPlugin: InstalledPlugin = {
        ...manifest,
        installedAt: Date.now(),
        isEnabled: false,
        localPath: baseUrl
      };

      set(state => ({
        installedPlugins: [...state.installedPlugins, installedPlugin]
      }));
      
      // Auto enable after install (optional depending on policy)
      await get().enablePlugin(manifest.id);
    } catch (e) {
      console.error('Failed to install plugin:', e);
    }
  },

  uninstallPlugin: (id) => {
    get().disablePlugin(id);
    set(state => ({
      installedPlugins: state.installedPlugins.filter(p => p.id !== id)
    }));
  },

  enablePlugin: async (id) => {
    const state = get();
    const plugin = state.installedPlugins.find(p => p.id === id);
    if (!plugin) return;
    if (state.activeSandboxes.has(id)) return;

    try {
      // Reload code
      const { code } = await PluginLoader.fetchPlugin(plugin.localPath!);
      
      const sandbox = new PluginSandbox(plugin, createApiHandler());
      await sandbox.start(code);
      
      const sandboxes = new Map(state.activeSandboxes);
      sandboxes.set(id, sandbox);

      set(s => ({
        activeSandboxes: sandboxes,
        installedPlugins: s.installedPlugins.map(p => p.id === id ? { ...p, isEnabled: true } : p)
      }));
    } catch (e) {
      console.error(`Failed to enable plugin ${id}:`, e);
    }
  },

  disablePlugin: (id) => {
    const state = get();
    const sandbox = state.activeSandboxes.get(id);
    if (sandbox) {
      sandbox.stop();
      const sandboxes = new Map(state.activeSandboxes);
      sandboxes.delete(id);
      set(s => ({
        activeSandboxes: sandboxes,
        installedPlugins: s.installedPlugins.map(p => p.id === id ? { ...p, isEnabled: false } : p)
      }));
    }
  },

  toggleMarketplace: () => set(s => ({ isMarketplaceOpen: !s.isMarketplaceOpen })),
  togglePluginManager: () => set(s => ({ isPluginManagerOpen: !s.isPluginManagerOpen }))
}));
