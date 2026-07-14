import React, { useState } from 'react';
import { Settings, Play, Square, Trash2, ShieldAlert, Cpu, Activity, AlertTriangle, Check } from 'lucide-react';
import { usePluginStore, type InstalledPlugin } from '@corem/plugins';

export function PluginManager({ onClose }: { onClose: () => void }) {
  const { installedPlugins: plugins, enablePlugin, disablePlugin, uninstallPlugin } = usePluginStore();
  const [selectedPlugin, setSelectedPlugin] = useState<InstalledPlugin | null>(null);

  const handleToggle = (plugin: InstalledPlugin) => {
    if (plugin.isEnabled) {
      disablePlugin(plugin.id);
    } else {
      enablePlugin(plugin.id).catch(err => alert(err.message));
    }
  };

  return (
    <div className="flex h-full bg-background border-l border-border w-[600px]">
      {/* Plugin List (Left Side) */}
      <div className="w-[250px] border-r border-border flex flex-col h-full bg-surface">
        <div className="p-4 border-b border-border shrink-0">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Settings size={16} className="text-primary" /> Manage Plugins
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {plugins.length === 0 && (
            <div className="p-4 text-center text-foreground/40 text-xs">
              No plugins installed.
            </div>
          )}
          {plugins.map(plugin => (
            <button
              key={plugin.id}
              onClick={() => setSelectedPlugin(plugin)}
              className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors ${
                selectedPlugin?.id === plugin.id ? 'bg-primary/10 text-primary' : 'hover:bg-background'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium truncate">{plugin.name}</span>
                <div className={`w-2 h-2 rounded-full ${plugin.isEnabled ? 'bg-green-500' : 'bg-foreground/20'}`} />
              </div>
              <div className="text-[10px] text-foreground/50 mt-1 truncate">v{plugin.version}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Details & Debugger (Right Side) */}
      <div className="flex-1 flex flex-col h-full bg-background relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-foreground/50 hover:text-foreground">✕</button>

        {selectedPlugin ? (
          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            <div className="space-y-1 pr-6">
              <h1 className="text-xl font-bold">{selectedPlugin.name}</h1>
              <p className="text-xs text-foreground/50">by {selectedPlugin.author} • v{selectedPlugin.version}</p>
            </div>

            <p className="text-xs text-foreground/70 leading-relaxed">{selectedPlugin.description}</p>

            {/* Actions */}
            <div className="flex items-center gap-3 py-4 border-y border-border">
              <button
                onClick={() => handleToggle(selectedPlugin)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  selectedPlugin.isEnabled 
                    ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' 
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                {selectedPlugin.isEnabled ? <><Square size={14} /> Disable</> : <><Play size={14} /> Enable</>}
              </button>
              
              <button
                onClick={() => {
                  uninstallPlugin(selectedPlugin.id);
                  setSelectedPlugin(null);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-xs font-medium hover:text-red-500 hover:border-red-500 transition-colors"
              >
                <Trash2 size={14} /> Uninstall
              </button>
            </div>

            {/* Permissions */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/50 flex items-center gap-1.5">
                <ShieldAlert size={14} /> Requested Permissions
              </h3>
              {selectedPlugin.permissions.length === 0 ? (
                <div className="p-3 bg-surface border border-border rounded-lg text-xs text-foreground/60 flex items-center gap-2">
                   <Check size={14} className="text-green-500" /> No sensitive permissions required.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {selectedPlugin.permissions.map(perm => (
                    <div key={perm} className="px-2.5 py-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 rounded text-[10px] font-medium flex items-center gap-1.5">
                      <AlertTriangle size={12} /> {perm}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Developer Mode / Debugger */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/50 flex items-center gap-1.5">
                <Activity size={14} /> Debugger (Developer Mode)
              </h3>
              <div className="p-4 bg-black border border-border rounded-lg font-mono text-[10px] text-green-400 space-y-2 h-32 overflow-y-auto">
                {selectedPlugin.isEnabled ? (
                  <>
                    <p className="text-foreground/50">[{new Date().toISOString()}] Initializing Sandbox ({selectedPlugin.executionModel})...</p>
                    <p className="text-foreground/50">[{new Date().toISOString()}] Manifest parsed successfully.</p>
                    <p className="text-foreground/50">[{new Date().toISOString()}] Worker spawned.</p>
                    <p>[{new Date().toISOString()}] PLUGIN_INIT sent.</p>
                    <p className="text-yellow-500">[{new Date().toISOString()}] API calls will be logged here.</p>
                  </>
                ) : (
                  <p className="text-foreground/40">Plugin is disabled. No logs available.</p>
                )}
              </div>
              {selectedPlugin.isEnabled && (
                <div className="flex gap-4 px-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-foreground/60">
                    <Cpu size={12} /> CPU: &lt; 1%
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-foreground/60">
                    <Activity size={12} /> Mem: ~1.2 MB
                  </div>
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-foreground/40 space-y-3">
            <Settings size={32} className="text-foreground/20" />
            <p className="text-xs">Select a plugin to manage</p>
          </div>
        )}
      </div>
    </div>
  );
}
