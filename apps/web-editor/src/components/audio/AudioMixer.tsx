import React, { useEffect, useState, useRef } from 'react';
import { useTimelineStore } from '@corem/timeline';
import { AudioEngine, AudioMixer as CoreMixer } from '@corem/audio';
import { Volume2, VolumeX, Mic } from 'lucide-react';

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
      <div className="h-10 border-b border-border flex items-center px-4 font-semibold text-sm">
        Audio Mixer
      </div>
      
      <div className="flex-1 overflow-x-auto flex p-4 space-x-6">
        
        {/* Track Strips */}
        {sequence.trackIds.map(trackId => (
          <TrackStrip key={trackId} trackId={trackId} />
        ))}

        {/* Master Bus Strip */}
        <div className="w-24 shrink-0 flex flex-col items-center border-l border-border pl-6">
          <div className="text-xs font-bold text-red-500 mb-4">MASTER</div>
          
          {/* Pan (Disabled for Master usually, or stereo balance) */}
          <div className="w-10 h-10 rounded-full border-2 border-border mb-6 flex items-center justify-center text-[10px] text-foreground/50">
            C
          </div>

          <div className="flex-1 flex space-x-2">
            {/* Volume Slider */}
            <input 
              type="range" 
              className="slider-vertical h-full w-4 accent-red-500" 
              min="0" max="2" step="0.01" defaultValue="1"
              onChange={(e) => {
                AudioEngine.getInstance().setMasterVolume(parseFloat(e.target.value));
              }}
            />
            {/* Meter */}
            <PeakMeter peak={masterPeak} />
          </div>

          <div className="mt-4 flex space-x-1">
            <button className="w-6 h-6 rounded bg-surface-hover flex items-center justify-center text-red-500"><VolumeX size={14}/></button>
          </div>
        </div>

      </div>
    </div>
  );
}

function TrackStrip({ trackId }: { trackId: string }) {
  const [peak, setPeak] = useState(0);
  const reqRef = useRef<number>(0);

  useEffect(() => {
    // Only works if CoreMixer registered the track
    const updateMeter = () => {
      setPeak(CoreMixer.getInstance().getTrackPeak(trackId));
      reqRef.current = requestAnimationFrame(updateMeter);
    };
    reqRef.current = requestAnimationFrame(updateMeter);
    return () => cancelAnimationFrame(reqRef.current);
  }, [trackId]);

  return (
    <div className="w-16 shrink-0 flex flex-col items-center">
      <div className="text-xs font-semibold text-primary mb-4 truncate w-full text-center">{trackId.slice(0, 4)}</div>
      
      {/* Pan Dial */}
      <input 
        type="range" 
        className="w-12 h-1 accent-primary mb-6" 
        min="-1" max="1" step="0.1" defaultValue="0"
        onChange={(e) => CoreMixer.getInstance().setTrackPan(trackId, parseFloat(e.target.value))}
      />

      <div className="flex-1 flex space-x-2">
        <input 
          type="range" 
          className="slider-vertical h-full w-4 accent-primary" 
          min="0" max="2" step="0.01" defaultValue="1"
          onChange={(e) => CoreMixer.getInstance().setTrackVolume(trackId, parseFloat(e.target.value))}
        />
        <PeakMeter peak={peak} />
      </div>

      <div className="mt-4 flex space-x-1">
        <button className="w-6 h-6 rounded bg-surface-hover flex items-center justify-center text-[10px]">M</button>
        <button className="w-6 h-6 rounded bg-surface-hover flex items-center justify-center text-[10px]">S</button>
      </div>
    </div>
  );
}

function PeakMeter({ peak }: { peak: number }) {
  // Peak is 0.0 to 1.0
  const heightPercent = Math.min(100, peak * 100);
  const isClipping = peak >= 0.99;

  return (
    <div className="w-2 h-full bg-black rounded-full overflow-hidden flex flex-col justify-end relative">
      <div 
        className={`w-full transition-all duration-75 ${isClipping ? 'bg-red-500' : 'bg-green-500'}`}
        style={{ height: `${heightPercent}%` }}
      />
    </div>
  );
}
