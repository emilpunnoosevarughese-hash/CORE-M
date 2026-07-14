export type EasingType = 
  | 'linear' 
  | 'easeIn' 
  | 'easeOut' 
  | 'easeInOut' 
  | 'bounce' 
  | 'elastic' 
  | 'bezier' // continuous bezier with handles
  | 'autoBezier' 
  | 'customBezier' // fully independent handles
  | 'hold'; // constant until next keyframe

export interface BezierHandle {
  x: number; // 0 to 1 relative to keyframe duration
  y: number; // relative value change
}

export interface SpatialHandle {
  x: number;
  y: number;
}

export interface AnimationKeyframe {
  id: string;
  time: number; // frame number, relative to clip start
  value: any; // number, color array, etc.
  easing: EasingType;
  
  // Custom Bezier handles for timing interpolation
  inTangent?: BezierHandle;
  outTangent?: BezierHandle;
  
  // Custom spatial paths (e.g. for motion paths on position)
  spatialInTangent?: SpatialHandle;
  spatialOutTangent?: SpatialHandle;
}

export interface PropertyTrack {
  propertyId: string; // e.g., "transform.position.x", "effect.blur.radius", "mask.0.feather"
  keyframes: AnimationKeyframe[];
  expression?: string; // Sandboxed JS expression code (e.g. "wiggle(2, 50)")
  enabled: boolean;
}

// Support complex property definitions
export interface AnimatedProperty {
  tracks: Map<string, PropertyTrack>;
}

// Preset definition
export interface MotionPreset {
  id: string;
  name: string;
  description: string;
  type: 'transform' | 'text' | 'shape' | 'effect' | 'transition';
  apply: (targetId: string, tracks: Map<string, PropertyTrack>) => void;
}
