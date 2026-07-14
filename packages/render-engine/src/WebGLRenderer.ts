import { TexturePool } from './TexturePool';
import { FramePool } from './FramePool';
import { ShaderManager } from './ShaderManager';

export class WebGLRenderer {
  public gl: WebGL2RenderingContext | WebGLRenderingContext;
  public texturePool: TexturePool;
  public framePool: FramePool;
  public shaderManager: ShaderManager;
  public isWebGL2: boolean;

  constructor(canvas: HTMLCanvasElement) {
    let gl: any = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: true });
    this.isWebGL2 = !!gl;

    if (!gl) {
      console.warn("WebGL2 not supported, falling back to WebGL1");
      gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: true }) as WebGLRenderingContext;
    }

    if (!gl) {
      throw new Error("WebGL is not supported on this device.");
    }

    this.gl = gl;
    this.texturePool = new TexturePool(this.gl);
    this.framePool = new FramePool(this.gl, this.texturePool);
    this.shaderManager = new ShaderManager(this.gl);

    this.setupBaseState();
  }

  private setupBaseState() {
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.clearColor(0, 0, 0, 0);
  }

  clear() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  resize(width: number, height: number) {
    this.gl.viewport(0, 0, width, height);
  }

  destroy() {
    this.texturePool.clear();
    this.framePool.clear();
    this.shaderManager.clear();
    
    const ext = this.gl.getExtension('WEBGL_lose_context');
    if (ext) ext.loseContext();
  }
}
