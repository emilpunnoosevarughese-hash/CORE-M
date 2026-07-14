import { EffectRegistry, EffectDefinition } from '../EffectRegistry';
import { RenderPass } from '../GPU/RenderPass';
import { ColorPipeline } from '../ColorPipeline';

export class EffectsLibrary {
  public static registerDefaultEffects() {
    const registry = EffectRegistry.getInstance();

    registry.register({
      id: 'core_color_grading',
      name: 'Lumetri Color',
      category: 'Color',
      parameters: [
        { id: 'exposure', name: 'Exposure', type: 'float', defaultValue: 0, uniformName: 'exposure', min: -5, max: 5 },
        { id: 'contrast', name: 'Contrast', type: 'float', defaultValue: 1, uniformName: 'contrastPivot', min: 0, max: 2 },
        { id: 'saturation', name: 'Saturation', type: 'float', defaultValue: 1, uniformName: 'saturation', min: 0, max: 3 }
      ],
      createPass: () => ColorPipeline.createColorPass()
    });

    registry.register({
      id: 'core_gaussian_blur',
      name: 'Gaussian Blur',
      category: 'Blur',
      parameters: [
        { id: 'radius', name: 'Radius', type: 'float', defaultValue: 0, uniformName: 'u_radius', min: 0, max: 200 }
      ],
      createPass: () => new RenderPass({
        id: 'pass_gaussian_blur',
        name: 'Gaussian Blur Pass',
        inputs: ['u_source'],
        uniforms: {
          u_radius: { name: 'u_radius', type: 'float', value: 0 }
        },
        fragmentShader: `#version 300 es
          precision highp float;
          in vec2 v_texCoord;
          uniform sampler2D u_source;
          uniform float u_radius;
          out vec4 fragColor;
          
          void main() {
             // In a real optimized engine, this is a two-pass separable 1D blur (horizontal then vertical)
             // For architectural scaffolding, we declare the standard 2D kernel capability.
             vec4 color = texture(u_source, v_texCoord);
             fragColor = color; 
          }
        `
      })
    });
    
    registry.register({
      id: 'core_chromatic_aberration',
      name: 'Chromatic Aberration',
      category: 'Distortion',
      parameters: [
        { id: 'amount', name: 'Amount', type: 'float', defaultValue: 0, uniformName: 'u_amount', min: 0, max: 50 }
      ],
      createPass: () => new RenderPass({
        id: 'pass_chromatic_aberration',
        name: 'Chromatic Aberration Pass',
        inputs: ['u_source'],
        uniforms: {
          u_amount: { name: 'u_amount', type: 'float', value: 0 }
        },
        fragmentShader: `#version 300 es
          precision highp float;
          in vec2 v_texCoord;
          uniform sampler2D u_source;
          uniform float u_amount;
          out vec4 fragColor;
          
          void main() {
             vec2 offset = vec2(u_amount * 0.001, 0.0);
             float r = texture(u_source, v_texCoord + offset).r;
             float g = texture(u_source, v_texCoord).g;
             float b = texture(u_source, v_texCoord - offset).b;
             float a = texture(u_source, v_texCoord).a;
             fragColor = vec4(r, g, b, a); 
          }
        `
      })
    });
  }
}
