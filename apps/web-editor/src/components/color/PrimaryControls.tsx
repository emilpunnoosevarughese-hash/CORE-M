import React from 'react';
import { useColorStore } from './store';
import { useTimelineStore } from '@corem/timeline';
import { Diamond } from 'lucide-react';

export function PrimaryControls() {
  const { updatePrimaryParams } = useColorStore();
  
  const timeline = useTimelineStore();
  const clipId = timeline.selection.clipIds[0];
  const clip = clipId ? timeline.clips[clipId] : null;
  const primaryEffect = clip?.effects?.find(e => e.effectId === 'primary_color');
  const params = primaryEffect?.parameters || {};
  const currentFrame = timeline.playhead.currentFrame;

  const handleSliderChange = (paramId: string, value: number) => {
    updatePrimaryParams({ [paramId]: value });
  };

  const addKeyframe = (paramId: string, value: number) => {
    if (!clipId || !clip) return;
    const propTrackId = `effect.primary_color.${paramId}`;
    const localFrame = currentFrame - clip.start;
    const animations = { ...(clip.animations || {}) };
    const track = animations[propTrackId] || { keyframes: [], interpolation: 'bezier' };
    const existingIdx = track.keyframes.findIndex((kf: any) => kf.frame === localFrame);
    if (existingIdx >= 0) {
      track.keyframes[existingIdx] = { frame: localFrame, value };
    } else {
      track.keyframes = [...track.keyframes, { frame: localFrame, value }].sort((a: any, b: any) => a.frame - b.frame);
    }
    animations[propTrackId] = track;
    timeline.updateClip(clipId, { animations });
  };

  const controls = [
    { id: 'temperature', label: 'Temperature', min: -100, max: 100, step: 1, default: 0, unit: '' },
    { id: 'tint', label: 'Tint', min: -100, max: 100, step: 1, default: 0, unit: '' },
    { id: 'exposure', label: 'Exposure', min: -5, max: 5, step: 0.01, default: 0, unit: '' },
    { id: 'contrast', label: 'Contrast', min: -100, max: 100, step: 1, default: 0, unit: '' },
    { id: 'highlights', label: 'Highlights', min: -100, max: 100, step: 1, default: 0, unit: '' },
    { id: 'shadows', label: 'Shadows', min: -100, max: 100, step: 1, default: 0, unit: '' },
    { id: 'whites', label: 'Whites', min: -100, max: 100, step: 1, default: 0, unit: '' },
    { id: 'blacks', label: 'Blacks', min: -100, max: 100, step: 1, default: 0, unit: '' },
    { id: 'saturation', label: 'Saturation', min: -100, max: 100, step: 1, default: 0, unit: '' },
    { id: 'vibrance', label: 'Vibrance', min: -100, max: 100, step: 1, default: 0, unit: '' },
    { id: 'sharpen', label: 'Sharpness', min: 0, max: 100, step: 1, default: 0, unit: '' },
    { id: 'clarity', label: 'Clarity', min: -100, max: 100, step: 1, default: 0, unit: '' },
    { id: 'dehaze', label: 'Dehaze', min: -100, max: 100, step: 1, default: 0, unit: '' },
    { id: 'vignette', label: 'Vignette', min: -100, max: 100, step: 1, default: 0, unit: '' },
  ];

  if (!clip) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8 px-4 gap-3">
        <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center">
          <Diamond size={18} className="text-foreground/30" />
        </div>
        <p className="text-xs text-foreground/40 text-center">Select a clip in the timeline<br/>to adjust its color</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-8 border-b border-border px-3 flex items-center justify-between shrink-0">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-foreground/50">
          Basic Adjustments
        </span>
        <button
          onClick={() => {
            const defaults = controls.reduce((acc, ctrl) => ({ ...acc, [ctrl.id]: ctrl.default }), {});
            updatePrimaryParams(defaults);
          }}
          className="text-[9px] px-2 py-0.5 rounded text-foreground/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          Reset All
        </button>
      </div>

      {/* Sliders */}
      <div className="flex-1 overflow-y-auto py-2 px-3 space-y-0.5">
        {controls.map(ctrl => {
          const val = params[ctrl.id] ?? ctrl.default;
          const pct = ((val - ctrl.min) / (ctrl.max - ctrl.min)) * 100;
          const hasKeyframes = clip.animations?.[`effect.primary_color.${ctrl.id}`]?.keyframes?.length > 0;
          const isChanged = val !== ctrl.default;

          return (
            <div key={ctrl.id} className="group flex items-center gap-2 py-1.5 hover:bg-white/3 rounded px-1 -mx-1">
              {/* Keyframe button */}
              <button
                onClick={() => addKeyframe(ctrl.id, val)}
                title="Add keyframe at current frame"
                className={`shrink-0 w-4 h-4 flex items-center justify-center rounded transition-colors ${
                  hasKeyframes ? 'text-amber-400 hover:text-amber-300' : 'text-foreground/20 hover:text-amber-400/70'
                }`}
              >
                <Diamond size={9} fill={hasKeyframes ? 'currentColor' : 'none'} />
              </button>

              {/* Label */}
              <label className="w-20 text-[11px] text-foreground/70 shrink-0 truncate">{ctrl.label}</label>

              {/* Slider */}
              <div className="flex-1 relative h-4 flex items-center">
                {/* Track */}
                <div className="absolute inset-x-0 h-1 rounded-full bg-white/8">
                  {/* Center line for bipolar sliders */}
                  {ctrl.default === 0 && <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20" />}
                  {/* Fill */}
                  {ctrl.default === 0 ? (
                    <div
                      className={`absolute h-full rounded-full ${isChanged ? 'bg-primary' : 'bg-white/15'}`}
                      style={val >= 0
                        ? { left: '50%', width: `${pct - 50}%` }
                        : { right: '50%', width: `${50 - pct}%` }
                      }
                    />
                  ) : (
                    <div
                      className={`absolute h-full rounded-full ${isChanged ? 'bg-primary' : 'bg-white/15'}`}
                      style={{ width: `${pct}%` }}
                    />
                  )}
                </div>
                <input
                  type="range"
                  min={ctrl.min}
                  max={ctrl.max}
                  step={ctrl.step}
                  value={val}
                  onChange={e => handleSliderChange(ctrl.id, parseFloat(e.target.value))}
                  className="w-full appearance-none bg-transparent relative z-10 h-4 cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm
                    [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white/20
                    [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
                />
              </div>

              {/* Value display */}
              <span className={`w-10 text-right text-[10px] font-mono shrink-0 ${isChanged ? 'text-primary' : 'text-foreground/35'}`}>
                {ctrl.step < 0.1 ? val.toFixed(2) : Math.round(val)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
