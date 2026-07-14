import React, { useEffect, useState, useRef } from 'react';
import { useTimelineStore } from '@corem/timeline';
import { AudioEngine, AudioMixer as CoreMixer } from '@corem/audio';
import { Volume2, VolumeX, Mic, SlidersHorizontal } from 'lucide-react';

export function AudioMixerPanel() {
  const { sequences, activeSequenceId } = useTimelineStore();
  const sequence = activeSequenceId ? sequences[activeSequenceId] : null;

  // Render loop for peak meters
  const [masterPeak, setMasterPeak] = useState(0);
  const reqRef = useRef<number>(0);

  useEffect(() => {
    const updateMeters = () => {
      const engine = AudioEngine.getInstance();
      if (engine.getContext()) {
        setMasterPeak(engine.getMasterPeak());
      }
      reqRef.current = requestAnimationFrame(updateMeters);
    };
    reqRef.current = requestAnimationFrame(updateMeters);
    return () => cancelAnimationFrame(reqRef.current);
  }, []);

  if (!sequence) return null;

  return (
    <div className="h-full w-full bg-surface border-l border-border flex flex-col select-none">
      <div className="h-8 border-b border-border flex items-center px-4 font-semibold text-xs text-foreground/80 bg-surface-hover/30">
        <SlidersHorizontal size={14} className="mr-2" />
        Audio Mixer
      </div>
      
      <div className="flex-1 overflow-y-auto flex flex-col p-2 space-y-2">
        {/* Master Bus Strip */}
        <div className="flex items-center space-x-3 p-2 bg-background rounded border border-border">
          <div className="w-12 text-[10px] font-bold text-red-500 uppercase tracking-wider text-center">Master</div>
          
          <div className="flex-1 flex flex-col justify-center space-y-1">
            <input 
              type="range" 
              className="w-full h-1.5 accent-red-500 bg-surface-hover rounded-full appearance-none outline-none" 
              min="0" max="2" step="0.01" defaultValue="1"
              onChange={(e) => {
                AudioEngine.getInstance().setMasterVolume(parseFloat(e.target.value));
              }}
            />
            <PeakMeterHorizontal peak={masterPeak} />
          </div>

          <div className="flex space-x-1 shrink-0">
            <button className="w-6 h-6 rounded bg-surface-hover hover:bg-surface flex items-center justify-center text-red-500 transition-colors"><Volume2 size={12}/></button>
          </div>
        </div>

        {/* Track Strips */}
        {sequence.trackIds.map(trackId => (
          <TrackStrip key={trackId} trackId={trackId} />
        ))}
      </div>
    </div>
  );
}

function TrackStrip({ trackId }: { trackId: string }) {
  const [peak, setPeak] = useState(0);
  const reqRef = useRef<number>(0);

  useEffect(() => {
    const updateMeter = () => {
      setPeak(CoreMixer.getInstance().getTrackPeak(trackId));
      reqRef.current = requestAnimationFrame(updateMeter);
    };
    reqRef.current = requestAnimationFrame(updateMeter);
    return () => cancelAnimationFrame(reqRef.current);
  }, [trackId]);

  return (
    <div className="flex items-center space-x-3 p-2 bg-surface hover:bg-surface-hover/50 rounded border border-border/50 transition-colors">
      <div className="w-12 text-[10px] font-semibold text-primary truncate text-center" title={trackId}>{trackId.slice(0, 5)}</div>
      
      {/* Pan Dial (Simplified as tiny slider) */}
      <div className="w-10 flex flex-col items-center shrink-0">
        <span className="text-[8px] text-foreground/40 mb-0.5">PAN</span>
        <input 
          type="range" 
          className="w-full h-1 accent-primary bg-background rounded-full appearance-none outline-none" 
          min="-1" max="1" step="0.1" defaultValue="0"
          onChange={(e) => CoreMixer.getInstance().setTrackPan(trackId, parseFloat(e.target.value))}
        />
      </div>

      {/* Volume & Meter */}
      <div className="flex-1 flex flex-col justify-center space-y-1">
        <input 
          type="range" 
          className="w-full h-1.5 accent-primary bg-background rounded-full appearance-none outline-none" 
          min="0" max="2" step="0.01" defaultValue="1"
          onChange={(e) => CoreMixer.getInstance().setTrackVolume(trackId, parseFloat(e.target.value))}
        />
        <PeakMeterHorizontal peak={peak} />
      </div>

      <div className="flex space-x-1 shrink-0">
        <button className="w-5 h-5 rounded bg-background hover:bg-surface border border-border flex items-center justify-center text-[9px] font-bold transition-colors">M</button>
        <button className="w-5 h-5 rounded bg-background hover:bg-surface border border-border flex items-center justify-center text-[9px] font-bold transition-colors">S</button>
      </div>
    </div>
  );
}

function PeakMeterHorizontal({ peak }: { peak: number }) {
  const widthPercent = Math.min(100, peak * 100);
  const isClipping = peak >= 0.99;

  return (
    <div className="w-full h-1.5 bg-black rounded-full overflow-hidden flex relative">
      <div 
        className={`h-full transition-all duration-75 ${isClipping ? 'bg-red-500' : 'bg-green-500'}`}
        style={{ width: `${widthPercent}%` }}
      />
      {/* Meter markings */}
      <div className="absolute inset-0 flex justify-between pointer-events-none">
        <div className="w-px h-full bg-white/10" />
        <div className="w-px h-full bg-white/10" />
        <div className="w-px h-full bg-white/10" />
        <div className="w-px h-full bg-white/10" />
      </div>
    </div>
  );
}
