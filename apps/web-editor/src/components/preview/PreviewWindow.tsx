import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Maximize, SkipBack, SkipForward, Volume2, Settings, Minimize, VideoOff } from 'lucide-react';
import { usePlaybackStore } from '@corem/playback';
import { useTimelineStore } from '@corem/timeline';
import { Interpolator } from '@corem/animation';
import { useAssetStore } from '../assets/useAssetStore';

function frameToTimecode(frame: number, fps = 30): string {
  const totalSecs = Math.floor(frame / fps);
  const h  = Math.floor(totalSecs / 3600);
  const m  = Math.floor((totalSecs % 3600) / 60);
  const s  = totalSecs % 60;
  const f  = Math.floor(frame % fps);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}:${String(f).padStart(2,'0')}`;
}

export function PreviewWindow() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const workerRef    = useRef<Worker | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [showSafeAreas, setShowSafeAreas] = useState(false);
  const [volume, setVolume] = useState(1);
  const [timecode, setTimecode] = useState('00:00:00:00');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isError, setIsError] = useState(false);
  const [qualityScale, setQualityScale] = useState(1);
  const qualityRef = useRef(1);
  useEffect(() => { qualityRef.current = qualityScale; }, [qualityScale]);

  const { isPlaying, togglePlay } = usePlaybackStore();
  const { playhead } = useTimelineStore();
  const { assets } = useAssetStore();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [activeAssetUrl, setActiveAssetUrl] = useState<string | null>(null);

  // Keep timecode in sync
  useEffect(() => {
    return useTimelineStore.subscribe((state) => {
      setTimecode(frameToTimecode(Math.floor(state.playhead.currentFrame)));
    });
  }, []);

  // Initialize Worker
  useEffect(() => {
    if (!canvasRef.current) return;
    if ('transferControlToOffscreen' in canvasRef.current) {
      try {
        if (!canvasRef.current.dataset.transferred) {
          const offscreen = canvasRef.current.transferControlToOffscreen();
          canvasRef.current.dataset.transferred = 'true';
          const worker = new Worker(new URL('../../workers/render.worker.ts', import.meta.url), { type: 'module' });
          worker.onmessage = (e) => {
            if (e.data.type === 'SCOPES_FRAME') {
              import('../../components/color/scopesBus').then(({ emitScopesFrame }) => {
                emitScopesFrame(e.data.payload);
              });
            }
          };
          worker.postMessage({ type: 'INIT', payload: { canvas: offscreen } }, [offscreen]);
          workerRef.current = worker;
        }
      } catch (err) {
        console.warn('Canvas already transferred or error:', err);
      }
      return () => {
        workerRef.current?.terminate();
        workerRef.current = null;
      };
    }
  }, []);

  // Sync timeline → render worker
  useEffect(() => {
    return useTimelineStore.subscribe((state) => {
      const frame = state.playhead.currentFrame;
      if (workerRef.current) {
        
        const activeSequence = state.sequences[state.activeSequenceId!];
        if (!activeSequence) return;
        
        const layers: any[] = [];
        
        // Evaluate all tracks (bottom to top)
        const orderedTracks = [...activeSequence.trackIds].reverse();
        
        for (const trackId of orderedTracks) {
          const track = state.tracks[trackId];
          if (!track || track.hidden) continue;
          
          const isAudioTrack = track.type === 'audio';
          
          // Preload window: clips within [-300, +300] frames of playhead
          const preloadClips = track.clipIds
            .map(id => state.clips[id])
            .filter(c => c && frame >= c.start - 300 && frame < c.start + c.duration + 300);
            
          for (const clip of preloadClips) {
            const asset = useAssetStore.getState().assets[clip.assetId];
            const playbackQuality = usePlaybackStore.getState().quality;
            
            // Proxy selection logic
            let sourceUrl = asset?.sourceUrl;
            if ((playbackQuality === 'proxy' || playbackQuality === 'low') && asset?.previewUrl) {
               sourceUrl = asset.previewUrl;
            } else if (!sourceUrl) {
               sourceUrl = asset?.previewUrl;
            }
            
            if (!sourceUrl) continue;

            // Calculate rendering priority
            const isIntersectingPlayhead = frame >= clip.start && frame < clip.start + clip.duration;
            let priority = isIntersectingPlayhead ? 100 : 10;
            // Additional priority boosts could be added here (e.g. selected, hovered)

            if (isAudioTrack || (asset && (asset.type === 'music' || asset.type === 'sfx'))) {
               // Adaptive Media Pool for Audio
               import('@corem/playback').then(({ MediaPool }) => {
                 const audio = MediaPool.acquireAudio(clip.assetId, sourceUrl, priority);
                 if (audio && isIntersectingPlayhead) {
                   const audioTime = (frame - clip.start) / 30; // 30fps
                   if (state.playhead.isPlaying) {
                     if (audio.paused) {
                       audio.currentTime = audioTime;
                       audio.play().catch(() => {});
                     } else if (Math.abs(audio.currentTime - audioTime) > 0.5) {
                       audio.currentTime = audioTime;
                     }
                   } else {
                     if (!audio.paused) audio.pause();
                     if (Math.abs(audio.currentTime - audioTime) > 0.05) {
                       audio.currentTime = audioTime;
                     }
                   }
                 }
               });
               continue;
            }
            
            // For Video: only add to layers if it actively intersects the playhead to render
            if (!isIntersectingPlayhead) {
               // Background preload only (Priority 10)
               import('@corem/playback').then(({ MediaPool }) => {
                  MediaPool.acquireVideo(clip.assetId, sourceUrl, priority);
               });
               continue;
            }

            // Visual Track Logic (isIntersectingPlayhead is true)
            let currentTransform = { ...clip.transform };
            let pId = clip.parentId;
            while (pId) {
              const p = state.clips[pId];
              if (!p) break;
              currentTransform.x += p.transform.x;
              currentTransform.y += p.transform.y;
              currentTransform.scaleX *= p.transform.scaleX;
              currentTransform.scaleY *= p.transform.scaleY;
              currentTransform.rotation += p.transform.rotation;
              pId = p.parentId;
            }
            
            let activeEffects = clip.effects || [];
            if (clip.animations && Object.keys(clip.animations).length > 0) {
              const localFrame = frame - clip.start;
              activeEffects = activeEffects.map(effect => {
                const newParams = { ...effect.parameters };
                for (const [propId, trk] of Object.entries(clip.animations || {})) {
                  if (propId.startsWith(`effect.${effect.effectId}.`)) {
                    const paramName = propId.split('.').pop()!;
                    newParams[paramName] = Interpolator.evaluate(trk, localFrame, newParams[paramName] as number);
                  }
                }
                return { ...effect, parameters: newParams };
              });
            }
            
            layers.push({
              id: clip.id,
              assetId: clip.assetId,
              sourceUrl,
              isAdjustmentLayer: clip.isAdjustmentLayer,
              opacity: clip.opacity,
              blendMode: clip.blendMode,
              transform: currentTransform,
              effects: activeEffects,
              clipStart: clip.start,
              priority
            });
          }
        }
        
        let anyLoading = false;
        
        // Fetch frames dynamically
        const fetchFramePromises = layers.map(async (layer) => {
          if (layer.isAdjustmentLayer || !layer.sourceUrl) {
            return { ...layer, source: null };
          }
          
          const { MediaPool } = await import('@corem/playback');
          const video = MediaPool.acquireVideo(layer.assetId, layer.sourceUrl, layer.priority);
          
          if (!video) {
            // Decoder budget exhausted, we could fallback to a FrameCache here
            return { ...layer, source: null };
          }
          
          if (video.readyState >= 1) {
             const videoTime = (frame - layer.clipStart) / 30; // 30fps
             
             if (state.playhead.isPlaying) {
               if (video.paused) {
                 if (!video.seeking) video.currentTime = videoTime;
                 video.play().catch(e => console.warn('Play prevented:', e));
               } else if (Math.abs(video.currentTime - videoTime) > 0.5 && !video.seeking) {
                 video.currentTime = videoTime;
               }
             } else {
               if (!video.paused) {
                 video.pause();
               }
               // Prevent infinite seeking if the browser clamps to a keyframe
               const lastSeek = video.dataset.lastSeekTarget ? parseFloat(video.dataset.lastSeekTarget) : -1;
               if (Math.abs(video.currentTime - videoTime) > 0.05 && !video.seeking && Math.abs(lastSeek - videoTime) > 0.01) {
                 video.dataset.lastSeekTarget = videoTime.toString();
                 video.currentTime = videoTime;
               }
             }
             
             if (video.readyState >= 2 && !video.seeking) {
               try {
                  const bitmap = await createImageBitmap(video);
                  return { ...layer, source: bitmap };
               } catch(e) {
                  // Fallback for browsers/scenarios where createImageBitmap(video) fails
                  try {
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = video.videoWidth || 1920;
                    tempCanvas.height = video.videoHeight || 1080;
                    const ctx = tempCanvas.getContext('2d');
                    if (ctx) ctx.drawImage(video, 0, 0);
                    const bitmap = await createImageBitmap(tempCanvas);
                    return { ...layer, source: bitmap };
                  } catch(e2) {
                    console.warn("createImageBitmap fallback failed", e2);
                    return { ...layer, source: null };
                  }
               }
             }
          }
          
          if (video.readyState < 2) {
             if (video.dataset.error === 'true') {
               // Video failed to load. Do not flag as loading.
               return { ...layer, source: null, isError: true };
             }
             anyLoading = true;
             // Not ready yet, attach events if not already listening
             if (!video.dataset.eventsAttached) {
               video.dataset.eventsAttached = 'true';
               const triggerUpdate = () => useTimelineStore.setState(s => ({ playhead: { ...s.playhead } }));
               video.addEventListener('seeked', triggerUpdate);
               video.addEventListener('loadeddata', triggerUpdate);
               video.addEventListener('canplay', triggerUpdate);
               video.addEventListener('error', triggerUpdate);
             }
          }
          return { ...layer, source: null };
        });
        
        Promise.all(fetchFramePromises).then(resolvedLayers => {
           setIsLoading(anyLoading);
           setIsEmpty(resolvedLayers.length === 0);
           setIsError(resolvedLayers.some(l => l.isError));
           if (workerRef.current) {
             const activeSeq = useTimelineStore.getState().sequences[useTimelineStore.getState().activeSequenceId!];
             workerRef.current.postMessage({
               type: 'RENDER',
               payload: { layers: resolvedLayers, requestScopes: true, qualityScale: qualityRef.current, projectWidth: activeSeq?.width || 1920, projectHeight: activeSeq?.height || 1080 }
             }, resolvedLayers.map(l => l.source).filter(Boolean));
           }
        });
        
        return;
      }
      // Fallback 2D (Only if not transferred)
      if (canvasRef.current && !canvasRef.current.dataset.transferred) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          const { width, height } = canvasRef.current;
          ctx.fillStyle = '#0a0a0a';
          ctx.fillRect(0, 0, width, height);
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.font = '24px monospace';
          ctx.fillText(`Frame: ${Math.floor(frame)}`, 20, 40);
        }
      }
    });
  }, []);

  const activeSequenceId = useTimelineStore(s => s.activeSequenceId);
  const activeSequence = useTimelineStore(s => activeSequenceId ? s.sequences[activeSequenceId] : null);

  // Resize observer — keep canvas letter/pillar-boxed inside container
  useEffect(() => {
    const updateSize = (width: number, height: number) => {
      if (!canvasRef.current) return;
      
      const projW = activeSequence?.width || 1920;
      const projH = activeSequence?.height || 1080;
      const aspect = projW / projH;
      
      let w = width;
      let h = width / aspect;
      if (h > height) { h = height; w = height * aspect; }
      
      const renderW = Math.round(w * qualityScale);
      const renderH = Math.round(h * qualityScale);
      
      if (workerRef.current) {
        workerRef.current.postMessage({
          type: 'RESIZE',
          payload: { width: renderW, height: renderH }
        });
      } else {
        try {
          canvasRef.current.width  = renderW;
          canvasRef.current.height = renderH;
        } catch (e) {}
      }
      
      canvasRef.current.style.width  = `${Math.round(w)}px`;
      canvasRef.current.style.height = `${Math.round(h)}px`;
    };

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        updateSize(entry.contentRect.width, entry.contentRect.height);
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    
    // Also force an update when qualityScale changes if we already have dimensions
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 0) updateSize(rect.width, rect.height);
    }
    
    return () => observer.disconnect();
  }, [qualityScale, activeSequence?.width, activeSequence?.height]);

  const toggleFullscreen = useCallback(() => {
    if (!fullscreen) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setFullscreen(f => !f);
  }, [fullscreen]);

  return (
    <div className="flex-1 flex flex-col relative min-h-0 bg-black">
      
      {/* Canvas container — fills available space */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center overflow-hidden bg-[#0a0a0a] relative min-h-0"
      >
        {/* Video sources are now managed dynamically in the DOM by the sync loop */}
        <canvas
          ref={canvasRef}
          className="block shadow-2xl"
        />

        {/* Safe Areas Overlay */}
        {showSafeAreas && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
            <div className="relative" style={{ aspectRatio: '16/9', height: '100%', maxWidth: '100%' }}>
              <div className="absolute inset-[5%] border border-white/30" />
              <div className="absolute inset-[10%] border border-white/50" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20" />
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium text-white tracking-widest uppercase">Buffering</span>
            </div>
          </div>
        )}

        {/* Empty State Overlay */}
        {isEmpty && !isLoading && !isError && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black pointer-events-none">
            <div className="flex flex-col items-center gap-3 opacity-30">
              <VideoOff size={48} />
              <div className="text-sm font-medium tracking-wider uppercase">No Video at this Frame</div>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {isError && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black pointer-events-none">
            <div className="flex flex-col items-center gap-3 text-red-500/80">
              <VideoOff size={48} />
              <div className="text-sm font-medium tracking-wider">MEDIA PLAYBACK ERROR</div>
              <div className="text-xs text-foreground/50 max-w-xs text-center mt-2">
                The browser cannot play this video format (e.g. H.265/HEVC) or it is blocked by CORS.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Playback Controls */}
      <div className="h-12 bg-surface border-t border-border flex items-center justify-between px-4 shrink-0 gap-4">
        
        {/* Left: timecode + volume */}
        <div className="flex items-center gap-3 min-w-0">
          <Volume2 size={15} className="text-foreground/50 shrink-0" />
          <input
            type="range" min={0} max={1} step={0.05} value={volume}
            onChange={e => setVolume(Number(e.target.value))}
            className="w-16 accent-primary"
          />
          <span className="text-[11px] font-mono text-foreground/60 shrink-0">{timecode}</span>
        </div>

        {/* Center: playback buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => useTimelineStore.setState(s => ({ playhead: { ...s.playhead, currentFrame: 0 } }))}
            className="p-1.5 hover:bg-surface-hover rounded-full transition-colors text-foreground/70"
          >
            <SkipBack size={16} />
          </button>
          <button
            onClick={togglePlay}
            className="w-9 h-9 flex items-center justify-center bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
          >
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
          </button>
          <button
            className="p-1.5 hover:bg-surface-hover rounded-full transition-colors text-foreground/70"
          >
            <SkipForward size={16} />
          </button>
        </div>

        {/* Right: quality + overlays + fullscreen */}
        <div className="flex items-center gap-2 min-w-0">
          <select 
            value={qualityScale}
            onChange={e => setQualityScale(Number(e.target.value))}
            className="bg-transparent text-[11px] text-foreground/60 outline-none border border-border/50 rounded px-1.5 py-0.5"
          >
            <option value={1}>Full</option>
            <option value={0.5}>1/2</option>
            <option value={0.25}>1/4</option>
          </select>
          <button
            onClick={() => setShowSafeAreas(s => !s)}
            className={`p-1.5 rounded transition-colors ${showSafeAreas ? 'bg-primary/20 text-primary' : 'hover:bg-surface-hover text-foreground/60'}`}
            title="Safe Areas"
          >
            <Settings size={14} />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 hover:bg-surface-hover rounded transition-colors text-foreground/60"
            title="Fullscreen"
          >
            {fullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
