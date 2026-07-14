import { BlendEngine, BlendMode } from './BlendEngine';
import { EffectEngine } from './EffectEngine';

export class Compositor {
  private gl: WebGL2RenderingContext;
  private effectEngine: EffectEngine;
  
  // Backbuffers for ping-pong rendering
  private bufferA: { tex: WebGLTexture, fbo: WebGLFramebuffer };
  private bufferB: { tex: WebGLTexture, fbo: WebGLFramebuffer };

  constructor(gl: WebGL2RenderingContext, effectEngine: EffectEngine, width: number, height: number) {
    this.gl = gl;
    this.effectEngine = effectEngine;
    
    this.bufferA = this.createBuffer(width, height);
    this.bufferB = this.createBuffer(width, height);
  }

  private createBuffer(width: number, height: number) {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    
    return { tex, fbo };
  }

  /**
   * Renders a full frame by compositing layers bottom-to-top.
   */
  public compositeFrame(
    layers: any[], 
    width: number, 
    height: number, 
    localFrame: number,
    finalTargetFbo: WebGLFramebuffer | null = null
  ) {
    const gl = this.gl;
    
    // Clear initial buffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.bufferA.fbo);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    let currentBuffer = this.bufferA;
    let nextBuffer = this.bufferB;

    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      
      // 1. Render layer source (video, image, shape, or Adjustment Layer snapshot)
      // let sourceTex = renderLayerSource(layer)

      // 2. Process Layer Effects
      // this.effectEngine.processLayer(layer.id, sourceTex, width, height, localFrame, tempFbo);

      // 3. Blend onto current composite
      // const blendPass = BlendEngine.getBlendPass(layer.blendMode);
      
      // Ping-pong buffers
      // const temp = currentBuffer;
      // currentBuffer = nextBuffer;
      // nextBuffer = temp;
    }
    
    // Finally blit currentBuffer to finalTargetFbo
  }
}
