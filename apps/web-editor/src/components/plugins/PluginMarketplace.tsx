import React, { useState, useEffect } from 'react';
import { Download, Search, Settings2, Package, Check, Star, Info, ShieldAlert } from 'lucide-react';
import { usePluginStore, type PluginManifest } from '@corem/plugins';

// Mock REST API Contract for the Marketplace
const MOCK_REGISTRY: PluginManifest[] = [
  {
    id: 'com.corem.hello-world',
    name: 'Hello World',
    version: '1.0.0',
    author: 'CORE M Team',
    description: 'A basic worker plugin example that logs to the console and responds to API calls.',
    category: 'developer-tool',
    executionModel: 'worker',
    supportedCoreMVersion: '^1.0.0',
    permissions: [],
    entry: 'blob:mock-hello-world'
  },
  {
    id: 'ai-rotoscoping',
    name: 'AI Auto-Rotoscope',
    author: 'CORE M Team',
    description: 'Automatically mask out subjects with a single click using machine learning.',
    version: '1.2.0',
    category: 'subtitle',
    executionModel: 'worker',
    supportedCoreMVersion: '^1.0.0',
    permissions: ['timeline.read', 'timeline.write', 'ai', 'notifications'],
    entry: 'blob:mock-ai-caption'
  },
  {
    id: 'com.community.lut-pack-vol1',
    name: 'Cinematic LUT Pack Vol 1',
    version: '1.0.0',
    author: 'Colorist Pro',
    description: 'A collection of 20 high quality cinematic LUTs for color grading.',
    category: 'lut-pack',
    executionModel: 'panel',
    supportedCoreMVersion: '^1.0.0',
    permissions: ['render'],
    entry: 'blob:mock-lut-pack'
  }
];

export function PluginMarketplace({ onClose }: { onClose: () => void }) {
  const [search, setSearch] = useState('');
  const { installedPlugins: plugins, installPlugin } = usePluginStore();
  const [installing, setInstalling] = useState<string | null>(null);

  const handleInstall = async (plugin: PluginManifest) => {
    setInstalling(plugin.id);
    try {
      // In a real scenario, this would fetch from the remote REST API `POST /plugins/install`
      // For Phase 23, we mock the local installation by passing the JSON string representation
      await installPlugin(JSON.stringify(plugin));
    } catch (e) {
      console.error(e);
    } finally {
      setInstalling(null);
    }
  };

  const filtered = MOCK_REGISTRY.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-background border-l border-border w-[350px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Package size={18} className="text-primary" />
          <h2 className="text-sm font-semibold">Plugin Marketplace</h2>
        </div>
        <button onClick={onClose} className="text-foreground/50 hover:text-foreground">✕</button>
      </div>

      {/* Search */}
      <div className="p-4 shrink-0 border-b border-border">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
          <input 
            type="text" 
            placeholder="Search plugins..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filtered.map(plugin => {
          const isInstalled = plugins.some(p => p.id === plugin.id);

          return (
            <div key={plugin.id} className="p-4 bg-surface border border-border rounded-xl space-y-3 relative group">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold truncate">{plugin.name}</h3>
                  <p className="text-[10px] text-foreground/50 mt-0.5">by {plugin.author} • v{plugin.version}</p>
                </div>
                {isInstalled ? (
                  <span className="shrink-0 flex items-center gap-1 text-[10px] text-green-500 font-medium px-2 py-1 bg-green-500/10 rounded">
                    <Check size={12} /> Installed
                  </span>
                ) : (
                  <button
                    onClick={() => handleInstall(plugin)}
                    disabled={installing === plugin.id}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
                  >
                    {installing === plugin.id ? <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Download size={14} />}
                    Install
                  </button>
                )}
              </div>
              
              <p className="text-xs text-foreground/70 leading-relaxed">
                {plugin.description}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <span className="text-[10px] px-2 py-0.5 bg-background rounded-full text-foreground/60 border border-border capitalize">
                  {plugin.category.replace('-', ' ')}
                </span>
                
                {plugin.permissions.length > 0 && (
                  <div className="flex items-center gap-1 text-yellow-500 text-[10px]" title={`Requests permissions: ${plugin.permissions.join(', ')}`}>
                    <ShieldAlert size={12} />
                    <span>{plugin.permissions.length} Permissions</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
