import React, { useEffect, useRef } from 'react';
import { useTimelineStore } from '@corem/timeline';

export function Playhead() {
  const { zoomScale, scrollX } = useTimelineStore();
  const playheadRef = useRef<HTMLDivElement>(null);

  // Transient state subscription for maximum performance (60fps scrubbing)
  useEffect(() => {
    return useTimelineStore.subscribe((state) => {
      if (playheadRef.current) {
        const xPos = (state.playhead.currentFrame * state.zoomScale) - state.scrollX;
        playheadRef.current.style.transform = `translateX(${xPos}px)`;
      }
    });
  }, []);

  return (
    <div 
      ref={playheadRef}
      className="absolute top-0 bottom-0 w-px bg-red-500 z-30 pointer-events-none"
    >
      {/* Playhead Handle */}
      <div className="absolute -top-3 -translate-x-1/2 w-3 h-4 bg-red-500 rounded-sm pointer-events-auto cursor-ew-resize flex justify-center shadow-md">
        <div className="w-0.5 h-2 bg-white/50 mt-1" />
      </div>
    </div>
  );
}
