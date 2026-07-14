import React from 'react';
import { PenTool, Circle, Square, MousePointer2, Trash2 } from 'lucide-react';
import { useTimelineStore } from '@corem/timeline';

export function MaskEditor() {
  const { selection, clips, updateClip } = useTimelineStore();
  
  const activeClipId = selection.clipIds[0];
  const activeClip = activeClipId ? clips[activeClipId] : null;
  const mask = activeClip?.mask;

  const handleCreateMask = (type: 'rectangle' | 'ellipse') => {
    if (!activeClipId) return;
    updateClip(activeClipId, {
      mask: {
        type,
        x: 0.5,
        y: 0.5,
        width: 0.5,
        height: 0.5,
        feather: 0,
        expansion: 0,
        invert: false
      }
    });
  };

  const handleUpdateMask = (updates: Partial<typeof mask>) => {
    if (!activeClipId || !mask) return;
    updateClip(activeClipId, {
      mask: { ...mask, ...updates }
    });
  };

  const handleDeleteMask = () => {
    if (!activeClipId) return;
    updateClip(activeClipId, { mask: undefined });
  };

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <PenTool className="w-4 h-4 text-primary" />
          Masking
        </h3>
      </div>

      <div className="p-3 grid grid-cols-4 gap-2 border-b border-border">
        <button 
          disabled={!activeClip}
          className="p-2 flex flex-col items-center justify-center gap-1 bg-surface-hover rounded hover:text-primary text-foreground/60 transition-colors disabled:opacity-50" 
          title="Select Mask"
        >
          <MousePointer2 className="w-4 h-4" />
        </button>
        <button 
          disabled={!activeClip}
          className="p-2 flex flex-col items-center justify-center gap-1 bg-surface-hover rounded hover:text-primary text-foreground/60 transition-colors disabled:opacity-50" 
          title="Pen Tool (Bezier)"
        >
          <PenTool className="w-4 h-4" />
        </button>
        <button 
          disabled={!activeClip}
          onClick={() => handleCreateMask('ellipse')}
          className={`p-2 flex flex-col items-center justify-center gap-1 rounded transition-colors disabled:opacity-50 ${mask?.type === 'ellipse' ? 'bg-primary/20 text-primary' : 'bg-surface-hover hover:text-primary text-foreground/60'}`} 
          title="Ellipse Mask"
        >
          <Circle className="w-4 h-4" />
        </button>
        <button 
          disabled={!activeClip}
          onClick={() => handleCreateMask('rectangle')}
          className={`p-2 flex flex-col items-center justify-center gap-1 rounded transition-colors disabled:opacity-50 ${mask?.type === 'rectangle' ? 'bg-primary/20 text-primary' : 'bg-surface-hover hover:text-primary text-foreground/60'}`} 
          title="Rectangle Mask"
        >
          <Square className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {!activeClip ? (
          <div className="text-center text-xs text-foreground/50 mt-10">Select a clip to apply a mask.</div>
        ) : !mask ? (
          <div className="text-center text-xs text-foreground/50 mt-10">No mask applied. Choose a shape above.</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium capitalize">{mask.type} Mask</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-foreground/50">Invert</span>
                  <input 
                    type="checkbox" 
                    checked={mask.invert || false}
                    onChange={(e) => handleUpdateMask({ invert: e.target.checked })}
                    className="rounded border-border bg-background" 
                  />
                </div>
                <button onClick={handleDeleteMask} className="text-red-500 hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-foreground/60">
                <span>Scale Width</span>
                <span>{Math.round((mask.width || 0.5) * 100)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.01" 
                value={mask.width || 0.5} 
                onChange={(e) => handleUpdateMask({ width: parseFloat(e.target.value) })}
                className="w-full accent-primary" 
              />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-foreground/60">
                <span>Scale Height</span>
                <span>{Math.round((mask.height || 0.5) * 100)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.01" 
                value={mask.height || 0.5} 
                onChange={(e) => handleUpdateMask({ height: parseFloat(e.target.value) })}
                className="w-full accent-primary" 
              />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-foreground/60">
                <span>Feather</span>
                <span>{mask.feather || 0}px</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={mask.feather || 0}
                onChange={(e) => handleUpdateMask({ feather: parseFloat(e.target.value) })}
                className="w-full accent-primary" 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
