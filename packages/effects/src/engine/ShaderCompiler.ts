export class ShaderCompiler {
  private gl: WebGL2RenderingContext;
  private cache: Map<string, WebGLProgram> = new Map();

  private static VERTEX_SHADER_SOURCE = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
      v_texCoord = a_texCoord;
    }
  `;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
  }

  compileShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type);
    if (!shader) throw new Error('Failed to create shader');
    
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const info = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw new Error('Could not compile WebGL shader: \\n' + info);
    }
    return shader;
  }

  createProgram(fragmentShaderSource: string, vertexShaderSource?: string): WebGLProgram {
    const vsSource = vertexShaderSource || ShaderCompiler.VERTEX_SHADER_SOURCE;
    const cacheKey = vsSource + '|' + fragmentShaderSource;
    
    // Basic caching by shader source hash (using string as key for simplicity)
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vsSource);
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = this.gl.createProgram();
    if (!program) throw new Error('Failed to create WebGL program');

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const info = this.gl.getProgramInfoLog(program);
      this.gl.deleteProgram(program);
      throw new Error('WebGL program linked failed: \\n' + info);
    }

    this.cache.set(cacheKey, program);
    return program;
  }
}
