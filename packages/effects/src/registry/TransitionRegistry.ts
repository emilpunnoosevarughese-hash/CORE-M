export interface TransitionParameter {
  id: string;
  name: string;
  type: 'float' | 'vec2' | 'vec3';
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
}

export interface TransitionDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  parameters: TransitionParameter[];
  fragmentShader: string;
}

const TRANSITIONS: Record<string, TransitionDefinition> = {
  cross_dissolve: {
    id: 'cross_dissolve',
    name: 'Cross Dissolve',
    category: 'Basic',
    description: 'Smoothly fades one clip into another.',
    parameters: [],
    fragmentShader: `
      precision highp float;
      varying vec2 v_texCoord;
      uniform sampler2D u_imageA;
      uniform sampler2D u_imageB;
      uniform float u_progress;
      
      void main() {
        vec4 colorA = texture2D(u_imageA, v_texCoord);
        vec4 colorB = texture2D(u_imageB, v_texCoord);
        gl_FragColor = mix(colorA, colorB, u_progress);
      }
    `
  },
  wipe_right: {
    id: 'wipe_right',
    name: 'Wipe Right',
    category: 'Wipes',
    description: 'Wipes the new clip from left to right.',
    parameters: [
      { id: 'softness', name: 'Softness', type: 'float', defaultValue: 0.1, min: 0.0, max: 1.0, step: 0.01 }
    ],
    fragmentShader: `
      precision highp float;
      varying vec2 v_texCoord;
      uniform sampler2D u_imageA;
      uniform sampler2D u_imageB;
      uniform float u_progress;
      uniform float u_softness;
      
      void main() {
        vec4 colorA = texture2D(u_imageA, v_texCoord);
        vec4 colorB = texture2D(u_imageB, v_texCoord);
        
        float edge = u_progress * (1.0 + u_softness) - u_softness;
        float alpha = smoothstep(edge, edge + u_softness, v_texCoord.x);
        
        gl_FragColor = mix(colorB, colorA, alpha);
      }
    `
  },
  zoom_blur: {
    id: 'zoom_blur',
    name: 'Zoom Blur',
    category: 'Dynamic',
    description: 'Zooms and blurs into the next clip.',
    parameters: [
      { id: 'strength', name: 'Strength', type: 'float', defaultValue: 0.5, min: 0.0, max: 2.0, step: 0.05 }
    ],
    fragmentShader: `
      precision highp float;
      varying vec2 v_texCoord;
      uniform sampler2D u_imageA;
      uniform sampler2D u_imageB;
      uniform float u_progress;
      uniform float u_strength;
      
      void main() {
        vec2 center = vec2(0.5, 0.5);
        
        // Progress goes from 0 to 1
        // We want a zoom in for A (0 to 0.5) and zoom out for B (0.5 to 1)
        float zoomA = 1.0 + (u_progress * u_strength);
        float zoomB = 1.0 + ((1.0 - u_progress) * u_strength);
        
        vec2 uvA = center + (v_texCoord - center) / zoomA;
        vec2 uvB = center + (v_texCoord - center) / zoomB;
        
        vec4 colorA = texture2D(u_imageA, uvA);
        vec4 colorB = texture2D(u_imageB, uvB);
        
        // Simple directional blur could be added, but keeping it simple zoom for MVP
        gl_FragColor = mix(colorA, colorB, smoothstep(0.3, 0.7, u_progress));
      }
    `
  },
  glitch: {
    id: 'glitch',
    name: 'Digital Glitch',
    category: 'Stylized',
    description: 'Digital distortion transition.',
    parameters: [],
    fragmentShader: `
      precision highp float;
      varying vec2 v_texCoord;
      uniform sampler2D u_imageA;
      uniform sampler2D u_imageB;
      uniform float u_progress;
      
      float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }
      
      void main() {
        vec2 uv = v_texCoord;
        
        // Add random horizontal displacement based on progress
        float intensity = sin(u_progress * 3.14159);
        if (intensity > 0.0) {
          float noise = random(vec2(floor(uv.y * 50.0), u_progress)) * 2.0 - 1.0;
          uv.x += noise * 0.1 * intensity;
        }
        
        vec4 colorA = texture2D(u_imageA, uv);
        vec4 colorB = texture2D(u_imageB, uv);
        
        gl_FragColor = mix(colorA, colorB, smoothstep(0.4, 0.6, u_progress));
      }
    `
  }
};

export class TransitionRegistry {
  static getTransition(id: string): TransitionDefinition | undefined {
    return TRANSITIONS[id];
  }

  static getAllTransitions(): TransitionDefinition[] {
    return Object.values(TRANSITIONS);
  }
}
