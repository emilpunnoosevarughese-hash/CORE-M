import React from 'react';
import { useColorStore } from './store';
import { useTimelineStore } from '@corem/timeline';

export function PrimaryControls() {
  const { updatePrimaryParams } = useColorStore();
  
  const timeline = useTimelineStore();
  const clipId = timeline.selection.clipIds[0];
  const clip = clipId ? timeline.clips[clipId] : null;
  const primaryEffect = clip?.effects?.find(e => e.effectId === 'primary_color');
  const params = primaryEffect?.parameters || {};

  const handleSliderChange = (paramId: string, value: number) => {
    updatePrimaryParams({ [paramId]: value });
  };

  const controls = [
    { id: 'temperature', label: 'Temp', min: -1, max: 1, step: 0.01, default: 0 },
    { id: 'tint', label: 'Tint', min: -1, max: 1, step: 0.01, default: 0 },
    { id: 'exposure', label: 'Exposure', min: -5, max: 5, step: 0.01, default: 0 },
    { id: 'contrast', label: 'Contrast', min: 0, max: 3, step: 0.01, default: 1 },
    { id: 'saturation', label: 'Saturation', min: 0, max: 3, step: 0.01, default: 1 },
    { id: 'sharpen', label: 'Sharpen', min: 0, max: 100, step: 1, default: 0 },
    { id: 'clarity', label: 'Clarity', min: -100, max: 100, step: 1, default: 0 },
  ];

  if (!clip) {
    return <div className="p-4 text-center text-foreground/50 text-sm">Select a clip to adjust color</div>;
  }

  return (
    <div className="space-y-4 p-4">
      {controls.map(ctrl => (
        <div key={ctrl.id} className="flex items-center space-x-4">
          <label className="w-20 text-xs font-medium text-foreground/80">{ctrl.label}</label>
          <input 
            type="range"
            min={ctrl.min}
            max={ctrl.max}
            step={ctrl.step}
            value={params[ctrl.id] ?? ctrl.default}
            onChange={(e) => handleSliderChange(ctrl.id, parseFloat(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span className="w-12 text-right text-xs font-mono bg-background px-1 py-0.5 rounded border border-border">
            {(params[ctrl.id] ?? ctrl.default).toFixed(2)}
          </span>
        </div>
      ))}
      <div className="pt-4 border-t border-border flex justify-end">
        <button
          onClick={() => {
            const defaults = controls.reduce((acc, ctrl) => ({ ...acc, [ctrl.id]: ctrl.default }), {});
            updatePrimaryParams(defaults);
          }}
          className="text-xs px-3 py-1.5 bg-surface-hover hover:bg-red-500/20 hover:text-red-400 text-foreground/70 rounded transition-colors"
        >
          Reset All
        </button>
      </div>
    </div>
  );
}
