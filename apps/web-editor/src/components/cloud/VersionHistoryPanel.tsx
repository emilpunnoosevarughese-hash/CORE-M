import React, { useEffect, useState } from 'react';
import { useVersionStore } from '@corem/cloud';
import { History, Save, RotateCcw } from 'lucide-react';

export function VersionHistoryPanel({ projectId }: { projectId: string }) {
  const { versions, loadVersions, createVersion, restoreVersion } = useVersionStore();
  const [label, setLabel] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadVersions(projectId);
    }
  }, [projectId, loadVersions]);

  const handleSave = async () => {
    setIsSaving(true);
    await createVersion(projectId, label || undefined);
    setLabel('');
    setIsSaving(false);
  };

  const handleRestore = async (id: string) => {
    if (window.confirm('Restore this version? Unsaved current changes will be lost.')) {
      await restoreVersion(id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface border-l border-border w-full shrink-0">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <History size={16} />
        <h3 className="font-medium">Version History</h3>
      </div>

      <div className="p-4 border-b border-border bg-surface-hover/30 space-y-2">
        <div className="text-xs text-foreground/60 mb-2">Save a manual snapshot of your current timeline state.</div>
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Version label (optional)"
          className="w-full bg-background border border-border rounded p-2 text-xs outline-none focus:border-primary transition-colors"
        />
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:opacity-90 disabled:opacity-50"
        >
          <Save size={14} />
          {isSaving ? 'Saving...' : 'Save Version'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {versions.length === 0 && (
          <div className="text-center text-foreground/40 text-xs py-4">No versions saved yet.</div>
        )}
        
        {versions.map(v => (
          <div key={v.id} className="relative pl-6 pb-4 border-l-2 border-border/50 last:border-0 last:pb-0">
            <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-primary ring-4 ring-surface" />
            
            <div className="bg-background border border-border rounded-lg p-3 group">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs">{v.label || 'Auto-save'}</span>
                <button
                  onClick={() => handleRestore(v.id)}
                  className="p-1 hover:bg-surface-hover rounded text-primary transition-colors opacity-0 group-hover:opacity-100"
                  title="Restore this version"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
              <div className="text-[10px] text-foreground/50">
                {new Date(v.savedAt).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
