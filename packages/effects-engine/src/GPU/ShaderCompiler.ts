export class ShaderCache {
  private static instance: ShaderCache;
  private cache: Map<string, WebGLProgram> = new Map();

  private constructor() {}

  public static getInstance(): ShaderCache {
    if (!ShaderCache.instance) {
      ShaderCache.instance = new ShaderCache();
    }
    return ShaderCache.instance;
  }

  public get(hash: string): WebGLProgram | undefined {
    return this.cache.get(hash);
  }

  public set(hash: string, program: WebGLProgram): void {
    this.cache.set(hash, program);
  }

  public clear(gl: WebGL2RenderingContext): void {
    for (const program of this.cache.values()) {
      gl.deleteProgram(program);
    }
    this.cache.clear();
  }
}

export class ShaderCompiler {
  private static generateHash(vertex: string, fragment: string): string {
    // Simple hash for caching (in production, use murmurhash or similar)
    return `hash_${vertex.length}_${fragment.length}_${vertex.charCodeAt(0)}_${fragment.charCodeAt(0)}`;
  }

  public static compileProgram(gl: WebGL2RenderingContext, vertexSrc: string, fragmentSrc: string): WebGLProgram {
    const cache = ShaderCache.getInstance();
    const hash = this.generateHash(vertexSrc, fragmentSrc);
    
    const cached = cache.get(hash);
    if (cached) return cached;

    const vShader = this.compileShader(gl, gl.VERTEX_SHADER, vertexSrc);
    const fShader = this.compileShader(gl, gl.FRAGMENT_SHADER, fragmentSrc);

    const program = gl.createProgram();
    if (!program) throw new Error('Failed to create WebGL program');

    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(`Shader linking failed: ${info}`);
    }

    // Shaders can be deleted after linking to save memory
    gl.deleteShader(vShader);
    gl.deleteShader(fShader);

    cache.set(hash, program);
    return program;
  }

  private static compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) throw new Error('Failed to create shader');

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      console.error(`Shader Source:\n${source}`);
      throw new Error(`Shader compilation failed: ${info}`);
    }

    return shader;
  }
}
