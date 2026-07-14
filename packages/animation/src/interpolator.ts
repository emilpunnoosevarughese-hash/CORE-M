import type { PropertyTrack, AnimationKeyframe, EasingType } from './models';
import { EasingLibrary, BezierSolver } from './EasingLibrary';

export class Interpolator {
  /**
   * Evaluate a property track at a specific local time.
   * @param track The property track containing keyframes
   * @param localFrame The current frame relative to the clip start
   * @param defaultValue The value to return if there are no keyframes
   */
  static evaluate(track: PropertyTrack | undefined, localFrame: number, defaultValue: any = 0): any {
    if (!track || !track.keyframes || track.keyframes.length === 0) {
      return defaultValue;
    }

    const keyframes = track.keyframes;

    // Before first keyframe
    if (localFrame <= keyframes[0].time) {
      return keyframes[0].value;
    }

    // After last keyframe
    if (localFrame >= keyframes[keyframes.length - 1].time) {
      return keyframes[keyframes.length - 1].value;
    }

    // Binary search (or linear for small arrays) to find the surrounding keyframes
    let kfStart = keyframes[0];
    let kfEnd = keyframes[1];
    
    for (let i = 0; i < keyframes.length - 1; i++) {
      if (localFrame >= keyframes[i].time && localFrame < keyframes[i+1].time) {
        kfStart = keyframes[i];
        kfEnd = keyframes[i+1];
        break;
      }
    }

    const duration = kfEnd.time - kfStart.time;
    if (duration <= 0) return kfEnd.value;

    let normalizedTime = (localFrame - kfStart.time) / duration;

    // Apply easing
    let easedTime = normalizedTime;
    
    if (kfStart.easing === 'hold') {
      easedTime = 0;
    } else if ((kfStart.easing === 'bezier' || kfStart.easing === 'customBezier') && kfStart.outTangent && kfEnd.inTangent) {
      easedTime = BezierSolver.solve(
        normalizedTime,
        kfStart.outTangent.x,
        kfStart.outTangent.y,
        kfEnd.inTangent.x,
        kfEnd.inTangent.y
      );
    } else if (kfStart.easing === 'autoBezier') {
      // Auto Bezier uses standard 0.25 offsets for smooth continuous motion
      easedTime = BezierSolver.solve(normalizedTime, 0.25, 0.1, 0.25, 1.0);
    } else {
      const easingFn = EasingLibrary[kfStart.easing as keyof typeof EasingLibrary] || EasingLibrary.linear;
      easedTime = easingFn(normalizedTime);
    }

    // Interpolate value
    return this.interpolateValue(kfStart.value, kfEnd.value, easedTime);
  }

  private static interpolateValue(startValue: any, endValue: any, t: number): any {
    if (typeof startValue === 'number' && typeof endValue === 'number') {
      return startValue + (endValue - startValue) * t;
    }
    
    // Arrays (e.g. RGB/RGBA colors, or coordinates)
    if (Array.isArray(startValue) && Array.isArray(endValue)) {
      return startValue.map((startV, i) => {
        const endV = endValue[i] ?? startV;
        return startV + (endV - startV) * t;
      });
    }

    // Objects with numeric properties (e.g. {x: 10, y: 20})
    if (typeof startValue === 'object' && startValue !== null && typeof endValue === 'object' && endValue !== null) {
      const result: any = { ...startValue };
      for (const key in startValue) {
        if (typeof startValue[key] === 'number' && typeof endValue[key] === 'number') {
          result[key] = startValue[key] + (endValue[key] - startValue[key]) * t;
        }
      }
      return result;
    }

    // Fallback if types don't match or can't be interpolated
    return t < 0.5 ? startValue : endValue;
  }
}
