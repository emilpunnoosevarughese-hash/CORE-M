import React from 'react';
import { PenTool, Circle, Square, MousePointer2 } from 'lucide-react';

export function MaskEditor() {
  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <PenTool className="w-4 h-4 text-primary" />
          Masking
        </h3>
      </div>

      <div className="p-3 grid grid-cols-4 gap-2 border-b border-border">
        <button className="p-2 flex flex-col items-center justify-center gap-1 bg-surface-hover rounded hover:text-primary text-foreground/60 transition-colors" title="Select Mask">
          <MousePointer2 className="w-4 h-4" />
        </button>
        <button className="p-2 flex flex-col items-center justify-center gap-1 bg-primary/20 text-primary rounded transition-colors" title="Pen Tool (Bezier)">
          <PenTool className="w-4 h-4" />
        </button>
        <button className="p-2 flex flex-col items-center justify-center gap-1 bg-surface-hover rounded hover:text-primary text-foreground/60 transition-colors" title="Ellipse Mask">
          <Circle className="w-4 h-4" />
        </button>
        <button className="p-2 flex flex-col items-center justify-center gap-1 bg-surface-hover rounded hover:text-primary text-foreground/60 transition-colors" title="Rectangle Mask">
          <Square className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Mock Active Mask Settings */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Mask 1 (Bezier)</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-foreground/50">Invert</span>
              <input type="checkbox" className="rounded border-border bg-background" />
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-foreground/60">
              <span>Feather</span>
              <span>15px</span>
            </div>
            <input type="range" min="0" max="100" defaultValue="15" className="w-full" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-foreground/60">
              <span>Expansion</span>
              <span>0px</span>
            </div>
            <input type="range" min="-100" max="100" defaultValue="0" className="w-full" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-foreground/60">
              <span>Opacity</span>
              <span>100%</span>
            </div>
            <input type="range" min="0" max="100" defaultValue="100" className="w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
