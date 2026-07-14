import React, { useRef } from 'react';
import { Upload, ImageIcon } from 'lucide-react';
import { useColorStore } from './store';
import { useTimelineStore } from '@corem/timeline';
import { parseCubeLUT } from '@corem/effects';

export function LutBrowser() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timeline = useTimelineStore();
  const clipId = timeline.selection.clipIds[0];
  const clip = clipId ? timeline.clips[clipId] : null;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !clip) return;
    
    try {
      const text = await file.text();
      const parsedLUT = parseCubeLUT(text);
      
      // Update clip's effects with the lut3d effect
      const effects = [...(clip.effects || [])];
      let effectIndex = effects.findIndex(eff => eff.effectId === 'lut3d');
      
      const lutEffect = {
        id: crypto.randomUUID(),
        effectId: 'lut3d',
        enabled: true,
        parameters: {
          intensity: 1.0,
          lut: { data: parsedLUT.data, size: parsedLUT.size }
        }
      };

      if (effectIndex === -1) {
        effects.push(lutEffect);
      } else {
        effects[effectIndex] = lutEffect;
      }
      
      timeline.updateClip(clipId, { effects });

    } catch (err) {
      console.error('Failed to parse LUT', err);
      alert('Failed to parse .cube file');
    }
  };

  if (!clip) return <div className="p-4 flex-1 flex items-center justify-center text-sm text-foreground/50">Select a clip to apply a LUT</div>;

  return (
    <div className="flex-1 p-6 flex flex-col items-center">
      <div className="w-full max-w-md bg-surface p-6 rounded-lg border border-border shadow-sm flex flex-col items-center space-y-6">
        <div className="p-4 bg-primary/10 text-primary rounded-full">
          <ImageIcon size={32} />
        </div>
        
        <div className="text-center space-y-2">
          <h3 className="font-semibold text-lg">Apply 3D LUT</h3>
          <p className="text-sm text-foreground/60">Upload a .cube file to apply a cinematic look to the selected clip.</p>
        </div>

        <input 
          type="file" 
          accept=".cube"
          className="hidden" 
          ref={fileInputRef}
          onChange={handleUpload}
        />
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
        >
          <Upload size={18} className="mr-2" />
          Import .cube File
        </button>

        {/* Intensity slider if a LUT is applied */}
        {clip.effects?.some(e => e.effectId === 'lut3d') && (
          <div className="w-full pt-6 border-t border-border flex flex-col space-y-2">
            <label className="text-sm font-medium">Intensity</label>
            <input 
              type="range"
              min="0"
              max="1"
              step="0.01"
              defaultValue="1"
              onChange={(e) => {
                const intensity = parseFloat(e.target.value);
                const effects = [...(clip.effects || [])];
                const idx = effects.findIndex(eff => eff.effectId === 'lut3d');
                if (idx !== -1) {
                  effects[idx] = {
                    ...effects[idx],
                    parameters: { ...effects[idx].parameters, intensity }
                  };
                  timeline.updateClip(clipId, { effects });
                }
              }}
              className="w-full accent-primary"
            />
          </div>
        )}
      </div>
    </div>
  );
}
