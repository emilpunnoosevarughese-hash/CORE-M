import React, { useState } from 'react';
import { Pipette } from 'lucide-react';

export function ChromaKeyControls() {
  const [keyColor, setKeyColor] = useState('#00ff00');
  const [similarity, setSimilarity] = useState(40);
  const [smoothness, setSmoothness] = useState(10);
  const [spill, setSpill] = useState(50);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Key Color</span>
        <div className="flex items-center gap-2">
          <button className="p-1.5 bg-surface-hover rounded hover:bg-surface-hover/80 transition-colors" title="Pick Color">
            <Pipette className="w-4 h-4 text-foreground/70" />
          </button>
          <input 
            type="color" 
            value={keyColor}
            onChange={(e) => setKeyColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0" 
          />
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-foreground/60">
          <span>Similarity</span>
          <span>{similarity}%</span>
        </div>
        <input 
          type="range" 
          min="1" 
          max="100" 
          value={similarity}
          onChange={(e) => setSimilarity(Number(e.target.value))}
          className="w-full" 
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-foreground/60">
          <span>Edge Softness</span>
          <span>{smoothness}%</span>
        </div>
        <input 
          type="range" 
          min="1" 
          max="100" 
          value={smoothness}
          onChange={(e) => setSmoothness(Number(e.target.value))}
          className="w-full" 
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-foreground/60">
          <span>Spill Suppression</span>
          <span>{spill}%</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={spill}
          onChange={(e) => setSpill(Number(e.target.value))}
          className="w-full" 
        />
      </div>
    </div>
  );
}
