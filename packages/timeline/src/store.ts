import { create } from 'zustand';
import type { Sequence, Track, Clip, ToolType, SelectionState, HistoryAction, PlayheadState } from './models';

interface ClipboardState {
  clips: Clip[];
}

interface TimelineState {
  sequences: Record<string, Sequence>;
  tracks: Record<string, Track>;
  clips: Record<string, Clip>;
  activeSequenceId: string | null;
  activeTool: ToolType;
  selection: SelectionState;
  clipboard: ClipboardState;
  zoomScale: number;
  scrollX: number;
  scrollY: number;
  showGraphEditor: boolean;
  selectedPropertyTrack: any | null;
  playhead: PlayheadState;
  past: HistoryAction[];
  future: HistoryAction[];
  isSnappingEnabled: boolean;
  
  // Actions
  setActiveTool: (tool: ToolType) => void;
  setZoomScale: (scale: number) => void;
  setScroll: (x: number, y: number) => void;
  setPlayhead: (frame: number) => void;
  toggleSnapping: () => void;
  setSelection: (clipIds: string[]) => void;
  toggleGraphEditor: () => void;
  setSelectedPropertyTrack: (track: any) => void;
  
  // Advanced NLE Actions
  addClip: (clip: Omit<Clip, 'id'>) => string;
  setParent: (clipId: string, parentId: string | null) => void;
  setTransform: (clipId: string, transform: Partial<import('./models').Transform>) => void;
  moveClip: (clipId: string, newStart: number, newTrackId?: string) => void;
  splitClip: (clipId: string, frame: number) => void;
  deleteClip: (clipId: string) => void;
  rippleDelete: (clipId: string) => void;
  trimClip: (clipId: string, edge: 'start' | 'end', deltaFrames: number, ripple: boolean) => void;
  slipClip: (clipId: string, deltaFrames: number) => void;
  slideClip: (clipId: string, deltaFrames: number) => void;
  updateClip: (clipId: string, updates: Partial<Clip>) => void;
  
  // Layer Management
  duplicateClip: (clipId: string) => void;
  groupClips: (clipIds: string[], groupId: string) => void;
  ungroupClips: (groupId: string) => void;
  toggleVisibility: (clipId: string) => void;
  toggleLock: (clipId: string) => void;
  setBlendMode: (clipId: string, blendMode: Clip['blendMode']) => void;
  
  // Nesting
  createNestedComposition: (name: string, clipIds: string[]) => void;
  
  // Clipboard
  copySelection: () => void;
  pasteSelection: (frameOffset: number) => void;
  
  // Transitions
  addTransition: (trackId: string, transition: Omit<import('./models').Transition, 'id'>) => void;
  updateTransition: (trackId: string, transitionId: string, updates: Partial<import('./models').Transition>) => void;
  removeTransition: (trackId: string, transitionId: string) => void;
  
  // Track Management
  addTrack: (type: 'video' | 'audio' | 'adjustment', name?: string) => void;
  updateTrack: (trackId: string, updates: Partial<Track>) => void;
  removeTrack: (trackId: string) => void;
  reorderTracks: (trackIds: string[]) => void;
  
  // History
  undo: () => void;
  redo: () => void;
}

const pushHistory = (state: TimelineState, label: string) => {
  const action: HistoryAction = {
    id: crypto.randomUUID(),
    label,
    timestamp: Date.now(),
    pastState: {
      sequences: JSON.parse(JSON.stringify(state.sequences)),
      tracks: JSON.parse(JSON.stringify(state.tracks)),
      clips: JSON.parse(JSON.stringify(state.clips)),
    }
  };
  return { past: [...state.past, action], future: [] };
};

export const useTimelineStore = create<TimelineState>((set, get) => ({
  sequences: {
    'seq_1': { id: 'seq_1', projectId: 'proj_1', name: 'Main Timeline', duration: 10000, timebase: { fps: 30 }, trackIds: ['v1', 'a1'], markers: [] }
  },
  tracks: {
    'v1': { id: 'v1', sequenceId: 'seq_1', type: 'video', name: 'V1', index: 0, locked: false, hidden: false, solo: false, muted: false, height: 96, clipIds: [], transitions: [] },
    'a1': { id: 'a1', sequenceId: 'seq_1', type: 'audio', name: 'A1', index: 1, locked: false, hidden: false, solo: false, muted: false, height: 96, clipIds: [], transitions: [] }
  },
  clips: {},
  activeSequenceId: 'seq_1',
  activeTool: 'selection',
  selection: { clipIds: [], trackIds: [] },
  clipboard: { clips: [] },
  zoomScale: 10,
  scrollX: 0,
  scrollY: 0,
  showGraphEditor: false,
  selectedPropertyTrack: null,
  playhead: { currentFrame: 0, isPlaying: false },
  past: [],
  future: [],
  isSnappingEnabled: true,

  setActiveTool: (tool) => set({ activeTool: tool }),
  setZoomScale: (scale) => set({ zoomScale: Math.max(0.1, Math.min(scale, 100)) }),
  setScroll: (x, y) => set({ scrollX: x, scrollY: y }),
  setPlayhead: (frame) => set((state) => ({ playhead: { ...state.playhead, currentFrame: Math.max(0, frame) } })),
  toggleSnapping: () => set((state) => ({ isSnappingEnabled: !state.isSnappingEnabled })),
  setSelection: (clipIds) => set({ selection: { clipIds, trackIds: [] } }),
  toggleGraphEditor: () => set(state => ({ showGraphEditor: !state.showGraphEditor })),
  setSelectedPropertyTrack: (track) => set({ selectedPropertyTrack: track }),

  addClip: (clipData) => {
    const id = crypto.randomUUID();
    set((state) => {
      const historyUpdate = pushHistory(state, 'Add Clip');
      const newClip = { ...clipData, id };
      const newClips = { ...state.clips, [id]: newClip as Clip };
      
      // Update track to include this clip
      const track = state.tracks[clipData.trackId];
      const newTracks = { ...state.tracks };
      if (track) {
        newTracks[clipData.trackId] = { ...track, clipIds: [...track.clipIds, id] };
      }
      
      return { ...historyUpdate, clips: newClips, tracks: newTracks };
    });
    return id;
  },

  setParent: (clipId, parentId) => set((state) => {
    const clip = state.clips[clipId];
    if (!clip) return state;
    const historyUpdate = pushHistory(state, 'Set Parent');
    return { ...historyUpdate, clips: { ...state.clips, [clipId]: { ...clip, parentId: parentId ?? undefined } } };
  }),

  setTransform: (clipId, transformUpdates) => set((state) => {
    const clip = state.clips[clipId];
    if (!clip) return state;
    const historyUpdate = pushHistory(state, 'Update Transform');
    return { ...historyUpdate, clips: { ...state.clips, [clipId]: { ...clip, transform: { ...clip.transform, ...transformUpdates } } } };
  }),

  moveClip: (clipId, newStart, newTrackId) => set((state) => {
    const historyUpdate = pushHistory(state, 'Move Clip');
    const clip = state.clips[clipId];
    if (!clip) return state;
    
    // Check boundaries (can't move before frame 0)
    const finalStart = Math.max(0, newStart);
    
    return {
      ...historyUpdate,
      clips: { ...state.clips, [clipId]: { ...clip, start: finalStart, trackId: newTrackId || clip.trackId } }
    };
  }),

  splitClip: (clipId, frame) => set((state) => {
    const clip = state.clips[clipId];
    if (!clip || frame <= clip.start || frame >= clip.start + clip.duration) return state;
    const historyUpdate = pushHistory(state, 'Split Clip');
    const newClip1 = { ...clip, duration: frame - clip.start };
    const newClip2Id = crypto.randomUUID();
    const newClip2 = {
      ...clip,
      id: newClip2Id,
      start: frame,
      duration: clip.duration - newClip1.duration,
      sourceStart: clip.sourceStart + newClip1.duration
    };
    return { ...historyUpdate, clips: { ...state.clips, [clipId]: newClip1, [newClip2Id]: newClip2 } };
  }),

  deleteClip: (clipId) => set((state) => {
    const historyUpdate = pushHistory(state, 'Delete Clip');
    const { [clipId]: _, ...remainingClips } = state.clips;
    return { ...historyUpdate, clips: remainingClips };
  }),

  rippleDelete: (clipId) => set((state) => {
    const clip = state.clips[clipId];
    if (!clip) return state;
    const historyUpdate = pushHistory(state, 'Ripple Delete');
    
    // Find all clips on the same track that occur AFTER the deleted clip
    const shiftDelta = clip.duration;
    const remainingClips = { ...state.clips };
    delete remainingClips[clipId];
    
    Object.values(remainingClips).forEach(c => {
      if (c.trackId === clip.trackId && c.start >= clip.start + clip.duration) {
        remainingClips[c.id] = { ...c, start: Math.max(0, c.start - shiftDelta) };
      }
    });

    return { ...historyUpdate, clips: remainingClips };
  }),

  trimClip: (clipId, edge, deltaFrames, ripple) => set((state) => {
    const clip = state.clips[clipId];
    if (!clip) return state;
    
    const historyUpdate = pushHistory(state, `Trim ${edge}`);
    let newStart = clip.start;
    let newDuration = clip.duration;
    let newSourceStart = clip.sourceStart;
    
    if (edge === 'start') {
      // deltaFrames > 0 means trimming start to the right (shortening)
      newStart += deltaFrames;
      newSourceStart += deltaFrames;
      newDuration -= deltaFrames;
    } else {
      // deltaFrames > 0 means trimming end to the right (lengthening)
      newDuration += deltaFrames;
    }
    
    // Enforce limits (e.g., minimum 1 frame length, source limits in a real impl)
    if (newDuration < 1) return state;
    if (newStart < 0) return state;

    const newClips = { ...state.clips, [clipId]: { ...clip, start: newStart, duration: newDuration, sourceStart: newSourceStart } };
    
    if (ripple) {
      // Shift everything to the right of the clip by the net change in duration
      const durationChange = newDuration - clip.duration;
      Object.values(newClips).forEach(c => {
        if (c.id !== clipId && c.trackId === clip.trackId && c.start >= clip.start) {
           newClips[c.id] = { ...c, start: Math.max(0, c.start + durationChange) };
        }
      });
    }

    return { ...historyUpdate, clips: newClips };
  }),

  slipClip: (clipId, deltaFrames) => set((state) => {
    const clip = state.clips[clipId];
    if (!clip) return state;
    const historyUpdate = pushHistory(state, 'Slip Edit');
    
    // Slip changes sourceStart without affecting timeline position
    const newSourceStart = Math.max(0, clip.sourceStart + deltaFrames); // Math.max protects bounds
    return { ...historyUpdate, clips: { ...state.clips, [clipId]: { ...clip, sourceStart: newSourceStart } } };
  }),

  slideClip: (clipId, deltaFrames) => set((state) => {
    const clip = state.clips[clipId];
    if (!clip) return state;
    const historyUpdate = pushHistory(state, 'Slide Edit');
    
    // Slide moves the clip on the timeline without altering sourceStart
    // In a full implementation, it would inversely trim adjacent clips.
    const newStart = Math.max(0, clip.start + deltaFrames);
    return { ...historyUpdate, clips: { ...state.clips, [clipId]: { ...clip, start: newStart } } };
  }),

  updateClip: (clipId, updates) => set((state) => {
    const clip = state.clips[clipId];
    if (!clip) return state;
    const historyUpdate = pushHistory(state, 'Update Clip');
    return { ...historyUpdate, clips: { ...state.clips, [clipId]: { ...clip, ...updates } } };
  }),

  duplicateClip: (clipId) => set((state) => {
    const clip = state.clips[clipId];
    if (!clip) return state;
    const historyUpdate = pushHistory(state, 'Duplicate Clip');
    const newId = crypto.randomUUID();
    const newClip = { ...clip, id: newId, name: `${clip.name} Copy` };
    
    const track = state.tracks[clip.trackId];
    const newTracks = { ...state.tracks };
    if (track) {
      newTracks[clip.trackId] = { ...track, clipIds: [...track.clipIds, newId] };
    }
    
    return { ...historyUpdate, clips: { ...state.clips, [newId]: newClip }, tracks: newTracks };
  }),

  groupClips: (clipIds, groupId) => set((state) => {
    const historyUpdate = pushHistory(state, 'Group Clips');
    const newClips = { ...state.clips };
    let minStart = Infinity;
    let maxEnd = 0;
    let trackId = '';
    
    clipIds.forEach(id => {
      const c = newClips[id];
      if (c) {
        c.parentId = groupId;
        if (c.start < minStart) minStart = c.start;
        if (c.start + c.duration > maxEnd) maxEnd = c.start + c.duration;
        trackId = trackId || c.trackId;
      }
    });

    const groupClip: Clip = {
      id: groupId,
      trackId: trackId || 'v1',
      assetId: 'group',
      name: 'Group',
      start: minStart,
      duration: maxEnd - minStart,
      sourceStart: 0,
      locked: false,
      disabled: false,
      linkedClipIds: [],
      childrenIds: clipIds,
      isGroup: true,
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, anchorX: 0, anchorY: 0 },
      effects: [],
      blendMode: 'normal',
      opacity: 1
    };
    newClips[groupId] = groupClip;
    
    const track = state.tracks[groupClip.trackId];
    const newTracks = { ...state.tracks };
    if (track) {
      newTracks[groupClip.trackId] = { ...track, clipIds: [...track.clipIds, groupId] };
    }

    return { ...historyUpdate, clips: newClips, tracks: newTracks };
  }),

  ungroupClips: (groupId) => set((state) => {
    const groupClip = state.clips[groupId];
    if (!groupClip || !groupClip.isGroup) return state;
    const historyUpdate = pushHistory(state, 'Ungroup Clips');
    const newClips = { ...state.clips };
    
    (groupClip.childrenIds || []).forEach(childId => {
      if (newClips[childId]) {
        newClips[childId].parentId = undefined;
      }
    });
    delete newClips[groupId];
    
    const track = state.tracks[groupClip.trackId];
    const newTracks = { ...state.tracks };
    if (track) {
      newTracks[groupClip.trackId] = { ...track, clipIds: track.clipIds.filter(id => id !== groupId) };
    }
    
    return { ...historyUpdate, clips: newClips, tracks: newTracks };
  }),

  toggleVisibility: (clipId) => set((state) => {
    const clip = state.clips[clipId];
    if (!clip) return state;
    const historyUpdate = pushHistory(state, 'Toggle Visibility');
    return { ...historyUpdate, clips: { ...state.clips, [clipId]: { ...clip, disabled: !clip.disabled } } };
  }),

  toggleLock: (clipId) => set((state) => {
    const clip = state.clips[clipId];
    if (!clip) return state;
    const historyUpdate = pushHistory(state, 'Toggle Lock');
    return { ...historyUpdate, clips: { ...state.clips, [clipId]: { ...clip, locked: !clip.locked } } };
  }),

  setBlendMode: (clipId, blendMode) => set((state) => {
    const clip = state.clips[clipId];
    if (!clip) return state;
    const historyUpdate = pushHistory(state, 'Set Blend Mode');
    return { ...historyUpdate, clips: { ...state.clips, [clipId]: { ...clip, blendMode } } };
  }),

  createNestedComposition: (name, clipIds) => set((state) => {
    if (clipIds.length === 0) return state;
    const historyUpdate = pushHistory(state, 'Precompose');
    
    const newSeqId = crypto.randomUUID();
    const newSeqTracks: Record<string, Track> = {
      'v1': { id: 'v1', sequenceId: newSeqId, type: 'video', name: 'V1', index: 0, locked: false, hidden: false, solo: false, muted: false, height: 96, clipIds: [], transitions: [] }
    };
    
    const newClips = { ...state.clips };
    const newTracks = { ...state.tracks };
    
    let minStart = Infinity;
    let maxEnd = 0;
    
    clipIds.forEach(id => {
      const c = newClips[id];
      if (c) {
        if (c.start < minStart) minStart = c.start;
        if (c.start + c.duration > maxEnd) maxEnd = c.start + c.duration;
        
        // Remove from current tracks
        const currentTrack = newTracks[c.trackId];
        if (currentTrack) {
          newTracks[c.trackId] = { ...currentTrack, clipIds: currentTrack.clipIds.filter(x => x !== id) };
        }
        
        // Move to new sequence's track
        c.trackId = 'v1';
        // Normalize start position
        c.start -= minStart;
        newSeqTracks['v1'].clipIds.push(id);
      }
    });

    const duration = maxEnd - minStart;
    const newSequence: Sequence = {
      id: newSeqId,
      projectId: state.sequences[state.activeSequenceId || '']?.projectId || 'proj_1',
      name,
      timebase: state.sequences[state.activeSequenceId || '']?.timebase || { fps: 30 },
      duration,
      trackIds: ['v1'],
      markers: []
    };

    const compClipId = crypto.randomUUID();
    const compClip: Clip = {
      id: compClipId,
      trackId: state.clips[clipIds[0]]?.trackId || 'v1', // place on the first clip's track
      assetId: newSeqId, // reference the new sequence
      assetType: 'composition',
      name,
      start: minStart,
      duration,
      sourceStart: 0,
      locked: false,
      disabled: false,
      linkedClipIds: [],
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, anchorX: 0, anchorY: 0 },
      effects: [],
      blendMode: 'normal',
      opacity: 1
    };
    newClips[compClipId] = compClip;

    const compTrack = newTracks[compClip.trackId];
    if (compTrack) {
      newTracks[compClip.trackId] = { ...compTrack, clipIds: [...compTrack.clipIds, compClipId] };
    }

    return { 
      ...historyUpdate, 
      sequences: { ...state.sequences, [newSeqId]: newSequence },
      tracks: { ...newTracks, ...newSeqTracks },
      clips: newClips,
      selection: { clipIds: [compClipId], trackIds: [] }
    };
  }),

  copySelection: () => set((state) => {
    const selectedClips = state.selection.clipIds.map(id => state.clips[id]).filter(Boolean);
    return { clipboard: { clips: JSON.parse(JSON.stringify(selectedClips)) } };
  }),

  pasteSelection: (frameOffset) => set((state) => {
    if (state.clipboard.clips.length === 0) return state;
    const historyUpdate = pushHistory(state, 'Paste');
    
    const newClips = { ...state.clips };
    state.clipboard.clips.forEach(clip => {
      const newId = crypto.randomUUID();
      newClips[newId] = { ...clip, id: newId, start: clip.start + frameOffset };
    });
    
    return { ...historyUpdate, clips: newClips };
  }),

  addTransition: (trackId, transitionData) => set((state) => {
    const track = state.tracks[trackId];
    if (!track) return state;
    const historyUpdate = pushHistory(state, 'Add Transition');
    const newTransition = { ...transitionData, id: crypto.randomUUID() };
    return {
      ...historyUpdate,
      tracks: {
        ...state.tracks,
        [trackId]: { ...track, transitions: [...(track.transitions || []), newTransition] }
      }
    };
  }),

  updateTransition: (trackId, transitionId, updates) => set((state) => {
    const track = state.tracks[trackId];
    if (!track) return state;
    const historyUpdate = pushHistory(state, 'Update Transition');
    return {
      ...historyUpdate,
      tracks: {
        ...state.tracks,
        [trackId]: {
          ...track,
          transitions: (track.transitions || []).map(t => t.id === transitionId ? { ...t, ...updates } : t)
        }
      }
    };
  }),

  removeTransition: (trackId, transitionId) => set((state) => {
    const track = state.tracks[trackId];
    if (!track) return state;
    const historyUpdate = pushHistory(state, 'Remove Transition');
    return {
      ...historyUpdate,
      tracks: {
        ...state.tracks,
        [trackId]: {
          ...track,
          transitions: (track.transitions || []).filter(t => t.id !== transitionId)
        }
      }
    };
  }),

  addTrack: (type, name) => set((state) => {
    const historyUpdate = pushHistory(state, 'Add Track');
    const seq = state.sequences[state.activeSequenceId || ''];
    if (!seq) return state;
    
    const id = `${type[0]}${crypto.randomUUID().substring(0, 4)}`;
    const newTrack: Track = {
      id,
      sequenceId: seq.id,
      type,
      name: name || `${type.charAt(0).toUpperCase() + type.slice(1)} Track`,
      index: seq.trackIds.length,
      locked: false,
      hidden: false,
      solo: false,
      muted: false,
      height: 96,
      clipIds: [],
      transitions: []
    };
    
    return {
      ...historyUpdate,
      tracks: { ...state.tracks, [id]: newTrack },
      sequences: {
        ...state.sequences,
        [seq.id]: { ...seq, trackIds: [...seq.trackIds, id] }
      }
    };
  }),

  updateTrack: (trackId, updates) => set((state) => {
    const track = state.tracks[trackId];
    if (!track) return state;
    const historyUpdate = pushHistory(state, 'Update Track');
    return {
      ...historyUpdate,
      tracks: { ...state.tracks, [trackId]: { ...track, ...updates } }
    };
  }),

  removeTrack: (trackId) => set((state) => {
    const track = state.tracks[trackId];
    if (!track) return state;
    const historyUpdate = pushHistory(state, 'Remove Track');
    
    const { [trackId]: _, ...remainingTracks } = state.tracks;
    
    // Also remove clips on this track
    const remainingClips = { ...state.clips };
    track.clipIds.forEach(id => delete remainingClips[id]);
    
    const seq = state.sequences[track.sequenceId];
    
    return {
      ...historyUpdate,
      tracks: remainingTracks,
      clips: remainingClips,
      sequences: seq ? {
        ...state.sequences,
        [seq.id]: { ...seq, trackIds: seq.trackIds.filter(id => id !== trackId) }
      } : state.sequences
    };
  }),

  reorderTracks: (trackIds) => set((state) => {
    const historyUpdate = pushHistory(state, 'Reorder Tracks');
    const seq = state.sequences[state.activeSequenceId || ''];
    if (!seq) return state;
    return {
      ...historyUpdate,
      sequences: {
        ...state.sequences,
        [seq.id]: { ...seq, trackIds }
      }
    };
  }),

  undo: () => set((state) => {
    if (state.past.length === 0) return state;
    const previous = state.past[state.past.length - 1];
    return {
      sequences: previous.pastState.sequences,
      tracks: previous.pastState.tracks,
      clips: previous.pastState.clips,
      past: state.past.slice(0, -1),
      future: [
        { id: crypto.randomUUID(), label: 'Undo', timestamp: Date.now(), pastState: { sequences: state.sequences, tracks: state.tracks, clips: state.clips } },
        ...state.future
      ]
    };
  }),

  redo: () => set((state) => {
    if (state.future.length === 0) return state;
    const next = state.future[0];
    return {
      sequences: next.pastState.sequences,
      tracks: next.pastState.tracks,
      clips: next.pastState.clips,
      past: [ ...state.past, { id: crypto.randomUUID(), label: 'Redo', timestamp: Date.now(), pastState: { sequences: state.sequences, tracks: state.tracks, clips: state.clips } } ],
      future: state.future.slice(1)
    };
  })
}));
