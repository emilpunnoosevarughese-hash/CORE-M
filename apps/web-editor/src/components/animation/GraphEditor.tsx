import React, { useRef, useEffect, useState } from 'react';
import { useTimelineStore } from '@corem/timeline';
import type { PropertyTrack, AnimationKeyframe } from '@corem/animation';

export function GraphEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeline = useTimelineStore();
  
  // Try to find an active animated property
  // For MVP, we'll just look at the first selected clip
  const clipId = timeline.selection.clipIds[0];
  const clip = clipId ? timeline.clips[clipId] : null;
  const animations = clip?.animations || {};
  
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);

  // Auto-select first animated property if none selected
  useEffect(() => {
    const props = Object.keys(animations);
    if (props.length > 0 && (!activePropertyId || !props.includes(activePropertyId))) {
      setActivePropertyId(props[0]);
    } else if (props.length === 0) {
      setActivePropertyId(null);
    }
  }, [animations, activePropertyId]);

  const activeTrack = activePropertyId ? animations[activePropertyId] : null;

  // Render Graph
  useEffect(() => {
    if (!canvasRef.current || !activeTrack || !clip) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = canvasRef.current;
    
    // Clear
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < 4; i++) {
      ctx.moveTo(0, height * (i/4));
      ctx.lineTo(width, height * (i/4));
    }
    ctx.stroke();

    const keyframes = activeTrack.keyframes;
    if (keyframes.length === 0) return;

    // Determine value bounds
    let minVal = keyframes[0].value;
    let maxVal = keyframes[0].value;
    for (const kf of keyframes) {
      if (kf.value < minVal) minVal = kf.value;
      if (kf.value > maxVal) maxVal = kf.value;
    }
    const valRange = Math.max(maxVal - minVal, 1);
    
    // Determine time bounds (clip duration)
    const timeRange = clip.duration;

    const getX = (time: number) => (time / timeRange) * width;
    const getY = (val: number) => height - ((val - minVal) / valRange) * height * 0.8 - height * 0.1;

    // Draw Line
    ctx.strokeStyle = '#00a8ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    ctx.moveTo(getX(keyframes[0].time), getY(keyframes[0].value));
    
    for (let i = 0; i < keyframes.length - 1; i++) {
      const kf1 = keyframes[i];
      const kf2 = keyframes[i+1];
      
      const x1 = getX(kf1.time);
      const y1 = getY(kf1.value);
      const x2 = getX(kf2.time);
      const y2 = getY(kf2.value);

      if (kf1.easing === 'bezier' && kf1.outTangent && kf2.inTangent) {
        // Draw bezier
        const cp1x = x1 + kf1.outTangent.x * (x2 - x1);
        const cp1y = y1 + kf1.outTangent.y * (y2 - y1);
        const cp2x = x2 - (1 - kf2.inTangent.x) * (x2 - x1);
        const cp2y = y2 + kf2.inTangent.y * (y2 - y1);
        
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
      } else {
        // Draw straight line for linear / approximated others
        ctx.lineTo(x2, y2);
      }
    }
    ctx.stroke();

    // Draw Points
    ctx.fillStyle = 'white';
    for (const kf of keyframes) {
      ctx.beginPath();
      ctx.arc(getX(kf.time), getY(kf.value), 4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw Playhead
    const currentLocalFrame = timeline.playhead.currentFrame - clip.start;
    if (currentLocalFrame >= 0 && currentLocalFrame <= clip.duration) {
      const playheadX = getX(currentLocalFrame);
      ctx.strokeStyle = 'red';
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
    }

  }, [activeTrack, clip, timeline.playhead.currentFrame]);

  // Handle Resize
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (canvasRef.current) {
          canvasRef.current.width = entry.contentRect.width;
          canvasRef.current.height = entry.contentRect.height;
        }
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-surface border-t border-border">
      <div className="flex items-center px-4 py-2 border-b border-border text-sm">
        <span className="font-semibold text-foreground/80 mr-4">Graph Editor</span>
        
        {Object.keys(animations).length > 0 ? (
          <select 
            value={activePropertyId || ''} 
            onChange={e => setActivePropertyId(e.target.value)}
            className="bg-background border border-border rounded px-2 py-1 text-xs outline-none"
          >
            {Object.keys(animations).map(id => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        ) : (
          <span className="text-foreground/50 text-xs">No animated properties</span>
        )}
      </div>

      <div ref={containerRef} className="flex-1 relative cursor-crosshair">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      </div>
    </div>
  );
}
