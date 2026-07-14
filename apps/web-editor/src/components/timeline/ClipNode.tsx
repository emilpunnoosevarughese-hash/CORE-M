import React, { useRef, useState, useEffect } from 'react';
import { useTimelineStore, findSnapPoint } from '@corem/timeline';
import type { Clip } from '@corem/timeline';
import { WaveformCanvas } from '../audio/WaveformCanvas';

interface ClipNodeProps {
  clip: Clip;
  sequence: any;
}

export const ClipNode = React.memo(function ClipNode({ clip, sequence }: ClipNodeProps) {
  const { zoomScale, selection, setSelection, moveClip, trimClip, updateClip, clips, isSnappingEnabled, playhead, tracks } = useTimelineStore();
  const isSelected = selection.clipIds.includes(clip.id);
  const [isDragOver, setIsDragOver] = useState(false);

  const nodeRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const track = tracks[clip.trackId];
  const trackIndex = track?.index || 0;
  const trackHeight = track?.height || 96;

  // Sync back React state when not dragging (clears any lingering inline styles)
  useEffect(() => {
    if (nodeRef.current) {
      nodeRef.current.style.transform = `translateX(0px)`;
      nodeRef.current.style.width = `${clip.duration * zoomScale}px`;
    }
    if (labelRef.current) {
      labelRef.current.textContent = `[${Math.floor(clip.start)} - ${Math.floor(clip.start + clip.duration)}]`;
    }
  }, [clip.start, clip.duration, zoomScale]);

  // Handle Body Drag
  const handleBodyPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!isSelected) setSelection([clip.id]);
    
    const startX = e.clientX;
    const initialStart = clip.start;
    
    const handleMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const frameDelta = deltaX / zoomScale;
      let newStart = initialStart + frameDelta;

      if (isSnappingEnabled) {
        newStart = findSnapPoint(newStart, zoomScale, 10, sequence, clips, playhead.currentFrame, clip.id);
      }
      newStart = Math.max(0, newStart);

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (nodeRef.current) {
          const pixelDelta = (newStart - initialStart) * zoomScale;
          nodeRef.current.style.transform = `translateX(${pixelDelta}px)`;
        }
        if (labelRef.current) {
          labelRef.current.textContent = `[${Math.floor(newStart)} - ${Math.floor(newStart + clip.duration)}]`;
        }
      });
    };

    const handleUp = (upEvent: PointerEvent) => {
      const deltaX = upEvent.clientX - startX;
      const frameDelta = deltaX / zoomScale;
      let newStart = initialStart + frameDelta;

      if (isSnappingEnabled) {
        newStart = findSnapPoint(newStart, zoomScale, 10, sequence, clips, playhead.currentFrame, clip.id);
      }
      newStart = Math.max(0, newStart);
      
      if (nodeRef.current) nodeRef.current.style.transform = `translateX(0px)`;
      if (Math.abs(deltaX) > 2) {
        moveClip(clip.id, newStart);
      }
      
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  // Handle Left Trim
  const handleLeftTrimPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    const startX = e.clientX;
    const initialStart = clip.start;
    const initialDuration = clip.duration;
    
    const handleMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const frameDelta = deltaX / zoomScale;
      
      let newStart = initialStart + frameDelta;
      let newDuration = initialDuration - frameDelta;

      if (isSnappingEnabled) {
        const snapped = findSnapPoint(newStart, zoomScale, 10, sequence, clips, playhead.currentFrame, clip.id);
        const snapDiff = snapped - newStart;
        newStart += snapDiff;
        newDuration -= snapDiff;
      }

      if (newDuration < 1 || newStart < 0) return;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (nodeRef.current) {
          const pixelDelta = (newStart - initialStart) * zoomScale;
          nodeRef.current.style.transform = `translateX(${pixelDelta}px)`;
          nodeRef.current.style.width = `${newDuration * zoomScale}px`;
        }
        if (labelRef.current) {
          labelRef.current.textContent = `[${Math.floor(newStart)} - ${Math.floor(newStart + newDuration)}]`;
        }
      });
    };

    const handleUp = (upEvent: PointerEvent) => {
      const deltaX = upEvent.clientX - startX;
      const frameDelta = deltaX / zoomScale;
      
      let newStart = initialStart + frameDelta;
      let newDuration = initialDuration - frameDelta;

      if (isSnappingEnabled) {
        const snapped = findSnapPoint(newStart, zoomScale, 10, sequence, clips, playhead.currentFrame, clip.id);
        const snapDiff = snapped - newStart;
        newStart += snapDiff;
        newDuration -= snapDiff;
      }

      if (nodeRef.current) nodeRef.current.style.transform = `translateX(0px)`;
      if (newDuration >= 1 && newStart >= 0 && Math.abs(deltaX) > 2) {
        const isRipple = upEvent.altKey;
        trimClip(clip.id, 'start', newStart - clip.start, isRipple);
      }
      
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  // Handle Right Trim
  const handleRightTrimPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    const startX = e.clientX;
    const initialDuration = clip.duration;
    
    const handleMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const frameDelta = deltaX / zoomScale;
      
      let newDuration = initialDuration + frameDelta;
      
      if (isSnappingEnabled) {
        const snappedEnd = findSnapPoint(clip.start + newDuration, zoomScale, 10, sequence, clips, playhead.currentFrame, clip.id);
        newDuration = snappedEnd - clip.start;
      }

      if (newDuration < 1) return;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (nodeRef.current) {
          nodeRef.current.style.width = `${newDuration * zoomScale}px`;
        }
        if (labelRef.current) {
          labelRef.current.textContent = `[${Math.floor(clip.start)} - ${Math.floor(clip.start + newDuration)}]`;
        }
      });
    };

    const handleUp = (upEvent: PointerEvent) => {
      const deltaX = upEvent.clientX - startX;
      const frameDelta = deltaX / zoomScale;
      
      let newDuration = initialDuration + frameDelta;
      
      if (isSnappingEnabled) {
        const snappedEnd = findSnapPoint(clip.start + newDuration, zoomScale, 10, sequence, clips, playhead.currentFrame, clip.id);
        newDuration = snappedEnd - clip.start;
      }

      if (newDuration >= 1 && Math.abs(deltaX) > 2) {
        const isRipple = upEvent.altKey;
        trimClip(clip.id, 'end', newDuration - clip.duration, isRipple);
      }
      
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  return (
    <div 
      ref={nodeRef}
      onPointerDown={handleBodyPointerDown}
      onClick={(e) => { e.stopPropagation(); setSelection([clip.id]); }}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const effectId = e.dataTransfer.getData('application/x-corem-effect');
        if (effectId) {
          const currentEffects = clip.effects || [];
          updateClip(clip.id, {
            effects: [
              ...currentEffects,
              { id: `eff_${Math.random().toString(36).substr(2, 9)}`, effectId, enabled: true, parameters: {} }
            ]
          });
          setSelection([clip.id]);
        }
      }}
      className={`absolute rounded border shadow-md overflow-hidden cursor-grab active:cursor-grabbing text-xs text-white p-1 transition-colors
        ${isSelected ? 'bg-primary/90 border-white z-20' : 'bg-blue-600/80 border-blue-500 z-10'}
        ${isDragOver ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}
      `}
      style={{
        left: clip.start * zoomScale,
        width: clip.duration * zoomScale,
        top: trackIndex * trackHeight + 4,
        height: trackHeight - 8,
        touchAction: 'none',
        willChange: 'transform, width'
      }}
    >
      <div className="truncate font-medium pointer-events-none z-10 relative">{clip.name}</div>
      <div ref={labelRef} className="truncate text-[9px] opacity-70 pointer-events-none z-10 relative">
        [{Math.floor(clip.start)} - {Math.floor(clip.start + clip.duration)}]
      </div>
      
      {/* Waveform Renderer */}
      <WaveformCanvas clipId={clip.id} assetId={clip.assetId} duration={clip.duration} />

      {/* Left Trim Handle */}
      <div 
        onPointerDown={handleLeftTrimPointerDown}
        className="absolute top-0 bottom-0 left-0 w-3 cursor-ew-resize hover:bg-white/30 z-30 flex items-center justify-center"
      >
        <div className="w-0.5 h-4 bg-white rounded-full opacity-50" />
      </div>

      {/* Right Trim Handle */}
      <div 
        onPointerDown={handleRightTrimPointerDown}
        className="absolute top-0 bottom-0 right-0 w-3 cursor-ew-resize hover:bg-white/30 z-30 flex items-center justify-center"
      >
        <div className="w-0.5 h-4 bg-white rounded-full opacity-50" />
      </div>
    </div>
  );
});
