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
      { id: 'temperature', name: 'Temperature', type: 'float', defaultValue: 0.0,  min: -1.0,  max: 1.0,   step: 0.01 },
      { id: 'tint',        name: 'Tint',        type: 'float', defaultValue: 0.0,  min: -1.0,  max: 1.0,   step: 0.01 },
      { id: 'exposure',    name: 'Exposure',    type: 'float', defaultValue: 0.0,  min: -5.0,  max: 5.0,   step: 0.01 },
      { id: 'contrast',    name: 'Contrast',    type: 'float', defaultValue: 1.0,  min: 0.0,   max: 3.0,   step: 0.01 },
      { id: 'highlights',  name: 'Highlights',  type: 'float', defaultValue: 0.0,  min: -0.5,  max: 0.5,   step: 0.01 },
      { id: 'shadows',     name: 'Shadows',     type: 'float', defaultValue: 0.0,  min: -0.5,  max: 0.5,   step: 0.01 },
      { id: 'whites',      name: 'Whites',      type: 'float', defaultValue: 0.0,  min: -0.5,  max: 0.5,   step: 0.01 },
      { id: 'blacks',      name: 'Blacks',      type: 'float', defaultValue: 0.0,  min: -0.5,  max: 0.5,   step: 0.01 },
      { id: 'saturation',  name: 'Saturation',  type: 'float', defaultValue: 1.0,  min: 0.0,   max: 3.0,   step: 0.01 },
      { id: 'vibrance',    name: 'Vibrance',    type: 'float', defaultValue: 0.0,  min: -1.0,  max: 1.0,   step: 0.01 },
      { id: 'sharpen',     name: 'Sharpen',     type: 'float', defaultValue: 0.0,  min: 0.0,   max: 100.0, step: 1.0  },
      { id: 'clarity',     name: 'Clarity',     type: 'float', defaultValue: 0.0,  min: -100.0,max: 100.0, step: 1.0  },
      { id: 'dehaze',      name: 'Dehaze',      type: 'float', defaultValue: 0.0,  min: -0.5,  max: 0.5,   step: 0.01 },
      { id: 'vignette',    name: 'Vignette',    type: 'float', defaultValue: 0.0,  min: -1.0,  max: 1.0,   step: 0.01 },
      { id: 'lift',   name: 'Lift',   type: 'vec3', defaultValue: [0.0, 0.0, 0.0] },
      { id: 'gamma',  name: 'Gamma',  type: 'vec3', defaultValue: [1.0, 1.0, 1.0] },
      { id: 'gain',   name: 'Gain',   type: 'vec3', defaultValue: [1.0, 1.0, 1.0] },
      { id: 'offset', name: 'Offset', type: 'vec3', defaultValue: [0.0, 0.0, 0.0] }
    ],
    fragmentShader: `
      ${SHADER_UTILS}
      uniform float u_temperature;
      uniform float u_tint;
      uniform float u_exposure;
      uniform float u_contrast;
      uniform float u_highlights;
      uniform float u_shadows;
      uniform float u_whites;
      uniform float u_blacks;
      uniform float u_saturation;
      uniform float u_vibrance;
      uniform float u_sharpen;
      uniform float u_clarity;
      uniform float u_dehaze;
      uniform float u_vignette;
      uniform vec2 u_resolution;
      uniform vec3 u_lift;
      uniform vec3 u_gamma;
      uniform vec3 u_gain;
      uniform vec3 u_offset;

      void main() {
        vec2 pixel = vec2(1.0) / u_resolution;
        vec4 color = texture2D(u_image, v_texCoord);
        vec3 rgb = color.rgb;

        // --- Sharpen / Clarity ---
        if (abs(u_sharpen) > 0.01 || abs(u_clarity) > 0.01) {
          vec3 N = texture2D(u_image, v_texCoord + vec2(0.0, -pixel.y)).rgb;
          vec3 S = texture2D(u_image, v_texCoord + vec2(0.0,  pixel.y)).rgb;
          vec3 E = texture2D(u_image, v_texCoord + vec2( pixel.x, 0.0)).rgb;
          vec3 W = texture2D(u_image, v_texCoord + vec2(-pixel.x, 0.0)).rgb;
          vec3 blur = (N + S + E + W) * 0.25;
          vec3 detail = rgb - blur;
          float s = u_sharpen / 100.0;
          rgb += detail * (s * 3.0);
          float c = u_clarity / 100.0;
          float lum0 = dot(rgb, vec3(0.299, 0.587, 0.114));
          float midtoneWeight = 1.0 - pow(2.0 * lum0 - 1.0, 2.0);
          rgb += detail * (c * midtoneWeight * 2.0);
        }

        // 1. Exposure
        rgb = rgb * pow(2.0, u_exposure);

        // 2. Temperature & Tint
        rgb *= vec3(1.0 + u_temperature, 1.0 + u_tint * 0.5, 1.0 - u_temperature);

        // 3. Contrast (S-curve around 0.5)
        rgb = (rgb - 0.5) * u_contrast + 0.5;

        // 4. Tone range adjustments (luma-based)
        float lum = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
        // Highlights: affect bright areas (lum > 0.6)
        float hiMask = smoothstep(0.4, 1.0, lum);
        rgb += u_highlights * hiMask;
        // Shadows: affect dark areas (lum < 0.4)
        float shMask = 1.0 - smoothstep(0.0, 0.6, lum);
        rgb += u_shadows * shMask;
        // Whites: boost very bright clipping
        float whMask = smoothstep(0.7, 1.0, lum);
        rgb += u_whites * whMask;
        // Blacks: crush very dark areas
        float blMask = 1.0 - smoothstep(0.0, 0.3, lum);
        rgb += u_blacks * blMask;

        // 5. Dehaze (basic haze removal / addition via atmosphere lifting)
        rgb = mix(rgb, rgb * (1.0 + u_dehaze * 0.5), abs(u_dehaze));

        // 6. CDL — Gain, Lift, Offset, Gamma
        rgb = rgb * u_gain;
        rgb = rgb + u_lift * (1.0 - rgb);
        rgb = rgb + u_offset;
        rgb = max(rgb, vec3(0.0));
        rgb = pow(rgb, 1.0 / max(u_gamma, vec3(0.0001)));

        // 7. Saturation
        float lum2 = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
        rgb = mix(vec3(lum2), rgb, u_saturation);

        // 8. Vibrance (smart saturation — boosts less-saturated colors more)
        float maxC = max(rgb.r, max(rgb.g, rgb.b));
        float minC = min(rgb.r, min(rgb.g, rgb.b));
        float sat = maxC - minC;
        float vibFactor = u_vibrance * (1.0 - sat);
        float lum3 = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
        rgb = mix(vec3(lum3), rgb, 1.0 + vibFactor);

        // 9. Vignette
        if (abs(u_vignette) > 0.001) {
          vec2 uv = v_texCoord - 0.5;
          float vignDist = dot(uv, uv);
          float vignMask = smoothstep(0.1, 0.75, vignDist);
          if (u_vignette > 0.0) {
            rgb = mix(rgb, rgb * (1.0 - vignMask), u_vignette);
          } else {
            rgb = mix(rgb, min(rgb + vignMask * 0.5, vec3(1.0)), -u_vignette);
          }
        }

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
