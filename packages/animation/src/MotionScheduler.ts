import { AnimationEngine } from './AnimationEngine';
import { PropertyTrack } from './models';

/**
 * Ensures animations are evaluated optimally before a frame renders.
 * Handles dirty flagging and integrates with hardware scaling.
 */
export class MotionScheduler {
  private static instance: MotionScheduler;
  private engine = AnimationEngine.getInstance();
  
  // Track IDs that have changed and need re-evaluation
  private dirtyTracks: Set<string> = new Set();
  
  private constructor() {}

  public static getInstance(): MotionScheduler {
    if (!MotionScheduler.instance) {
      MotionScheduler.instance = new MotionScheduler();
    }
    return MotionScheduler.instance;
  }

  public markDirty(trackId: string) {
    this.dirtyTracks.add(trackId);
  }

  /**
   * Pre-calculates motion properties for the upcoming frame.
   * Typically called by the RenderEngine's FrameScheduler.
   */
  public prepareFrame(localFrame: number, activeTracks: PropertyTrack[]) {
    // Determine how many samples we need for motion blur based on hardware
    const hardwareTier = this.getHardwareTier();
    let blurSamples = 1;
    
    // Simplistic hardware profile check based on theoretical DeviceProfiler
    if (hardwareTier === 'Ultra') blurSamples = 32;
    else if (hardwareTier === 'High') blurSamples = 16;
    else if (hardwareTier === 'Medium') blurSamples = 8;
    else if (hardwareTier === 'Low') blurSamples = 4;

    // For standard rendering, we just evaluate the exact frame.
    // If motion blur is enabled for a track, we might need to evaluate sub-frames
    // to calculate the velocity derivative.
    
    const results = new Map<string, any>();
    
    for (const track of activeTracks) {
      if (!track.enabled) continue;
      
      const val = this.engine.evaluateTrack(track, localFrame, 0);
      results.set(track.propertyId, val);
      
      // If we need velocity for motion blur (e.g. position changes)
      if (blurSamples > 1 && track.propertyId.includes('position')) {
        // Sample previous sub-frame to get velocity vector
        const prevVal = this.engine.evaluateTrack(track, localFrame - 0.5, 0);
        
        // Compute derivative
        const velocity = {
          x: (val.x || 0) - (prevVal.x || 0),
          y: (val.y || 0) - (prevVal.y || 0)
        };
        
        results.set(`${track.propertyId}_velocity`, velocity);
      }
    }
    
    // Clear dirty flags once processed
    this.dirtyTracks.clear();
    
    return {
      evaluatedProperties: results,
      recommendedBlurSamples: blurSamples
    };
  }
  
  private getHardwareTier(): 'Low' | 'Medium' | 'High' | 'Ultra' {
    // In a full implementation, this queries the DeviceProfiler (Phase 24)
    // We mock it for the architectural implementation.
    return 'High';
  }
}
