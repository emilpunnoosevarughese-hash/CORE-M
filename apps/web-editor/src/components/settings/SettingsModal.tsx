import React from 'react';
import { createPortal } from 'react-dom';
import { X, Moon, Monitor, Sun, Palette, Keyboard } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export function SettingsModal({ onClose }: Props) {
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-surface">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Palette size={20} className="text-primary" />
            Editor Settings
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-hover rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-8 bg-background">
          
          {/* Theme Section */}
          <section>
            <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-4">Appearance</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">Theme Mode</div>
                  <div className="text-xs text-foreground/50">Select your preferred color scheme</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 rounded-lg border border-primary bg-primary/10 text-primary flex items-center gap-2 text-xs font-medium">
                    <Moon size={14} /> Dark
                  </button>
                  <button disabled className="px-3 py-1.5 rounded-lg border border-border opacity-50 flex items-center gap-2 text-xs font-medium cursor-not-allowed" title="Coming Soon">
                    <Sun size={14} /> Light
                  </button>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-border" />

          {/* Preferences */}
          <section>
            <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-4">Preferences</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="font-medium text-sm">Auto-save</div>
                  <div className="text-xs text-foreground/50">Save projects automatically to the cloud</div>
                </div>
                <div className="relative inline-flex items-center">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-9 h-5 bg-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="font-medium text-sm">Snapping</div>
                  <div className="text-xs text-foreground/50">Snap clips to edges and playhead</div>
                </div>
                <div className="relative inline-flex items-center">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-9 h-5 bg-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </div>
              </label>
            </div>
          </section>

          <hr className="border-border" />

          {/* Keyboard Shortcuts */}
          <section>
            <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Keyboard size={16} /> Keyboard Shortcuts
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex justify-between items-center text-sm bg-surface p-2 rounded border border-border">
                <span>Play / Pause</span>
                <kbd className="px-2 py-1 bg-background rounded border border-border text-xs font-mono text-foreground/70">Space</kbd>
              </div>
              <div className="flex justify-between items-center text-sm bg-surface p-2 rounded border border-border">
                <span>Split Clip</span>
                <kbd className="px-2 py-1 bg-background rounded border border-border text-xs font-mono text-foreground/70">S</kbd>
              </div>
              <div className="flex justify-between items-center text-sm bg-surface p-2 rounded border border-border">
                <span>Undo</span>
                <kbd className="px-2 py-1 bg-background rounded border border-border text-xs font-mono text-foreground/70">Ctrl+Z</kbd>
              </div>
              <div className="flex justify-between items-center text-sm bg-surface p-2 rounded border border-border">
                <span>Redo</span>
                <kbd className="px-2 py-1 bg-background rounded border border-border text-xs font-mono text-foreground/70">Ctrl+Shift+Z</kbd>
              </div>
              <div className="flex justify-between items-center text-sm bg-surface p-2 rounded border border-border">
                <span>Delete</span>
                <kbd className="px-2 py-1 bg-background rounded border border-border text-xs font-mono text-foreground/70">Del</kbd>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>,
    document.body
  );
}
