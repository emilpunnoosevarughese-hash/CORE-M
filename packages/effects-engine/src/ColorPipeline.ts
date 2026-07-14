import { RenderPass } from './GPU/RenderPass';

export interface ColorPipelineSettings {
  // Primary
  temperature: number;
  tint: number;
  exposure: number;
  contrast: number;
  pivot: number;
  saturation: number;

  // Lift/Gamma/Gain (Shadows/Midtones/Highlights)
  lift: { r: number, g: number, b: number, y: number };
  gamma: { r: number, g: number, b: number, y: number };
  gain: { r: number, g: number, b: number, y: number };
  offset: { r: number, g: number, b: number };

  // Curves (simplistic representation, typically array of points)
  rgbCurves: number[];
  hueVsHue: number[];
  hueVsSat: number[];
  satVsSat: number[];
}

export class ColorPipeline {
  /**
   * Generates a RenderPass that acts as a comprehensive Color Grading node.
   * This shader handles Temperature, Tint, Exposure, Contrast, LGG, and Saturation 
   * in one heavy pass to minimize framebuffer ping-ponging.
   */
  public static createColorPass(): RenderPass {
    return new RenderPass({
      id: 'color_grading',
      name: 'Color Pipeline',
      inputs: ['u_source'],
      uniforms: {
        tempTint: { name: 'tempTint', type: 'vec2', value: [0, 0] },
        exposure: { name: 'exposure', type: 'float', value: 0 },
        contrastPivot: { name: 'contrastPivot', type: 'vec2', value: [1.0, 0.5] },
        saturation: { name: 'saturation', type: 'float', value: 1.0 },
        lift: { name: 'lift', type: 'vec4', value: [0, 0, 0, 0] },
        gamma: { name: 'gamma', type: 'vec4', value: [1, 1, 1, 1] },
        gain: { name: 'gain', type: 'vec4', value: [1, 1, 1, 1] },
        offset: { name: 'offset', type: 'vec3', value: [0, 0, 0] }
      },
      fragmentShader: `#version 300 es
        precision highp float;
        in vec2 v_texCoord;
        uniform sampler2D u_source;
        
        // Uniforms
        uniform vec2 tempTint;
        uniform float exposure;
        uniform vec2 contrastPivot;
        uniform float saturation;
        uniform vec4 lift;
        uniform vec4 gamma;
        uniform vec4 gain;
        uniform vec3 offset;
        
        out vec4 fragColor;
        
        vec3 adjustTemperatureTint(vec3 color, float temp, float tint) {
            // Simplified matrix conversion for white balance
            color.r = color.r + temp;
            color.b = color.b - temp;
            color.g = color.g + tint;
            return color;
        }

        vec3 adjustContrast(vec3 color, float contrast, float pivot) {
            return (color - pivot) * contrast + pivot;
        }

        // CDL (Color Decision List) math for Lift/Gamma/Gain/Offset
        vec3 applyCDL(vec3 color) {
            // Lift = shadow offset
            // Gain = highlight multiplier
            // Gamma = midtone power curve
            
            // Apply Master Y (Luma) + RGB individual
            vec3 l = lift.rgb + lift.a;
            vec3 ga = gain.rgb * gain.a;
            vec3 gm = gamma.rgb * gamma.a;
            
            vec3 outColor = clamp((color * ga) + l, 0.0, 1.0);
            outColor = pow(outColor, gm);
            outColor += offset;
            
            return outColor;
        }

        void main() {
            vec4 color = texture(u_source, v_texCoord);
            
            // 1. Exposure (Linear Light Multiplier)
            vec3 rgb = color.rgb * pow(2.0, exposure);
            
            // 2. Temp/Tint
            rgb = adjustTemperatureTint(rgb, tempTint.x, tempTint.y);
            
            // 3. Contrast
            rgb = adjustContrast(rgb, contrastPivot.x, contrastPivot.y);
            
            // 4. CDL (Lift/Gamma/Gain)
            rgb = applyCDL(rgb);
            
            // 5. Saturation
            float luma = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
            rgb = mix(vec3(luma), rgb, saturation);
            
            fragColor = vec4(clamp(rgb, 0.0, 1.0), color.a);
        }
      `
    });
  }
}
