import React, { useEffect, useRef } from 'react';
import { useTimelineStore } from '@corem/timeline';

export function Playhead() {
  const { zoomScale, scrollX, setPlayhead } = useTimelineStore();
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

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // We need to calculate based on the TimelineContainer position
    // A quick hack is to find the ruler or container offset
    const container = playheadRef.current?.closest('.relative.flex-1') || playheadRef.current?.parentElement;
    if (!container) return;

    const updatePlayhead = (clientX: number) => {
      const rect = container.getBoundingClientRect();
      const currentState = useTimelineStore.getState();
      const x = clientX - rect.left + currentState.scrollX;
      currentState.setPlayhead(Math.max(0, x / currentState.zoomScale));
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
      ref={playheadRef}
      className="absolute top-0 bottom-0 w-px bg-red-500 z-30 pointer-events-none"
    >
      {/* Playhead Handle */}
      <div 
        onMouseDown={handleMouseDown}
        className="absolute -top-3 -translate-x-1/2 w-3 h-4 bg-red-500 rounded-sm pointer-events-auto cursor-ew-resize flex justify-center shadow-md hover:bg-red-400 active:bg-red-600 transition-colors"
      >
        <div className="w-0.5 h-2 bg-white/50 mt-1 pointer-events-none" />
      </div>
    </div>
  );
}
