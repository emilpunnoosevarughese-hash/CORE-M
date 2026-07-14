import type { PropertyTrack } from '@corem/animation';

export type TrackType = 'video' | 'audio' | 'text' | 'image' | 'shape' | 'adjustment' | 'camera' | 'light' | 'solid' | 'gradient' | 'null' | 'sticker' | 'subtitle' | 'mask' | 'overlay' | 'particle' | 'effect';
export type ToolType = 'selection' | 'hand' | 'blade' | 'split' | 'slip' | 'slide' | 'ripple' | 'zoom' | 'snap';

export interface Timebase {
  fps: number;
  sampleRate?: number;
}

export interface Transform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  anchorX: number;
  anchorY: number;
}

export interface Marker {
  id: string;
  time: number; // in frames
  type: 'timeline' | 'clip' | 'color' | 'comment' | 'chapter';
  label?: string;
  color?: string;
  clipId?: string; // if it's a clip marker
}

export interface Clip {
  id: string;
  trackId: string;
  assetId: string; // references @corem/assets
  
  // Timing (in frames relative to Timebase)
  start: number; // position on timeline
  duration: number; // duration on timeline
  sourceStart: number; // in-point of the source media
  
  // Properties
  name: string;
  colorLabel?: string;
  locked: boolean;
  disabled: boolean;
  
  // Grouping & Hierarchy
  groupId?: string; // for flat grouped clips
  isGroup?: boolean;
  collapsed?: boolean;
  parentId?: string; // Hierarchical layer parenting
  childrenIds?: string[];
  
  linkedClipIds: string[]; // e.g. linked audio track
  notes?: string;
  
  // Compositing
  isAdjustmentLayer?: boolean; // If true, effects apply to all layers below
  assetType?: 'media' | 'composition' | 'solid' | 'text' | 'shape' | 'light' | 'camera' | 'particle' | 'smart_object'; 
  transform: Transform;
  
  // Audio specific
  audio?: AudioProperties;
  
  // Effects specific
  effects: any[]; // Using any to avoid circular deps for now, actual type in @corem/effects
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft_light' | 'hard_light' | 'darken' | 'lighten' | 'difference' | 'exclusion' | 'color_dodge' | 'color_burn' | 'linear_dodge' | 'linear_burn' | 'hue' | 'saturation' | 'color' | 'luminosity';
  opacity: number;
  
  // Animation specific
  animations?: Record<string, PropertyTrack>;
}

export interface Keyframe {
  time: number; // in frames, relative to clip start
  value: number;
  easing?: 'linear' | 'bezier';
}

export interface AudioProperties {
  volume: number; // 0.0 to 1.0+
  pan: number; // -1.0 to 1.0
  fadeInFrames: number;
  fadeOutFrames: number;
  volumeKeyframes: Keyframe[];
  panKeyframes: Keyframe[];
}

export interface Transition {
  id: string;
  typeId: string; // e.g. 'cross_dissolve', 'wipe'
  
  // Timing (in frames relative to Timebase)
  start: number; // position on timeline
  duration: number; // duration of the transition
  
  // Adjacent clips (null if transitioning from/to black)
  clipAId: string | null;
  clipBId: string | null;
  
  // Custom transition settings
  parameters: Record<string, any>;
}

export interface Track {
  id: string;
  sequenceId: string;
  type: TrackType;
  name: string;
  index: number;
  
  // State
  locked: boolean;
  hidden: boolean;
  solo: boolean;
  muted: boolean;
  
  // UI
  color?: string;
  height: number;
  
  clipIds: string[]; // references clips by ID (normalized)
  transitions: Transition[]; // Transitions on this track
}

export interface Sequence {
  id: string;
  projectId: string;
  name: string;
  timebase: Timebase;
  duration: number; // total frames
  
  trackIds: string[]; // ordered list of tracks
  markers: Marker[];
}

export interface SelectionState {
  clipIds: string[];
  trackIds: string[];
}

export interface PlayheadState {
  currentFrame: number;
  isPlaying: boolean;
}

export interface HistoryAction {
  id: string;
  label: string;
  timestamp: number;
  // Deep clone of the normalized state before the mutation
  pastState: any; 
}
