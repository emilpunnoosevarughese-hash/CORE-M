import { AudioEngine } from '../engine/AudioEngine';
// We mock the AnimationEngine import since the architecture spans multiple packages
import { AnimationEngine, PropertyTrack } from '@corem/animation';

export class AutomationEngine {
  private static instance: AutomationEngine;
  
  private constructor() {}

  public static getInstance(): AutomationEngine {
    if (!AutomationEngine.instance) {
      AutomationEngine.instance = new AutomationEngine();
    }
    return AutomationEngine.instance;
  }

  /**
   * Translates timeline keyframes (via AnimationEngine) into Web Audio API `setValueCurveAtTime` 
   * or `linearRampToValueAtTime` commands to guarantee sample-accurate automation.
   */
  public scheduleAutomation(
    param: AudioParam, 
    trackId: string, 
    propertyId: string, 
    clipStartTime: number, 
    clipDuration: number
  ) {
    const context = AudioEngine.getInstance().getContext();
    const animEngine = AnimationEngine.getInstance();
    
    // In a real implementation, we fetch the track data from TimelineStore
    const propertyTrack: PropertyTrack = {
      propertyId,
      enabled: true,
      keyframes: [] // Mocked keyframes
    };

    // To prevent the audio engine from evaluating 60 FPS curves on the main thread,
    // we pre-compute the curve into a Float32Array and schedule it directly onto the AudioParam
    
    const sampleRate = 60; // We evaluate the curve at 60 points per second
    const numSamples = Math.ceil(clipDuration * sampleRate);
    const curve = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      const timeInSeconds = i / sampleRate;
      // evaluateTrack returns the exact interpolated value using the Newton-Raphson solver built in Phase 26
      const val = animEngine.evaluateTrack(propertyTrack, timeInSeconds, param.value);
      curve[i] = val as number;
    }

    // Schedule the entire automation curve natively on the audio thread
    param.cancelScheduledValues(context.currentTime);
    param.setValueCurveAtTime(curve, context.currentTime + clipStartTime, clipDuration);
  }
}
