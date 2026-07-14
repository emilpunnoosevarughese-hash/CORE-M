import React, { useRef, useEffect } from 'react';
import { useTimelineStore } from '@corem/timeline';
import { useAssetStore } from '../assets/useAssetStore';
import { TimeRuler } from './TimeRuler';
import { Playhead } from './Playhead';
import { ClipNode } from './ClipNode';
import { TransitionNode } from './TransitionNode';
import { GraphEditor } from './GraphEditor';

export function TimelineContainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { zoomScale, setZoomScale, scrollX, scrollY, setScroll, clips, sequences, activeSequenceId, tracks, addTransition, addClip, addTrack, updateTrack, removeTrack, showGraphEditor, toggleGraphEditor } = useTimelineStore();

  // Gesture handling for Panning and Pinch-to-Zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault(); // Stop native scrolling
      if (e.ctrlKey || e.metaKey) {
        // Pinch to Zoom
        const { zoomScale, setZoomScale } = useTimelineStore.getState();
        const newScale = zoomScale - (e.deltaY * 0.1);
        setZoomScale(newScale);
      } else {
        // Panning
        const { scrollX, scrollY, setScroll } = useTimelineStore.getState();
        setScroll(scrollX + e.deltaX, scrollY + e.deltaY);
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);
  
  const handleDrop = (e: React.DragEvent) => {
    const transitionId = e.dataTransfer.getData('application/x-corem-transition');
    const assetId = e.dataTransfer.getData('application/corem-asset') || e.dataTransfer.getData('text/plain');
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left + scrollX;
    const frame = Math.max(0, x / zoomScale);
    
    if (transitionId) {
      addTransition('v1', {
        typeId: transitionId,
        start: Math.max(0, frame - 15),
        duration: 30,
        clipAId: null,
        clipBId: null,
        parameters: {}
      });
      return;
    }

    if (assetId) {
      const asset = useAssetStore.getState().assets[assetId];
      if (!asset) return;

      // Extract accurate duration (default 10s only if missing)
      const durationFrames = Math.max(1, Math.round((asset.duration || 10) * 30));

      // Route audio to audio tracks, others to video tracks
      const isAudio = asset.type === 'music' || asset.type === 'sfx';
      const targetTrackId = isAudio ? 'a1' : 'v1';

      addClip({
        trackId: targetTrackId,
        assetId: assetId,
        name: asset.name,
        start: frame,
        duration: durationFrames,
        sourceStart: 0,
        locked: false,
        disabled: false,
        linkedClipIds: [],
        effects: [],
        blendMode: 'normal',
        opacity: 1,
        transform: {
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          rotation: 0,
          anchorX: 0,
          anchorY: 0
        },
        isAdjustmentLayer: false,
        assetType: 'media'
      });
    }
  };

  // Virtualized Tracks Area
  return (
    <div className={`border-t border-border bg-surface shrink-0 flex flex-col relative w-full overflow-hidden select-none ${showGraphEditor ? 'h-[50vh]' : 'h-72'}`}>
      
      {/* Timeline Toolbar */}
      <div className="h-8 border-b border-border flex items-center px-2 justify-between bg-surface shrink-0 z-40">
        <div className="flex items-center space-x-4">
          <div className="text-xs text-foreground/50 font-medium">Timeline</div>
          <button 
            onClick={toggleGraphEditor} 
            className={`text-[10px] px-2 py-0.5 rounded ${showGraphEditor ? 'bg-primary text-white' : 'bg-surface-hover hover:bg-surface text-foreground/70'}`}
          >
            Graph Editor
          </button>
        </div>
        <div className="flex items-center space-x-2">
          {/* Zoom Slider */}
          <input 
            type="range" 
            min="0.1" 
            max="50" 
            step="0.1" 
            value={zoomScale} 
            onChange={(e) => setZoomScale(parseFloat(e.target.value))}
            className="w-24 accent-primary" 
          />
        </div>
      </div>

      <div className={`flex flex-col flex-1 overflow-hidden relative`}>
        {/* Top Half: Timeline */}
        <div className={`flex ${showGraphEditor ? 'h-1/2 border-b border-border' : 'h-full'} overflow-hidden relative`}>
          {/* Track Headers (Left Pane) */}
          <div className="w-64 border-r border-border bg-surface z-30 shrink-0 shadow-lg">
            <div className="h-8 bg-surface-hover border-b border-border flex items-center justify-between px-2 text-[10px] text-foreground/50">
              <span>TRACKS</span>
              <div className="flex gap-2">
                <button onClick={() => addTrack('video')} className="hover:text-white" title="Add Video Track">+ V</button>
                <button onClick={() => addTrack('audio')} className="hover:text-white" title="Add Audio Track">+ A</button>
              </div>
            </div>
            
            <div className="flex flex-col relative" style={{ transform: `translateY(${-scrollY}px)` }}>
              {Object.values(tracks).sort((a, b) => a.index - b.index).map(track => (
                <div key={track.id} className={`border-b border-border flex flex-col justify-center px-4 ${track.locked ? 'bg-surface-hover/50 opacity-70' : 'bg-surface'}`} style={{ height: track.height || 96 }}>
                  <div className="flex items-center justify-between">
                    <input 
                      type="text" 
                      value={track.name}
                      onChange={(e) => updateTrack(track.id, { name: e.target.value })}
                      className={`text-xs font-bold bg-transparent border-none outline-none focus:ring-1 focus:ring-primary w-24 ${track.type === 'video' ? 'text-primary' : track.type === 'audio' ? 'text-green-500' : 'text-purple-500'}`}
                    />
                    <button onClick={() => removeTrack(track.id)} className="text-[10px] text-red-500 hover:text-red-400" title="Delete Track">✕</button>
                  </div>
                  <div className="flex space-x-2 mt-2">
                    <button 
                      onClick={() => updateTrack(track.id, { muted: !track.muted })}
                      className={`w-5 h-5 rounded flex items-center justify-center text-[10px] ${track.muted ? 'bg-red-500/20 text-red-500' : 'bg-background hover:bg-surface-hover text-foreground/50'}`} title="Mute">M</button>
                    <button 
                      onClick={() => updateTrack(track.id, { solo: !track.solo })}
                      className={`w-5 h-5 rounded flex items-center justify-center text-[10px] ${track.solo ? 'bg-yellow-500/20 text-yellow-500' : 'bg-background hover:bg-surface-hover text-foreground/50'}`} title="Solo">S</button>
                    <button 
                      onClick={() => updateTrack(track.id, { locked: !track.locked })}
                      className={`w-5 h-5 rounded flex items-center justify-center text-[10px] ${track.locked ? 'bg-primary/20 text-primary' : 'bg-background hover:bg-surface-hover text-foreground/50'}`} title="Lock">L</button>
                    <button 
                      onClick={() => updateTrack(track.id, { hidden: !track.hidden })}
                      className={`w-5 h-5 rounded flex items-center justify-center text-[10px] ${track.hidden ? 'bg-orange-500/20 text-orange-500' : 'bg-background hover:bg-surface-hover text-foreground/50'}`} title="Hide">H</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Canvas / Virtualized Grid */}
          <div 
            ref={containerRef} 
            className="flex-1 relative overflow-hidden bg-[#111111] cursor-crosshair"
            style={{ touchAction: 'none' }}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
          >
            <TimeRuler />
            
            <div className="absolute inset-0 top-8" style={{ transform: `translate(${-scrollX}px, ${-scrollY}px)` }}>
               {/* Virtualization logic */}
               {(() => {
                 // Calculate visible frame window (add an overscan buffer of ~2 screens)
                 const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
                 const visibleStartFrame = Math.max(0, (scrollX - viewportWidth) / zoomScale);
                 const visibleEndFrame = (scrollX + viewportWidth * 2) / zoomScale;

                 // Filter clips
                 const visibleClips = Object.values(clips).filter(clip => {
                   const track = tracks[clip.trackId];
                   if (!track || track.hidden) return false;
                   return clip.start <= visibleEndFrame && (clip.start + clip.duration) >= visibleStartFrame;
                 });

                 // Filter transitions
                 const visibleTransitions = Object.values(tracks).flatMap(track => 
                   (track.transitions || []).filter(t => 
                     t.start <= visibleEndFrame && (t.start + t.duration) >= visibleStartFrame
                   ).map(t => ({ transition: t, trackId: track.id }))
                 );

                 return (
                   <>
                     {visibleClips.map(clip => (
                       <ClipNode 
                         key={clip.id} 
                         clip={clip} 
                         sequence={sequences[activeSequenceId || '']} 
                       />
                     ))}
                     {visibleTransitions.map(({ transition, trackId }) => (
                       <TransitionNode 
                         key={transition.id} 
                         transition={transition} 
                         trackId={trackId} 
                         sequence={sequences[activeSequenceId || '']} 
                       />
                     ))}
                   </>
                 );
               })()}
            </div>

            <Playhead />
          </div>
        </div>

        {/* Bottom Half: Graph Editor */}
        {showGraphEditor && (
          <div className="h-1/2 flex overflow-hidden">
            <GraphEditor />
          </div>
        )}

      </div>
    </div>
  );
}
