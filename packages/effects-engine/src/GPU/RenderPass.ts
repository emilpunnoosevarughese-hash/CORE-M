export type UniformType = 'float' | 'vec2' | 'vec3' | 'vec4' | 'int' | 'ivec2' | 'ivec3' | 'ivec4' | 'mat3' | 'mat4' | 'sampler2D';

export interface UniformDefinition {
  name: string;
  type: UniformType;
  value: any;
}

export interface RenderPassOptions {
  id: string;
  name: string;
  fragmentShader: string;
  vertexShader?: string;
  uniforms: Record<string, UniformDefinition>;
  inputs: string[]; // IDs of input textures (e.g. 'source', 'mask1')
  outputFormat?: '8bit' | 'float16'; // Overrides global HDR setting if necessary
}

export class RenderPass {
  public id: string;
  public name: string;
  public fragmentShader: string;
  public vertexShader: string;
  public uniforms: Map<string, UniformDefinition>;
  public inputs: string[];
  public outputFormat: '8bit' | 'float16';
  
  // Runtime references
  public program: WebGLProgram | null = null;
  public framebuffer: WebGLFramebuffer | null = null;
  public outputTexture: WebGLTexture | null = null;
  public width: number = 0;
  public height: number = 0;

  constructor(options: RenderPassOptions) {
    this.id = options.id;
    this.name = options.name;
    this.fragmentShader = options.fragmentShader;
    this.vertexShader = options.vertexShader || this.getDefaultVertexShader();
    this.uniforms = new Map(Object.entries(options.uniforms));
    this.inputs = options.inputs;
    this.outputFormat = options.outputFormat || '8bit';
  }

  private getDefaultVertexShader(): string {
    return `#version 300 es
      layout(location = 0) in vec2 a_position;
      layout(location = 1) in vec2 a_texCoord;
      out vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;
  }

  public setUniform(name: string, value: any) {
    const uniform = this.uniforms.get(name);
    if (uniform) {
      uniform.value = value;
    }
  }
}
