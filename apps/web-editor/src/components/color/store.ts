import { create } from 'zustand';
import { useTimelineStore } from '@corem/timeline';

export type ColorMode = 'primary' | 'wheels' | 'curves' | 'hsl' | 'lut';

interface ColorState {
  activeMode: ColorMode;
  setActiveMode: (mode: ColorMode) => void;
  updatePrimaryParams: (updates: Record<string, any>) => void;
  // Updates the currently selected clip's primary_color effect
}

export const useColorStore = create<ColorState>((set, get) => ({
  activeMode: 'primary',
  setActiveMode: (mode) => set({ activeMode: mode }),
  
  updatePrimaryParams: (updates) => {
    const timeline = useTimelineStore.getState();
    const clipId = timeline.selection.clipIds[0];
    if (!clipId) return;
    
    const clip = timeline.clips[clipId];
    if (!clip) return;
    
    // Find or create primary_color effect
    const effects = [...(clip.effects || [])];
    let effectIndex = effects.findIndex(e => e.effectId === 'primary_color');
    
    if (effectIndex === -1) {
      effects.push({
        id: crypto.randomUUID(),
        effectId: 'primary_color',
        enabled: true,
        parameters: {}
      });
      effectIndex = effects.length - 1;
    }
    
    // Merge parameters
    effects[effectIndex] = {
      ...effects[effectIndex],
      parameters: {
        ...effects[effectIndex].parameters,
        ...updates
      }
    };
    
    timeline.updateClip(clipId, { effects });
  }
}));
