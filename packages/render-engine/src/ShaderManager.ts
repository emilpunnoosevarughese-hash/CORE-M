export class ShaderManager {
  private gl: WebGL2RenderingContext | WebGLRenderingContext;
  private programCache: Map<string, WebGLProgram> = new Map();
  private shaderSourceCache: Map<string, string> = new Map();

  constructor(gl: WebGL2RenderingContext | WebGLRenderingContext) {
    this.gl = gl;
    
    // Add hot-reload listener for Developer Mode
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'r') {
          e.preventDefault();
          this.hotReloadShaders();
        }
      });
    }
  }

  compileShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type);
    if (!shader) throw new Error("Could not create shader");
    
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const info = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw new Error(`Shader compile error: \n${info}`);
    }
    return shader;
  }

  createProgram(id: string, vertSource: string, fragSource: string): WebGLProgram {
    if (this.programCache.has(id)) {
      return this.programCache.get(id)!;
    }

    const vertShader = this.compileShader(this.gl.VERTEX_SHADER, vertSource);
    const fragShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragSource);

    const program = this.gl.createProgram();
    if (!program) throw new Error("Could not create WebGL program");

    this.gl.attachShader(program, vertShader);
    this.gl.attachShader(program, fragShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const info = this.gl.getProgramInfoLog(program);
      this.gl.deleteProgram(program);
      throw new Error(`Program link error: \n${info}`);
    }

    // Cleanup shaders since they are now compiled into the program
    this.gl.deleteShader(vertShader);
    this.gl.deleteShader(fragShader);

    this.programCache.set(id, program);
    
    // Store source for hot reloading
    this.shaderSourceCache.set(`${id}_vert`, vertSource);
    this.shaderSourceCache.set(`${id}_frag`, fragSource);

    return program;
  }

  getProgram(id: string): WebGLProgram | undefined {
    return this.programCache.get(id);
  }

  hotReloadShaders() {
    console.log('[ShaderManager] Hot Reloading Shaders...');
    const programIds = Array.from(this.programCache.keys());
    
    for (const id of programIds) {
      const oldProgram = this.programCache.get(id);
      if (oldProgram) this.gl.deleteProgram(oldProgram);
      this.programCache.delete(id);
      
      const vert = this.shaderSourceCache.get(`${id}_vert`);
      const frag = this.shaderSourceCache.get(`${id}_frag`);
      
      if (vert && frag) {
        try {
          this.createProgram(id, vert, frag);
        } catch (e) {
          console.error(`[ShaderManager] Failed to reload ${id}`, e);
        }
      }
    }
    console.log('[ShaderManager] Hot Reload Complete.');
  }

  clear() {
    for (const program of this.programCache.values()) {
      this.gl.deleteProgram(program);
    }
    this.programCache.clear();
    this.shaderSourceCache.clear();
  }
}
