import React from 'react';
import { useColorStore } from './store';
import { useTimelineStore } from '@corem/timeline';
import { Diamond } from 'lucide-react';

// Each control maps a user-friendly UI range to the shader's native range
interface Control {
  id: string;
  label: string;
  uiMin: number; uiMax: number;
  shaderMin: number; shaderMax: number;
  shaderDefault: number;
  step: number;
}

// Normalize UI value → shader value
const toShader = (uiVal: number, ctrl: Control): number => {
  const t = (uiVal - ctrl.uiMin) / (ctrl.uiMax - ctrl.uiMin);
  return ctrl.shaderMin + t * (ctrl.shaderMax - ctrl.shaderMin);
};

// Normalize shader value → UI value
const toUi = (shaderVal: number, ctrl: Control): number => {
  const t = (shaderVal - ctrl.shaderMin) / (ctrl.shaderMax - ctrl.shaderMin);
  return ctrl.uiMin + t * (ctrl.uiMax - ctrl.uiMin);
};

const CONTROLS: Control[] = [
  { id: 'temperature', label: 'Temperature', uiMin: -100, uiMax: 100, shaderMin: -1,   shaderMax: 1,   shaderDefault: 0,  step: 1    },
  { id: 'tint',        label: 'Tint',        uiMin: -100, uiMax: 100, shaderMin: -1,   shaderMax: 1,   shaderDefault: 0,  step: 1    },
  { id: 'exposure',    label: 'Exposure',    uiMin: -5,   uiMax: 5,   shaderMin: -5,   shaderMax: 5,   shaderDefault: 0,  step: 0.01 },
  { id: 'contrast',    label: 'Contrast',    uiMin: -100, uiMax: 100, shaderMin: 0,    shaderMax: 3,   shaderDefault: 1,  step: 1    },
  { id: 'highlights',  label: 'Highlights',  uiMin: -100, uiMax: 100, shaderMin: -0.5, shaderMax: 0.5, shaderDefault: 0,  step: 1    },
  { id: 'shadows',     label: 'Shadows',     uiMin: -100, uiMax: 100, shaderMin: -0.5, shaderMax: 0.5, shaderDefault: 0,  step: 1    },
  { id: 'whites',      label: 'Whites',      uiMin: -100, uiMax: 100, shaderMin: -0.5, shaderMax: 0.5, shaderDefault: 0,  step: 1    },
  { id: 'blacks',      label: 'Blacks',      uiMin: -100, uiMax: 100, shaderMin: -0.5, shaderMax: 0.5, shaderDefault: 0,  step: 1    },
  { id: 'saturation',  label: 'Saturation',  uiMin: -100, uiMax: 100, shaderMin: 0,    shaderMax: 3,   shaderDefault: 1,  step: 1    },
  { id: 'vibrance',    label: 'Vibrance',    uiMin: -100, uiMax: 100, shaderMin: -1,   shaderMax: 1,   shaderDefault: 0,  step: 1    },
  { id: 'sharpen',     label: 'Sharpness',   uiMin: 0,    uiMax: 100, shaderMin: 0,    shaderMax: 100, shaderDefault: 0,  step: 1    },
  { id: 'clarity',     label: 'Clarity',     uiMin: -100, uiMax: 100, shaderMin: -100, shaderMax: 100, shaderDefault: 0,  step: 1    },
  { id: 'dehaze',      label: 'Dehaze',      uiMin: -100, uiMax: 100, shaderMin: -0.5, shaderMax: 0.5, shaderDefault: 0,  step: 1    },
  { id: 'vignette',    label: 'Vignette',    uiMin: -100, uiMax: 100, shaderMin: -1,   shaderMax: 1,   shaderDefault: 0,  step: 1    },
];

export function PrimaryControls() {
  const { updatePrimaryParams } = useColorStore();
  const timeline = useTimelineStore();
  const clipId = timeline.selection.clipIds[0];
  const clip = clipId ? timeline.clips[clipId] : null;
  const primaryEffect = clip?.effects?.find(e => e.effectId === 'primary_color');
  const params = primaryEffect?.parameters || {};
  const currentFrame = timeline.playhead.currentFrame;

  // Write shader-native value to clip state
  const handleSliderChange = (ctrl: Control, uiVal: number) => {
    updatePrimaryParams({ [ctrl.id]: toShader(uiVal, ctrl) });
  };

  const addKeyframe = (ctrl: Control, uiVal: number) => {
    if (!clipId || !clip) return;
    const shaderVal = toShader(uiVal, ctrl);
    const propTrackId = `effect.primary_color.${ctrl.id}`;
    const localFrame = currentFrame - clip.start;
    const animations = { ...(clip.animations || {}) };
    const track = { ...(animations[propTrackId] || { keyframes: [], interpolation: 'bezier' }) };
    const existingIdx = track.keyframes.findIndex((kf: any) => kf.frame === localFrame);
    if (existingIdx >= 0) {
      track.keyframes = [...track.keyframes];
      track.keyframes[existingIdx] = { frame: localFrame, value: shaderVal };
    } else {
      track.keyframes = [...track.keyframes, { frame: localFrame, value: shaderVal }].sort((a: any, b: any) => a.frame - b.frame);
    }
    animations[propTrackId] = track;
    timeline.updateClip(clipId, { animations });
  };

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
            const defaults = CONTROLS.reduce((acc, ctrl) => ({ ...acc, [ctrl.id]: ctrl.shaderDefault }), {});
            updatePrimaryParams(defaults);
          }}
          className="text-[9px] px-2 py-0.5 rounded text-foreground/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          Reset All
        </button>
      </div>

      {/* Sliders */}
      <div className="flex-1 overflow-y-auto py-2 px-3 space-y-0.5">
        {CONTROLS.map(ctrl => {
          // Read stored shader value, convert to UI range for display
          const shaderVal = params[ctrl.id] ?? ctrl.shaderDefault;
          const uiVal = toUi(shaderVal, ctrl);
          const uiDefault = toUi(ctrl.shaderDefault, ctrl);

          const pct = ((uiVal - ctrl.uiMin) / (ctrl.uiMax - ctrl.uiMin)) * 100;
          const hasKeyframes = (clip.animations?.[`effect.primary_color.${ctrl.id}`]?.keyframes?.length ?? 0) > 0;
          const isChanged = Math.abs(shaderVal - ctrl.shaderDefault) > 0.001;

          return (
            <div key={ctrl.id} className="group flex items-center gap-2 py-1.5 hover:bg-white/3 rounded px-1 -mx-1">
              {/* Keyframe button */}
              <button
                onClick={() => addKeyframe(ctrl, uiVal)}
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
                <div className="absolute inset-x-0 h-1 rounded-full bg-white/8">
                  {/* Center marker for bipolar sliders */}
                  {uiDefault === 0 && <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20" />}
                  {/* Fill */}
                  {uiDefault === 0 ? (
                    <div
                      className={`absolute h-full rounded-full ${isChanged ? 'bg-primary' : 'bg-white/15'}`}
                      style={uiVal >= 0
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
                  min={ctrl.uiMin}
                  max={ctrl.uiMax}
                  step={ctrl.step}
                  value={uiVal}
                  onChange={e => handleSliderChange(ctrl, parseFloat(e.target.value))}
                  className="w-full appearance-none bg-transparent relative z-10 h-4 cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm
                    [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white/20
                    [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
                />
              </div>

              {/* Value display (show the UI-friendly number) */}
              <span className={`w-10 text-right text-[10px] font-mono shrink-0 ${isChanged ? 'text-primary' : 'text-foreground/35'}`}>
                {ctrl.step < 0.1 ? uiVal.toFixed(1) : Math.round(uiVal)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
