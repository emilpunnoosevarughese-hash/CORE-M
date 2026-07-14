import React, { useEffect, useState, useRef } from 'react';
import { useTimelineStore } from '@corem/timeline';
import { AudioEngine, AudioMixer as CoreMixer } from '@corem/audio';
import { Volume2, VolumeX, SlidersHorizontal } from 'lucide-react';

export function AudioMixerPanel() {
  const { sequences, activeSequenceId } = useTimelineStore();
  const sequence = activeSequenceId ? sequences[activeSequenceId] : null;
  const [masterPeak, setMasterPeak] = useState(0);
  const [masterVol, setMasterVol] = useState(1);
  const [isMasterMuted, setIsMasterMuted] = useState(false);
  const reqRef = useRef<number>(0);

  useEffect(() => {
    const updateMeters = () => {
      const engine = AudioEngine.getInstance();
      if (engine.getContext()) setMasterPeak(engine.getMasterPeak());
      reqRef.current = requestAnimationFrame(updateMeters);
    };
    reqRef.current = requestAnimationFrame(updateMeters);
    return () => cancelAnimationFrame(reqRef.current);
  }, []);

  if (!sequence) return null;

  const audioTrackIds = sequence.trackIds.filter(id => {
    const { tracks } = useTimelineStore.getState();
    return tracks[id]?.type === 'audio' || tracks[id]?.type === 'video';
  });

  return (
    <div className="h-full w-full bg-[#111114] border-t border-border flex flex-col select-none overflow-hidden">
      {/* Title bar */}
      <div className="h-7 border-b border-border/50 flex items-center px-3 gap-2 shrink-0">
        <SlidersHorizontal size={12} className="text-foreground/50" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-foreground/50">Audio Mixer</span>
      </div>

      {/* Strips row */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden flex gap-px p-1.5 min-h-0">
        {/* Master */}
        <MixerStrip
          label="MASTER"
          color="text-red-400"
          peak={masterPeak}
          volume={masterVol}
          isMuted={isMasterMuted}
          onVolumeChange={v => {
            setMasterVol(v);
            AudioEngine.getInstance().setMasterVolume(v);
          }}
          onMuteToggle={() => {
            const next = !isMasterMuted;
            setIsMasterMuted(next);
            AudioEngine.getInstance().setMasterVolume(next ? 0 : masterVol);
          }}
        />
        <div className="w-px bg-border/40 self-stretch shrink-0" />
        {/* Track strips */}
        {audioTrackIds.map(trackId => (
          <TrackStrip key={trackId} trackId={trackId} />
        ))}
      </div>
    </div>
  );
}

function MixerStrip({ label, color, peak, volume, isMuted, onVolumeChange, onMuteToggle }: {
  label: string; color: string; peak: number; volume: number;
  isMuted: boolean; onVolumeChange: (v: number) => void; onMuteToggle: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-2 py-1 rounded bg-black/20 min-w-[56px]">
      <span className={`text-[9px] font-bold uppercase tracking-wider ${color}`}>{label}</span>
      <PeakMeter peak={peak} isMuted={isMuted} />
      <input
        type="range" min={0} max={2} step={0.01} value={volume}
        onChange={e => onVolumeChange(parseFloat(e.target.value))}
        className="w-full h-1 accent-red-500"
      />
      <button
        onClick={onMuteToggle}
        className={`w-7 h-5 rounded text-[9px] font-bold transition-colors border ${
          isMuted ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'border-border text-foreground/40 hover:text-foreground'
        }`}
      >
        {isMuted ? <VolumeX size={9} className="mx-auto" /> : <Volume2 size={9} className="mx-auto" />}
      </button>
    </div>
  );
}

function TrackStrip({ trackId }: { trackId: string }) {
  const { tracks } = useTimelineStore();
  const track = tracks[trackId];
  const [peak, setPeak] = useState(0);
  const [vol, setVol] = useState(1);
  const [pan, setPan] = useState(0);
  const [isMuted, setIsMuted] = useState(track?.muted || false);
  const reqRef = useRef<number>(0);

  useEffect(() => {
    const update = () => {
      setPeak(CoreMixer.getInstance().getTrackPeak(trackId));
      reqRef.current = requestAnimationFrame(update);
    };
    reqRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(reqRef.current);
  }, [trackId]);

  if (!track) return null;
  const isAudio = track.type === 'audio';
  const trackColor = isAudio ? 'text-emerald-400' : 'text-blue-400';

  return (
    <div className="flex flex-col items-center gap-1 px-2 py-1 rounded bg-black/10 hover:bg-black/25 transition-colors min-w-[52px]">
      <span className={`text-[9px] font-semibold truncate max-w-[44px] text-center ${trackColor}`} title={track.name}>{track.name}</span>
      <PeakMeter peak={peak} isMuted={isMuted} />
      {/* Pan */}
      <div className="w-full flex flex-col items-center gap-0">
        <span className="text-[8px] text-foreground/30 leading-none">PAN</span>
        <input
          type="range" min={-1} max={1} step={0.05} value={pan}
          onChange={e => {
            const v = parseFloat(e.target.value);
            setPan(v);
            CoreMixer.getInstance().setTrackPan(trackId, v);
          }}
          className="w-full h-1 accent-primary"
        />
      </div>
      {/* Volume */}
      <input
        type="range" min={0} max={2} step={0.01} value={vol}
        onChange={e => {
          const v = parseFloat(e.target.value);
          setVol(v);
          CoreMixer.getInstance().setTrackVolume(trackId, v);
        }}
        className="w-full h-1 accent-primary"
      />
      {/* M/S buttons */}
      <div className="flex gap-1">
        <button
          onClick={() => {
            const next = !isMuted;
            setIsMuted(next);
            useTimelineStore.getState().updateTrack(trackId, { muted: next });
          }}
          className={`w-5 h-4 rounded text-[8px] font-bold border transition-colors ${
            isMuted ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'border-border/50 text-foreground/40 hover:text-foreground'
          }`}
        >M</button>
        <button
          onClick={() => {
            const cur = track.solo;
            useTimelineStore.getState().updateTrack(trackId, { solo: !cur });
          }}
          className={`w-5 h-4 rounded text-[8px] font-bold border transition-colors ${
            track.solo ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' : 'border-border/50 text-foreground/40 hover:text-foreground'
          }`}
        >S</button>
      </div>
    </div>
  );
}

function PeakMeter({ peak, isMuted }: { peak: number; isMuted: boolean }) {
  const pct = Math.min(100, peak * 100);
  const isClipping = peak >= 0.99;
  return (
    <div className="w-full h-2 bg-black rounded-sm overflow-hidden">
      <div
        className={`h-full rounded-sm transition-all duration-75 ${
          isMuted ? 'bg-foreground/20' : isClipping ? 'bg-red-500' : pct > 70 ? 'bg-yellow-400' : 'bg-emerald-500'
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
