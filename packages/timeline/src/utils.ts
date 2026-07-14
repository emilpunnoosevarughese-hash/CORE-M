import type { Sequence, Clip, Marker } from './models';

/**
 * findSnapPoint
 * Calculates the closest frame to snap to based on the current playhead, clip edges, and markers.
 * 
 * @param frame - The current frame being dragged/evaluated
 * @param zoomScale - Current zoom scale (pixels per frame)
 * @param tolerancePx - Snapping tolerance in pixels (default 10)
 * @param sequence - The active sequence
 * @param clips - All clips dict
 * @param ignoreClipId - Optional clip ID to ignore (so a clip doesn't snap to itself)
 * @returns The frame to snap to, or the original frame if no snap point is within tolerance
 */
export function findSnapPoint(
  frame: number, 
  zoomScale: number, 
  tolerancePx: number,
  sequence: Sequence, 
  clips: Record<string, Clip>,
  playheadFrame: number,
  ignoreClipId?: string
): number {
  const toleranceFrames = tolerancePx / zoomScale;
  
  let closestFrame = frame;
  let minDistance = toleranceFrames;
  
  const checkSnap = (targetFrame: number) => {
    const dist = Math.abs(frame - targetFrame);
    if (dist < minDistance) {
      minDistance = dist;
      closestFrame = targetFrame;
    }
  };

  // 1. Snap to Playhead
  checkSnap(playheadFrame);

  // 2. Snap to Markers
  sequence.markers.forEach(marker => checkSnap(marker.time));

  // 3. Snap to Clip Edges (Start and End)
  Object.values(clips).forEach(clip => {
    if (clip.id === ignoreClipId) return;
    checkSnap(clip.start);
    checkSnap(clip.start + clip.duration);
  });

  return closestFrame;
}
