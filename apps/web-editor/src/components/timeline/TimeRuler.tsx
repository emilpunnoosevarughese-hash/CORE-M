import React, { useMemo } from 'react';
import { useTimelineStore } from '@corem/timeline';

export function TimeRuler() {
  const { zoomScale, scrollX, setPlayhead } = useTimelineStore();
  const rulerRef = React.useRef<HTMLDivElement>(null);
  
  // A standard timebase for this example: 30fps
  const fps = 30;

  // We want to draw tick marks for frames and seconds.
  // We'll generate a massive SVG or just use a repeating background.
  // For high performance (10000+ items), a canvas or heavily optimized SVG is needed.
  // Here, we use a CSS-based approach with repeating linear gradients for max performance.

  // The distance between seconds in pixels
  const pixelsPerSecond = zoomScale * fps;
  
  // Decide tick intervals based on zoom
  const showFrames = zoomScale > 10;
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!rulerRef.current) return;
    
    const updatePlayhead = (clientX: number) => {
      const rect = rulerRef.current!.getBoundingClientRect();
      const x = clientX - rect.left + scrollX;
      setPlayhead(Math.max(0, x / zoomScale));
    };
    
    updatePlayhead(e.clientX);
    
    const onMouseMove = (moveEv: MouseEvent) => updatePlayhead(moveEv.clientX);
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };
  
  return (
    <div 
      className="h-8 border-b border-border bg-surface sticky top-0 z-20 flex overflow-hidden select-none cursor-ew-resize"
      onMouseDown={handleMouseDown}
    >
      <div 
        ref={rulerRef}
        className="h-full relative flex-1"
        style={{
          transform: `translateX(${-scrollX}px)`,
          // Using a repeating linear gradient to draw the ticks without mounting 10,000 DOM nodes!
          backgroundImage: `
            repeating-linear-gradient(
              to right,
              var(--border) 0px,
              var(--border) 1px,
              transparent 1px,
              transparent ${pixelsPerSecond}px
            )
          `
        }}
      >
        {/* We would render actual timestamp labels here using virtualization or a Canvas overlay */}
        <div className="absolute top-1 left-2 text-[10px] text-foreground/50">
          00:00:00:00
        </div>
        <div 
          className="absolute top-1 text-[10px] text-foreground/50" 
          style={{ left: pixelsPerSecond + 8 }}
        >
          00:00:01:00
        </div>
      </div>
    </div>
  );
}
