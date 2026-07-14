import React, { useEffect, useState } from 'react';
import { HardwareProfiler, type HardwareProfile } from '@corem/playback';
import { useTimelineStore } from '@corem/timeline';

export function DiagnosticsPanel() {
  const [profile, setProfile] = useState<HardwareProfile | null>(null);
  const [fps, setFps] = useState(0);
  const [memory, setMemory] = useState<any>(null);
  const playhead = useTimelineStore(s => s.playhead);

  useEffect(() => {
    const unsubscribe = HardwareProfiler.subscribe(p => setProfile(p));
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let lastTime = performance.now();
    let frames = 0;
    
    const loop = () => {
      const now = performance.now();
      frames++;
      if (now - lastTime >= 1000) {
        setFps(frames);
        frames = 0;
        lastTime = now;
        
        // Update memory
        if ((performance as any).memory) {
          setMemory((performance as any).memory);
        }
      }
      requestAnimationFrame(loop);
    };
    
    const id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);

  if (!profile) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-black/80 backdrop-blur border border-white/10 p-4 rounded text-xs font-mono text-white/70 z-50 pointer-events-none w-64 shadow-2xl">
      <div className="text-white font-bold mb-2 flex items-center justify-between border-b border-white/10 pb-1">
        <span>Dev Diagnostics</span>
        <span className={fps >= 55 ? 'text-green-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400'}>
          {fps} FPS
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
        <span className="text-white/40">Tier</span>
        <span className="text-right capitalize text-primary">{profile.tier}</span>
        
        <span className="text-white/40">Cores</span>
        <span className="text-right">{profile.cpuCores}</span>
        
        <span className="text-white/40">Max Video Decoders</span>
        <span className="text-right">{profile.maxVideoDecoders}</span>
        
        <span className="text-white/40">Max Audio Decoders</span>
        <span className="text-right">{profile.maxAudioDecoders}</span>
        
        <span className="text-white/40">Memory Limit</span>
        <span className="text-right">{profile.memoryLimitMB} MB</span>
        
        <span className="text-white/40">Max Texture Cache</span>
        <span className="text-right">{profile.maxTextureCacheSize}</span>
        
        <span className="text-white/40">Max Frame Cache</span>
        <span className="text-right">{profile.maxFrameCacheSize}</span>
        
        <span className="text-white/40">Mem Pressured</span>
        <span className="text-right">{profile.isMemoryConstrained ? 'Yes' : 'No'}</span>
      </div>
      
      {memory && (
        <div className="mt-2 pt-2 border-t border-white/10 grid grid-cols-2 gap-x-2 gap-y-1">
          <span className="text-white/40">JS Heap</span>
          <span className="text-right">
            {Math.round(memory.usedJSHeapSize / 1024 / 1024)} MB
          </span>
          <span className="text-white/40">JS Max</span>
          <span className="text-right">
            {Math.round(memory.jsHeapSizeLimit / 1024 / 1024)} MB
          </span>
        </div>
      )}

      <div className="mt-2 pt-2 border-t border-white/10 grid grid-cols-2 gap-x-2 gap-y-1">
        <span className="text-white/40">Playhead State</span>
        <span className="text-right text-[10px]">
          F: {Math.floor(playhead.currentFrame)} | {playhead.isPlaying ? 'PLAY' : 'PAUSE'}
        </span>
      </div>
    </div>
  );
}
