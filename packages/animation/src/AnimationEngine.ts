import { PropertyTrack, AnimationKeyframe } from './models';
import { Interpolator } from './interpolator';
import { ExpressionEngine } from './ExpressionEngine';

export class AnimationCache {
  private static instance: AnimationCache;
  private cache: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): AnimationCache {
    if (!AnimationCache.instance) {
      AnimationCache.instance = new AnimationCache();
    }
    return AnimationCache.instance;
  }

  public get(key: string): any | undefined {
    return this.cache.get(key);
  }

  public set(key: string, value: any): void {
    this.cache.set(key, value);
    // basic limit to prevent leaks
    if (this.cache.size > 100000) {
      this.clear();
    }
  }

  public clear(): void {
    this.cache.clear();
  }
}

export class KeyframeManager {
  public static addKeyframe(track: PropertyTrack, keyframe: AnimationKeyframe) {
    const existingIdx = track.keyframes.findIndex(k => k.time === keyframe.time);
    if (existingIdx !== -1) {
      track.keyframes[existingIdx] = keyframe;
    } else {
      track.keyframes.push(keyframe);
      track.keyframes.sort((a, b) => a.time - b.time);
    }
  }

  public static removeKeyframe(track: PropertyTrack, time: number) {
    track.keyframes = track.keyframes.filter(k => k.time !== time);
  }
}

export class AnimationEngine {
  private static instance: AnimationEngine;
  private cache = AnimationCache.getInstance();
  private expressionEngine = ExpressionEngine.getInstance();

  private constructor() {}

  public static getInstance(): AnimationEngine {
    if (!AnimationEngine.instance) {
      AnimationEngine.instance = new AnimationEngine();
    }
    return AnimationEngine.instance;
  }

  public evaluateTrack(track: PropertyTrack, localFrame: number, defaultValue: any): any {
    if (!track || !track.enabled) return defaultValue;

    const cacheKey = `${track.propertyId}_${localFrame}`;
    const cached = this.cache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    let result = defaultValue;

    if (track.expression) {
      // Evaluate expression first, it might override or mix with keyframes
      try {
        const keyframeValue = Interpolator.evaluate(track, localFrame, defaultValue);
        result = this.expressionEngine.evaluate(track.expression, {
          time: localFrame / 60, // Assuming 60fps base for expression 'time'
          value: keyframeValue,
          frame: localFrame
        });
      } catch (e) {
        console.warn(`Expression error on ${track.propertyId}:`, e);
        result = Interpolator.evaluate(track, localFrame, defaultValue);
      }
    } else {
      result = Interpolator.evaluate(track, localFrame, defaultValue);
    }

    this.cache.set(cacheKey, result);
    return result;
  }
}
