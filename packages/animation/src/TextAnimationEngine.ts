export type TextAnimationMode = 'character_sequential' | 'character_random' | 'word_sequential' | 'line_sequential';

export interface TextAnimatorProperties {
  mode: TextAnimationMode;
  delayPerUnit: number; // frames to delay per character/word
  
  // Transform offsets to apply per unit
  offsetX: number;
  offsetY: number;
  offsetScale: number;
  offsetRotation: number;
  offsetOpacity: number; // 0 to 1
  offsetBlur: number;
}

export class TextAnimationEngine {
  
  /**
   * Calculates the specific transforms for each character/word in a text block
   * based on the text animator properties evaluated for the current frame.
   */
  public static evaluateTextNodes(
    text: string, 
    animatorProps: TextAnimatorProperties, 
    currentFrame: number,
    clipStartFrame: number
  ) {
    // 1. Split text into units based on mode
    let units: string[] = [];
    if (animatorProps.mode.startsWith('character')) {
      units = text.split('');
    } else if (animatorProps.mode.startsWith('word')) {
      units = text.split(' ');
    } else if (animatorProps.mode.startsWith('line')) {
      units = text.split('\n');
    }
    
    const localFrame = currentFrame - clipStartFrame;
    
    // 2. Calculate animation state for each unit
    const unitTransforms = units.map((unit, index) => {
      // Determine the specific time offset for this unit
      let unitTimeDelay = 0;
      
      if (animatorProps.mode.includes('sequential')) {
        unitTimeDelay = index * animatorProps.delayPerUnit;
      } else if (animatorProps.mode.includes('random')) {
        // pseudo-random delay based on index
        unitTimeDelay = (Math.sin(index * 12.9898) * 43758.5453 % 1) * (units.length * animatorProps.delayPerUnit);
      }
      
      // Calculate how far along this unit is in its animation (0.0 to 1.0)
      // Usually animators drive a property from an offset to 0.
      // So if opacity offset is -1, it means it starts invisible and animates to 0 (normal).
      
      // For architecture demo, we assume the animator properties are driving the interpolation globally,
      // and we just apply the offset scaling.
      
      // E.g., if offsetOpacity = 1 from the keyframes, we apply it. If the keyframes say 0.5, we apply 0.5.
      // To get the cascading effect, the Keyframe Engine drives a "completion" property from 0 to 100%.
      
      return {
        text: unit,
        transform: {
          x: animatorProps.offsetX,
          y: animatorProps.offsetY,
          scale: animatorProps.offsetScale,
          rotation: animatorProps.offsetRotation,
          opacity: animatorProps.offsetOpacity,
          blur: animatorProps.offsetBlur
        }
      };
    });

    return unitTransforms;
  }
}
