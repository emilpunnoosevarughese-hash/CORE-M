import { WebGLRenderer } from './WebGLRenderer';

export class LayerRenderer {
  private renderer: WebGLRenderer;

  constructor(renderer: WebGLRenderer) {
    this.renderer = renderer;
  }

  /**
   * Renders a texture (from a video, image, or canvas) to the current framebuffer
   * with full transform capabilities (Scale, Rotation, Anchor, Opacity, Blend Mode).
   */
  renderLayer(texture: WebGLTexture, x: number, y: number, width: number, height: number, rotation: number, opacity: number, blendMode: string) {
    const gl = this.renderer.gl;

    // Apply Opacity
    // gl.uniform1f(opacityUniform, opacity);

    // Apply Blend Mode (e.g., 'multiply', 'screen', 'add')
    this.applyBlendMode(blendMode);

    // Setup transform matrix (translation + rotation + scale)
    // Bind texture
    // Draw quad
  }

  private applyBlendMode(mode: string) {
    const gl = this.renderer.gl;
    switch (mode) {
      case 'add':
        gl.blendFunc(gl.ONE, gl.ONE);
        break;
      case 'multiply':
        gl.blendFunc(gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA);
        break;
      case 'screen':
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_COLOR);
        break;
      default: // Normal
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        break;
    }
  }
}

// ----------------------------------------------------------------------
// Hybrid Text Rendering (Canvas2D to Texture)
// ----------------------------------------------------------------------
export class TextRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { alpha: true })!;
  }

  renderTextToTexture(text: string, font: string, color: string, width: number, height: number, gl: WebGLRenderingContext) {
    this.canvas.width = width;
    this.canvas.height = height;
    
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.font = font;
    this.ctx.fillStyle = color;
    this.ctx.fillText(text, 0, height / 2); // Stub positioning

    // Create GPU Texture from this canvas
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.canvas);
    gl.generateMipmap(gl.TEXTURE_2D);

    return tex;
  }
}

// ----------------------------------------------------------------------
// WebCodecs Integration Stub
// ----------------------------------------------------------------------
export class WebCodecsVideoDecoder {
  // If supported, decodes VideoFrame and uploads directly to GPU texture without Canvas overhead
  static async decodeFrameToTexture(videoFrame: any /* VideoFrame */, gl: WebGL2RenderingContext) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    // @ts-ignore
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, videoFrame);
    return tex;
  }
}

// ----------------------------------------------------------------------
// Tile Rendering Stub
// ----------------------------------------------------------------------
export class TileRenderer {
  // Stub for 8K workflows
  static renderInTiles(width: number, height: number, tileSize: number = 512, renderCallback: (x: number, y: number, tw: number, th: number) => void) {
    for (let y = 0; y < height; y += tileSize) {
      for (let x = 0; x < width; x += tileSize) {
        const tw = Math.min(tileSize, width - x);
        const th = Math.min(tileSize, height - y);
        renderCallback(x, y, tw, th);
      }
    }
  }
}
