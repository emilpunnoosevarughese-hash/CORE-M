import React from 'react';
import { useTimelineStore } from '@corem/timeline';
import { EffectRegistry } from '@corem/effects';
import { Settings2, Trash2, Power, GripVertical } from 'lucide-react';

export function EffectInspector() {
  const { selection, clips, updateClip } = useTimelineStore();
  
  if (selection.clipIds.length !== 1) {
    return (
      <div className="flex-1 flex items-center justify-center text-foreground/50 text-sm p-4 text-center">
        Select a single clip to view its effects.
      </div>
    );
  }

  const activeClipId = selection.clipIds[0];
  const clip = clips[activeClipId];
  const effects = clip?.effects || [];

  const handleUpdateParam = (effectIndex: number, paramId: string, value: any) => {
    const newEffects = [...effects];
    newEffects[effectIndex] = {
      ...newEffects[effectIndex],
      parameters: {
        ...newEffects[effectIndex].parameters,
        [paramId]: value
      }
    };
    updateClip(activeClipId, { effects: newEffects });
  };

  const handleToggleEffect = (effectIndex: number) => {
    const newEffects = [...effects];
    newEffects[effectIndex] = {
      ...newEffects[effectIndex],
      enabled: !newEffects[effectIndex].enabled
    };
    updateClip(activeClipId, { effects: newEffects });
  };

  const handleDeleteEffect = (effectIndex: number) => {
    const newEffects = [...effects];
    newEffects.splice(effectIndex, 1);
    updateClip(activeClipId, { effects: newEffects });
  };

  if (effects.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-foreground/50 text-sm p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center border border-dashed border-border">
          <Settings2 size={20} className="opacity-50" />
        </div>
        <p>No effects applied to this clip.</p>
        <p className="text-xs opacity-70">Drag and drop effects from the Effects Library.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-px bg-background">
      {effects.map((effectInst, idx) => {
        const def = EffectRegistry.getEffect(effectInst.effectId);
        if (!def) return null;

        return (
          <div key={`${effectInst.id}_${idx}`} className="bg-surface border-b border-border">
            {/* Effect Header */}
            <div className="flex items-center justify-between p-3 bg-surface-hover/30 group">
              <div className="flex items-center space-x-2">
                <GripVertical size={14} className="text-foreground/30 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity" />
                <button 
                  onClick={() => handleToggleEffect(idx)}
                  className={`p-1 rounded transition-colors ${effectInst.enabled ? 'text-primary hover:bg-primary/10' : 'text-foreground/40 hover:bg-surface'}`}
                >
                  <Power size={14} />
                </button>
                <span className={`text-sm font-semibold ${!effectInst.enabled && 'opacity-50'}`}>
                  {def.name}
                </span>
              </div>
              
              <button 
                onClick={() => handleDeleteEffect(idx)}
                className="p-1.5 text-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Effect Parameters */}
            {effectInst.enabled && (
              <div className="p-4 space-y-4">
                {def.parameters.map(param => {
                  const val = effectInst.parameters[param.id] ?? param.defaultValue;
                  
                  if (param.type === 'float') {
                    return (
                      <div key={param.id} className="space-y-2">
                        <div className="flex justify-between items-end">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => {
                                const propId = `effect.${effectInst.effectId}.${param.id}`;
                                const isAnimated = !!clip.animations?.[propId];
                                const newAnimations = { ...(clip.animations || {}) };
                                
                                if (isAnimated) {
                                  delete newAnimations[propId]; // Remove animation track
                                } else {
                                  newAnimations[propId] = {
                                    propertyId: propId,
                                    keyframes: [{
                                      id: crypto.randomUUID(),
                                      time: useTimelineStore.getState().playhead.currentFrame - clip.start,
                                      value: val as number,
                                      easing: 'easeInOut'
                                    }]
                                  };
                                }
                                updateClip(activeClipId, { animations: newAnimations });
                              }}
                              className={`p-1 rounded transition-colors ${clip.animations?.[`effect.${effectInst.effectId}.${param.id}`] ? 'text-blue-400 bg-blue-500/10' : 'text-foreground/30 hover:bg-surface-hover'}`}
                              title="Toggle Animation (Stopwatch)"
                            >
                              <div className="w-3 h-3 rounded-full border-2 border-current flex items-center justify-center">
                                <div className="w-1 h-1 bg-current rounded-full" />
                              </div>
                            </button>
                            <label className="text-xs font-medium text-foreground/80">{param.name}</label>
                          </div>
                          <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            {Number(val).toFixed(2)}
                          </span>
                        </div>
                        <input 
                          type="range"
                          min={param.min ?? 0}
                          max={param.max ?? 1}
                          step={param.step ?? 0.01}
                          value={val}
                          onChange={(e) => {
                            const numVal = parseFloat(e.target.value);
                            handleUpdateParam(idx, param.id, numVal);
                            
                            // Auto-keyframe if animated
                            const propId = `effect.${effectInst.effectId}.${param.id}`;
                            if (clip.animations?.[propId]) {
                              const localFrame = useTimelineStore.getState().playhead.currentFrame - clip.start;
                              const newAnimations = { ...clip.animations };
                              const track = { ...newAnimations[propId], keyframes: [...newAnimations[propId].keyframes] };
                              
                              // Find existing keyframe at this exact time, or add new
                              const existingIdx = track.keyframes.findIndex((kf: any) => Math.abs(kf.time - localFrame) < 0.1);
                              if (existingIdx >= 0) {
                                track.keyframes[existingIdx] = { ...track.keyframes[existingIdx], value: numVal };
                              } else {
                                track.keyframes.push({
                                  id: crypto.randomUUID(),
                                  time: localFrame,
                                  value: numVal,
                                  easing: 'easeInOut'
                                });
                                track.keyframes.sort((a: any, b: any) => a.time - b.time);
                              }
                              newAnimations[propId] = track;
                              updateClip(activeClipId, { animations: newAnimations });
                            }
                          }}
                          className="w-full accent-primary h-1 bg-background rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full"
                        />
                      </div>
                    );
                  }
                  
                  return (
                    <div key={param.id} className="text-xs text-foreground/50 italic">
                      Unsupported parameter type: {param.type}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
