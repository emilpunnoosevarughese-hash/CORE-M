export type EffectParameterType = 'float' | 'int' | 'color' | 'boolean' | 'vec2' | 'vec3' | 'texture3d';

export interface EffectParameter {
  id: string;
  name: string;
  type: EffectParameterType;
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
}

export interface EffectDefinition {
  id: string;
  name: string;
  category: 'Blur' | 'Color' | 'Stylize' | 'Distortion' | 'Utility';
  description: string;
  parameters: EffectParameter[];
  fragmentShader: string;
}

const SHADER_UTILS = `
precision highp float;
varying vec2 v_texCoord;
uniform sampler2D u_image;
`;

export const EFFECTS: Record<string, EffectDefinition> = {
  'gaussian_blur': {
    id: 'gaussian_blur',
    name: 'Gaussian Blur',
    category: 'Blur',
    description: 'Smoothly blurs the image using a Gaussian function.',
    parameters: [
      { id: 'radius', name: 'Radius', type: 'float', defaultValue: 10.0, min: 0, max: 100, step: 1.0 },
      { id: 'direction', name: 'Direction (X,Y)', type: 'vec2', defaultValue: [1.0, 1.0] }
    ],
    fragmentShader: `
      ${SHADER_UTILS}
      uniform float u_radius;
      uniform vec2 u_direction;
      uniform vec2 u_resolution;

      void main() {
        vec2 uv = v_texCoord;
        vec4 color = vec4(0.0);
        
        if (u_radius == 0.0) {
          gl_FragColor = texture2D(u_image, uv);
          return;
        }

        vec2 off1 = vec2(1.3846153846) * u_direction;
        vec2 off2 = vec2(3.2307692308) * u_direction;

        color += texture2D(u_image, uv) * 0.2270270270;
        color += texture2D(u_image, uv + (off1 / u_resolution)) * 0.3162162162;
        color += texture2D(u_image, uv - (off1 / u_resolution)) * 0.3162162162;
        color += texture2D(u_image, uv + (off2 / u_resolution)) * 0.0702702703;
        color += texture2D(u_image, uv - (off2 / u_resolution)) * 0.0702702703;

        gl_FragColor = color;
      }
    `
  },
  'color_correction': {
    id: 'color_correction',
    name: 'Color Correction',
    category: 'Color',
    description: 'Adjust brightness, contrast, saturation.',
    parameters: [
      { id: 'brightness', name: 'Brightness', type: 'float', defaultValue: 1.0, min: 0, max: 3, step: 0.1 },
      { id: 'contrast', name: 'Contrast', type: 'float', defaultValue: 1.0, min: 0, max: 3, step: 0.1 },
      { id: 'saturation', name: 'Saturation', type: 'float', defaultValue: 1.0, min: 0, max: 3, step: 0.1 }
    ],
    fragmentShader: `
      ${SHADER_UTILS}
      uniform float u_brightness;
      uniform float u_contrast;
      uniform float u_saturation;

      void main() {
        vec4 color = texture2D(u_image, v_texCoord);
        
        // Brightness
        color.rgb *= u_brightness;
        
        // Contrast
        color.rgb = (color.rgb - 0.5) * u_contrast + 0.5;
        
        // Saturation
        float luminance = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
        color.rgb = mix(vec3(luminance), color.rgb, u_saturation);
        
        gl_FragColor = color;
      }
    `
  },
  'primary_color': {
    id: 'primary_color',
    name: 'Primary Color Wheels',
    description: 'Professional lift, gamma, gain and primary color adjustments',
    category: 'Color',
    parameters: [
      { id: 'temperature', name: 'Temperature', type: 'float', defaultValue: 0.0, min: -1.0, max: 1.0, step: 0.01 },
      { id: 'tint', name: 'Tint', type: 'float', defaultValue: 0.0, min: -1.0, max: 1.0, step: 0.01 },
      { id: 'exposure', name: 'Exposure', type: 'float', defaultValue: 0.0, min: -5.0, max: 5.0, step: 0.01 },
      { id: 'contrast', name: 'Contrast', type: 'float', defaultValue: 1.0, min: 0.0, max: 3.0, step: 0.01 },
      { id: 'saturation', name: 'Saturation', type: 'float', defaultValue: 1.0, min: 0.0, max: 3.0, step: 0.01 },
      { id: 'lift', name: 'Lift', type: 'vec3', defaultValue: [0.0, 0.0, 0.0] },
      { id: 'gamma', name: 'Gamma', type: 'vec3', defaultValue: [1.0, 1.0, 1.0] },
      { id: 'gain', name: 'Gain', type: 'vec3', defaultValue: [1.0, 1.0, 1.0] },
      { id: 'offset', name: 'Offset', type: 'vec3', defaultValue: [0.0, 0.0, 0.0] }
    ],
    fragmentShader: `
      ${SHADER_UTILS}
      uniform float u_temperature;
      uniform float u_tint;
      uniform float u_exposure;
      uniform float u_contrast;
      uniform float u_saturation;
      
      uniform vec3 u_lift;
      uniform vec3 u_gamma;
      uniform vec3 u_gain;
      uniform vec3 u_offset;

      // Color Temperature to RGB conversion approximation
      vec3 getTemperatureColor(float t) {
          // Simplistic temp/tint adjustment mapping
          return vec3(1.0 + t, 1.0, 1.0 - t); 
      }

      void main() {
        vec4 color = texture2D(u_image, v_texCoord);
        vec3 rgb = color.rgb;

        // 1. Exposure
        rgb = rgb * pow(2.0, u_exposure);

        // 2. Temp & Tint
        vec3 balance = vec3(1.0 + u_temperature, 1.0 + u_tint, 1.0 - u_temperature);
        rgb *= balance;

        // 3. Contrast
        rgb = (rgb - 0.5) * u_contrast + 0.5;

        // 4. CDL (Lift, Gamma, Gain, Offset)
        // Gain
        rgb = rgb * u_gain;
        
        // Lift
        rgb = rgb + u_lift * (1.0 - rgb);

        // Offset
        rgb = rgb + u_offset;

        // Gamma (Power function)
        rgb = max(rgb, vec3(0.0)); // Prevent NaNs from negative values
        rgb = pow(rgb, 1.0 / max(u_gamma, vec3(0.0001)));

        // 5. Saturation
        float luminance = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
        rgb = mix(vec3(luminance), rgb, u_saturation);

        gl_FragColor = vec4(clamp(rgb, 0.0, 1.0), color.a);
      }
    `
  },
  'lut3d': {
    id: 'lut3d',
    name: '3D LUT',
    description: 'Apply 3D Look Up Tables (.cube)',
    category: 'Color',
    parameters: [
      { id: 'intensity', name: 'Intensity', type: 'float', defaultValue: 1.0, min: 0.0, max: 1.0, step: 0.01 },
      { id: 'lut', name: 'LUT Data', type: 'texture3d', defaultValue: null }
    ],
    fragmentShader: `
      ${SHADER_UTILS}
      precision highp sampler3D;
      
      uniform float u_intensity;
      uniform sampler3D u_lut;

      void main() {
        vec4 color = texture2D(u_image, v_texCoord);
        
        // 3D LUT lookup requires scaling the color to the texture coordinates (0.0 to 1.0)
        // Note: sampler3D uses a 3D texture coordinate (r, g, b)
        vec3 lutColor = texture(u_lut, clamp(color.rgb, 0.0, 1.0)).rgb;
        
        // Blend based on intensity
        color.rgb = mix(color.rgb, lutColor, u_intensity);
        
        gl_FragColor = color;
      }
    `
  }
};

export class EffectRegistry {
  static getEffect(id: string): EffectDefinition | undefined {
    return EFFECTS[id];
  }

  static getAllEffects(): EffectDefinition[] {
    return Object.values(EFFECTS);
  }
}
