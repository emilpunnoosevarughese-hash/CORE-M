import { MotionPreset, PropertyTrack } from './models';

export class PresetLibrary {
  private static instance: PresetLibrary;
  private presets: Map<string, MotionPreset> = new Map();

  private constructor() {
    this.registerDefaultPresets();
  }

  public static getInstance(): PresetLibrary {
    if (!PresetLibrary.instance) {
      PresetLibrary.instance = new PresetLibrary();
    }
    return PresetLibrary.instance;
  }

  private registerDefaultPresets() {
    this.register({
      id: 'fade-in',
      name: 'Fade In',
      description: 'Smoothly fades the layer opacity from 0 to 100.',
      type: 'transform',
      apply: (targetId: string, tracks: Map<string, PropertyTrack>) => {
        tracks.set('opacity', {
          propertyId: 'opacity',
          enabled: true,
          keyframes: [
            { id: 'k1', time: 0, value: 0, easing: 'easeOut' },
            { id: 'k2', time: 30, value: 1, easing: 'hold' }
          ]
        });
      }
    });

    this.register({
      id: 'slide-up',
      name: 'Slide Up',
      description: 'Slides the layer up while fading in.',
      type: 'transform',
      apply: (targetId: string, tracks: Map<string, PropertyTrack>) => {
        tracks.set('position.y', {
          propertyId: 'position.y',
          enabled: true,
          keyframes: [
            { id: 'k1', time: 0, value: 100, easing: 'easeOut' }, // 100px offset down
            { id: 'k2', time: 30, value: 0, easing: 'hold' }
          ]
        });
        tracks.set('opacity', {
          propertyId: 'opacity',
          enabled: true,
          keyframes: [
            { id: 'k3', time: 0, value: 0, easing: 'easeOut' },
            { id: 'k4', time: 30, value: 1, easing: 'hold' }
          ]
        });
      }
    });

    this.register({
      id: 'bounce-in',
      name: 'Bounce In',
      description: 'Scales the layer up with a spring bounce effect.',
      type: 'transform',
      apply: (targetId: string, tracks: Map<string, PropertyTrack>) => {
        tracks.set('scale', {
          propertyId: 'scale',
          enabled: true,
          keyframes: [
            { id: 'k1', time: 0, value: { x: 0, y: 0 }, easing: 'bounce' },
            { id: 'k2', time: 45, value: { x: 1, y: 1 }, easing: 'hold' }
          ]
        });
      }
    });

    this.register({
      id: 'glitch',
      name: 'Glitch Displacement',
      description: 'Applies a fast, randomized displacement expression.',
      type: 'effect',
      apply: (targetId: string, tracks: Map<string, PropertyTrack>) => {
        tracks.set('position', {
          propertyId: 'position',
          enabled: true,
          expression: 'wiggle(24, 20)', // frequency 24, amplitude 20
          keyframes: []
        });
      }
    });

    this.register({
      id: 'typewriter',
      name: 'Typewriter',
      description: 'Reveals text character by character sequentially.',
      type: 'text',
      apply: (targetId: string, tracks: Map<string, PropertyTrack>) => {
        tracks.set('text.animator.opacity', {
          propertyId: 'text.animator.opacity',
          enabled: true,
          keyframes: [
            { id: 'k1', time: 0, value: 0, easing: 'linear' },
            { id: 'k2', time: 60, value: 1, easing: 'hold' }
          ]
        });
        tracks.set('text.animator.mode', {
          propertyId: 'text.animator.mode',
          enabled: true,
          keyframes: [{ id: 'k_mode', time: 0, value: 'character_sequential', easing: 'hold' }]
        });
      }
    });
  }

  public register(preset: MotionPreset) {
    this.presets.set(preset.id, preset);
  }

  public getPresets(): MotionPreset[] {
    return Array.from(this.presets.values());
  }

  public applyPreset(presetId: string, targetId: string, tracks: Map<string, PropertyTrack>) {
    const preset = this.presets.get(presetId);
    if (preset) {
      preset.apply(targetId, tracks);
    }
  }
}
