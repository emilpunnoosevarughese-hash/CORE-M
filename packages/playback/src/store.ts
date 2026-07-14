import { create } from 'zustand';
import { useTimelineStore } from '@corem/timeline';
import { AudioEngine } from '@corem/audio';
import { MediaPool } from './engine/MediaPool';

export type PlaybackQuality = 'auto' | 'proxy' | 'original' | 'low' | 'high';

interface PlaybackState {
  isPlaying: boolean;
  playbackSpeed: number; // 0.1x to 16x
  isLooping: boolean;
  volume: number; // 0.0 to 1.0
  isMuted: boolean;
  quality: PlaybackQuality;
  
  // Actions
  togglePlay: () => void;
  pause: () => void;
  play: () => void;
  setSpeed: (speed: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleLoop: () => void;
  setQuality: (quality: PlaybackQuality) => void;
}

// Global Animation Frame reference for sync loop
let syncLoopId: number | null = null;
let lastTime = 0;

export const usePlaybackStore = create<PlaybackState>((set, get) => ({
  isPlaying: false,
  playbackSpeed: 1.0,
  isLooping: false,
  volume: 1.0,
  isMuted: false,
  quality: 'auto',

  togglePlay: () => {
    const isPlaying = !get().isPlaying;
    if (isPlaying) {
      get().play();
    } else {
      get().pause();
  play: () => {
    if (get().isPlaying) return;
    set({ isPlaying: true });
    
    // Unlock audio elements to bypass browser autoplay policy
    MediaPool.unlockAudio();
    
    // Start the synchronization loop bridging timeline playhead with actual time
    let ctx: AudioContext | null = null;
    try {
      ctx = AudioEngine.getInstance().getContext();
    } catch(e) {}

    let lastTime = performance.now() / 1000;
    if (ctx && ctx.state === 'running') {
      lastTime = ctx.currentTime;
    }
    
    const syncLoop = () => {
      const state = get();
      if (!state.isPlaying) return;

      let now = performance.now() / 1000;
      if (ctx && ctx.state === 'running') {
        now = ctx.currentTime;
      }

      const deltaSec = now - lastTime;
      lastTime = now;

      // Update the timeline store's playhead directly (transient update)
      const timelineState = useTimelineStore.getState();
      const currentSequence = timelineState.sequences[timelineState.activeSequenceId || ''];
      
      const fps = currentSequence?.timebase?.fps || 30;
      
      // Calculate frames to advance based on real time delta and playback speed
      const framesToAdvance = deltaSec * fps * state.playbackSpeed;
      
      let nextFrame = timelineState.playhead.currentFrame + framesToAdvance;
      
      // Handle Looping or End of Sequence
      const totalFrames = currentSequence?.duration || 10000; // fallback length
      if (nextFrame >= totalFrames) {
        if (state.isLooping) {
          nextFrame = 0;
        } else {
          nextFrame = totalFrames;
          set({ isPlaying: false });
          useTimelineStore.setState({ playhead: { ...timelineState.playhead, isPlaying: false, currentFrame: nextFrame }});
          return;
        }
      }

      // Mutate timeline playhead
      useTimelineStore.setState({ 
        playhead: { ...timelineState.playhead, isPlaying: true, currentFrame: nextFrame } 
      });

      syncLoopId = requestAnimationFrame(syncLoop);
    };
    
    syncLoopId = requestAnimationFrame(syncLoop);
  },

  pause: () => {
    set({ isPlaying: false });
    if (syncLoopId !== null) {
      cancelAnimationFrame(syncLoopId);
      syncLoopId = null;
    }
    useTimelineStore.setState((state) => ({
      playhead: { ...state.playhead, isPlaying: false }
    }));
  },

  setSpeed: (speed) => set({ playbackSpeed: speed }),
  setVolume: (volume) => set({ volume: Math.max(0, Math.min(volume, 1)) }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  toggleLoop: () => set((state) => ({ isLooping: !state.isLooping })),
  setQuality: (quality) => set({ quality })
}));
