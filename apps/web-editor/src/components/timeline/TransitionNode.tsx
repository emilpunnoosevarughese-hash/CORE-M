import React from 'react';
import { useTimelineStore } from '@corem/timeline';
import type { Transition, Sequence } from '@corem/timeline';
import { TransitionRegistry } from '@corem/effects';

interface Props {
  transition: Transition;
  trackId: string;
  sequence: Sequence;
}

export function TransitionNode({ transition, trackId, sequence }: Props) {
  const { zoomScale, selection, setSelection } = useTimelineStore();
  const def = TransitionRegistry.getTransition(transition.typeId);

  // Position & Size
  const left = transition.start * zoomScale;
  const width = transition.duration * zoomScale;
  
  // Track Y position (hardcoded for now based on V1 = 0, A1 = 1)
  // In a real app, track index would come from store
  const trackIndex = trackId === 'v1' ? 0 : 1; 
  const top = trackIndex * 96; // 96 is track height
  const height = 96;

  const isSelected = false; // Add selection logic if needed

  return (
    <div
      className={`absolute top-0 h-full border border-primary/50 bg-primary/20 flex items-center justify-center overflow-hidden z-10 ${isSelected ? 'ring-2 ring-white' : ''}`}
      style={{ left: `${left}px`, width: `${width}px`, top: `${top}px`, height: `${height}px` }}
      onClick={(e) => {
        e.stopPropagation();
        // Selection logic could go here
      }}
    >
      <div className="text-[10px] text-white font-medium px-1 truncate pointer-events-none drop-shadow-md">
        {def?.name || 'Transition'}
      </div>
      
      {/* Left/Right handles for resizing could be added here */}
    </div>
  );
}
