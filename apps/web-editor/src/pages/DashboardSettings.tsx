import React, { useState } from 'react';
import { Settings, Moon, Monitor, Palette, Save } from 'lucide-react';

export function DashboardSettings() {
  const [theme, setTheme] = useState('dark');
  const [autoSave, setAutoSave] = useState(true);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard Settings</h1>
      
      <div className="space-y-6">
        {/* Theme Settings */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Palette size={18} className="text-primary" />
            Appearance
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Theme</div>
                <div className="text-sm text-foreground/50">Choose how CORE M looks to you.</div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setTheme('dark')}
                  className={`px-4 py-2 rounded-lg border flex items-center gap-2 text-sm font-medium transition-colors ${theme === 'dark' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-surface-hover'}`}
                >
                  <Moon size={16} /> Dark
                </button>
                <button 
                  onClick={() => setTheme('light')}
                  className={`px-4 py-2 rounded-lg border flex items-center gap-2 text-sm font-medium transition-colors opacity-50 cursor-not-allowed ${theme === 'light' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-surface-hover'}`}
                  title="Coming Soon"
                >
                  <Monitor size={16} /> Light
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Editor Settings */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings size={18} className="text-primary" />
            Editor Preferences
          </h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium">Auto-save Projects</div>
                <div className="text-sm text-foreground/50">Automatically save changes every 5 minutes.</div>
              </div>
              <div className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={autoSave}
                  onChange={(e) => setAutoSave(e.target.checked)}
                />
                <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
