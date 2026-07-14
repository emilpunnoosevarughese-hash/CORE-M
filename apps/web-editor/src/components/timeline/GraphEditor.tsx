import React, { useRef, useEffect } from 'react';
import { useTimelineStore } from '@corem/timeline';
import { MotionGraph } from '@corem/animation';

export function GraphEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { zoomScale, scrollX, selectedPropertyTrack } = useTimelineStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    
    // Clear background
    ctx.fillStyle = '#111111'; // Match timeline
    ctx.fillRect(0, 0, rect.width, rect.height);
    
    // Draw Grid
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < rect.height; i += 40) {
      ctx.moveTo(0, i);
      ctx.lineTo(rect.width, i);
    }
    for (let i = 0; i < rect.width; i += 100) {
      ctx.moveTo(i, 0);
      ctx.lineTo(i, rect.height);
    }
    ctx.stroke();

    // Draw active track
    if (selectedPropertyTrack) {
      MotionGraph.drawValueGraph(
        ctx, 
        selectedPropertyTrack, 
        rect.width, 
        rect.height, 
        scrollX, 
        zoomScale,
        0, // Min value (should be dynamic based on track data)
        100 // Max value (should be dynamic based on track data)
      );
    } else {
      ctx.fillStyle = '#666666';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Select a keyframed property to view in the Graph Editor', rect.width / 2, rect.height / 2);
    }

  }, [zoomScale, scrollX, selectedPropertyTrack]);

  return (
    <div className="flex-1 flex flex-col border-t border-border bg-surface shrink-0 h-full select-none relative">
      <div className="h-8 border-b border-border flex items-center px-4 justify-between bg-surface-hover shrink-0">
        <span className="text-xs font-semibold text-primary">Graph Editor</span>
        <div className="flex gap-2 text-[10px] text-foreground/50">
          <button className="hover:text-white px-2 py-1 rounded bg-background">Value Graph</button>
          <button className="hover:text-white px-2 py-1 rounded">Speed Graph</button>
          <button className="hover:text-white px-2 py-1 rounded">Auto Fit</button>
        </div>
      </div>
      <div className="flex-1 relative">
        <canvas 
          ref={canvasRef} 
          className="w-full h-full cursor-crosshair" 
          style={{ display: 'block' }} 
        />
      </div>
    </div>
  );
}
