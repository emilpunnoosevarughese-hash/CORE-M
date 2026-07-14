import { EffectRegistry } from '../registry/EffectRegistry';
import type { EffectDefinition } from '../registry/EffectRegistry';
import { ShaderCompiler } from './ShaderCompiler';

export interface EffectInstance {
  id: string;
  effectId: string;
  enabled: boolean;
  parameters: Record<string, any>;
}

export interface RenderLayer {
  id: string;
  source: TexImageSource | null; // Null if it's a nested comp or adjustment layer without explicit source
  transform: { x: number, y: number, scaleX: number, scaleY: number, rotation: number, anchorX: number, anchorY: number };
  opacity: number;
  blendMode: string;
  isAdjustmentLayer: boolean;
  effects: EffectInstance[];
  // For Nested Compositions
  layers?: RenderLayer[]; 
  compositionId?: string;
  time?: number; // frame time for caching keys
}

export function createTransformMatrix(projectWidth: number, projectHeight: number, t: RenderLayer['transform']): Float32Array {
  const mat = new Float32Array(16);
  mat[0] = 1; mat[5] = 1; mat[10] = 1; mat[15] = 1;
  
  // Convert pixel coordinates (0 to width/height) to NDC space (-1 to 1)
  const tx = (t.x / projectWidth) * 2.0 - 1.0;
  const ty = 1.0 - (t.y / projectHeight) * 2.0;
  const rad = -t.rotation * (Math.PI / 180);
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  
  const sx = t.scaleX;
  const sy = t.scaleY;

  mat[12] = tx;
  mat[13] = ty;
  
  mat[0] = c * sx;
  mat[1] = s * sx;
  mat[4] = -s * sy;
  mat[5] = c * sy;
  
  return mat;
}

export class FrameCache {
  private gl: WebGL2RenderingContext;
  private cache = new Map<string, { tex: WebGLTexture, lastUsed: number }>();
  private maxItems = 60; // Max cached textures (e.g., 60 frames of a nested comp)

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    // On low memory devices we could scale maxItems down based on navigator.deviceMemory
  }

  get(key: string): WebGLTexture | null {
    const item = this.cache.get(key);
    if (item) {
      item.lastUsed = Date.now();
      return item.tex;
    }
    return null;
  }

  put(key: string, sourceFbo: WebGLFramebuffer, width: number, height: number) {
    if (this.cache.size >= this.maxItems) {
      this.evict();
    }
    const tex = this.gl.createTexture()!;
    this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    
    // Copy from currently bound FBO to new texture
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, sourceFbo);
    this.gl.copyTexSubImage2D(this.gl.TEXTURE_2D, 0, 0, 0, 0, 0, width, height);
    
    this.cache.set(key, { tex, lastUsed: Date.now() });
  }

  private evict() {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    for (const [key, item] of this.cache.entries()) {
      if (item.lastUsed < oldestTime) {
        oldestTime = item.lastUsed;
        oldestKey = key;
      }
    }
    if (oldestKey) {
      const item = this.cache.get(oldestKey);
      if (item) this.gl.deleteTexture(item.tex);
      this.cache.delete(oldestKey);
    }
  }

  clear() {
    for (const item of this.cache.values()) {
      this.gl.deleteTexture(item.tex);
    }
    this.cache.clear();
  }
}

export class RenderGraph {
  private gl: WebGL2RenderingContext;
  private compiler: ShaderCompiler;
  
  public frameCache: FrameCache;

  private compProgram: WebGLProgram | null = null;
  private blitProgram: WebGLProgram | null = null;
  private copyProgram: WebGLProgram | null = null;

  private positionBuffer: WebGLBuffer;
  private texCoordBuffer: WebGLBuffer;

  private fboA: WebGLFramebuffer;
  private fboB: WebGLFramebuffer;
  private texA: WebGLTexture;
  private texB: WebGLTexture;

  private width: number = 1920;
  private height: number = 1080;

  constructor(canvas: HTMLCanvasElement | OffscreenCanvas) {
    const gl = canvas.getContext('webgl2', { premultipliedAlpha: false, alpha: true });
    if (!gl) throw new Error('WebGL2 not supported');
    this.gl = gl as WebGL2RenderingContext;
    this.compiler = new ShaderCompiler(this.gl);
    this.frameCache = new FrameCache(this.gl);
    
    this.width = canvas.width;
    this.height = canvas.height;

    const positions = new Float32Array([
      -1.0, -1.0,  1.0, -1.0, -1.0,  1.0,
      -1.0,  1.0,  1.0, -1.0,  1.0,  1.0,
    ]);
    this.positionBuffer = this.gl.createBuffer()!;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

    const texCoords = new Float32Array([
      0.0, 0.0,  1.0, 0.0,  0.0, 1.0,
      0.0, 1.0,  1.0, 0.0,  1.0, 1.0,
    ]);
    this.texCoordBuffer = this.gl.createBuffer()!;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, texCoords, this.gl.STATIC_DRAW);

    const createFBO = () => {
      const tex = this.gl.createTexture()!;
      this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.width, this.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

      const fbo = this.gl.createFramebuffer()!;
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);
      this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, tex, 0);
      return { fbo, tex };
    };

    const fbA = createFBO(); this.fboA = fbA.fbo; this.texA = fbA.tex;
    const fbB = createFBO(); this.fboB = fbB.fbo; this.texB = fbB.tex;

    // Advanced Blend Modes Shader
    const compFrag = `#version 300 es
      precision highp float;
      in vec2 v_texCoord;
      uniform sampler2D u_base;
      uniform sampler2D u_blend;
      uniform float u_opacity;
      uniform int u_blendMode;
      uniform vec2 u_resolution;
      out vec4 outColor;
      
      vec3 rgb2hsl(vec3 c) {
          float cMin = min(min(c.r, c.g), c.b);
          float cMax = max(max(c.r, c.g), c.b);
          float delta = cMax - cMin;
          vec3 hsl = vec3(0.0, 0.0, (cMax + cMin) / 2.0);
          if (delta > 0.0) {
              hsl.y = delta / (1.0 - abs(2.0 * hsl.z - 1.0));
              if (cMax == c.r) hsl.x = mod((c.g - c.b) / delta, 6.0);
              else if (cMax == c.g) hsl.x = (c.b - c.r) / delta + 2.0;
              else hsl.x = (c.r - c.g) / delta + 4.0;
              hsl.x /= 6.0;
          }
          return hsl;
      }
      
      vec3 hsl2rgb(vec3 hsl) {
          float c = (1.0 - abs(2.0 * hsl.z - 1.0)) * hsl.y;
          float x = c * (1.0 - abs(mod(hsl.x * 6.0, 2.0) - 1.0));
          float m = hsl.z - c / 2.0;
          vec3 rgb = vec3(0.0);
          if (hsl.x < 1.0/6.0) rgb = vec3(c, x, 0.0);
          else if (hsl.x < 2.0/6.0) rgb = vec3(x, c, 0.0);
          else if (hsl.x < 3.0/6.0) rgb = vec3(0.0, c, x);
          else if (hsl.x < 4.0/6.0) rgb = vec3(0.0, x, c);
          else if (hsl.x < 5.0/6.0) rgb = vec3(x, 0.0, c);
          else rgb = vec3(c, 0.0, x);
          return rgb + m;
      }

      void main() {
          vec2 screenUV = gl_FragCoord.xy / u_resolution;
          vec4 base = texture(u_base, screenUV);
          vec4 blend = texture(u_blend, v_texCoord);
          blend.a *= u_opacity;
          
          vec3 cBase = base.a > 0.0 ? base.rgb / base.a : vec3(0.0);
          vec3 cBlend = blend.a > 0.0 ? blend.rgb / blend.a : vec3(0.0);
          
          vec3 result = cBlend;
          
          if (u_blendMode == 1) { result = cBase * cBlend; } // Multiply
          else if (u_blendMode == 2) { result = 1.0 - (1.0 - cBase) * (1.0 - cBlend); } // Screen
          else if (u_blendMode == 3) { result = mix(2.0 * cBase * cBlend, 1.0 - 2.0 * (1.0 - cBase) * (1.0 - cBlend), step(0.5, cBase)); } // Overlay
          else if (u_blendMode == 4) { // Soft Light
              vec3 D = mix(vec3(sqrt(cBase)), cBase * ((16.0 * cBase - 12.0) * cBase + 4.0), step(0.25, cBase));
              result = mix(cBase - (1.0 - 2.0 * cBlend) * cBase * (1.0 - cBase), cBase + (2.0 * cBlend - 1.0) * (D - cBase), step(0.5, cBlend));
          }
          else if (u_blendMode == 5) { // Hard Light
              result = mix(2.0 * cBase * cBlend, 1.0 - 2.0 * (1.0 - cBase) * (1.0 - cBlend), step(0.5, cBlend));
          }
          else if (u_blendMode == 6) { result = min(cBase, cBlend); } // Darken
          else if (u_blendMode == 7) { result = max(cBase, cBlend); } // Lighten
          else if (u_blendMode == 8) { result = abs(cBase - cBlend); } // Difference
          else if (u_blendMode == 9) { result = cBase + cBlend - 2.0 * cBase * cBlend; } // Exclusion
          else if (u_blendMode == 10) { result = mix(min(cBase / max(1.0 - cBlend, 0.001), 1.0), vec3(1.0), step(1.0, cBlend)); } // Color Dodge
          else if (u_blendMode == 11) { result = mix(max(1.0 - (1.0 - cBase) / max(cBlend, 0.001), 0.0), vec3(0.0), step(cBlend, 0.0)); } // Color Burn
          else if (u_blendMode == 12) { result = min(cBase + cBlend, 1.0); } // Linear Dodge
          else if (u_blendMode == 13) { result = max(cBase + cBlend - 1.0, 0.0); } // Linear Burn
          else if (u_blendMode >= 14) { // Hue, Saturation, Color, Luminosity
              vec3 hslBase = rgb2hsl(cBase);
              vec3 hslBlend = rgb2hsl(cBlend);
              if (u_blendMode == 14) { result = hsl2rgb(vec3(hslBlend.x, hslBase.y, hslBase.z)); } // Hue
              else if (u_blendMode == 15) { result = hsl2rgb(vec3(hslBase.x, hslBlend.y, hslBase.z)); } // Saturation
              else if (u_blendMode == 16) { result = hsl2rgb(vec3(hslBlend.x, hslBlend.y, hslBase.z)); } // Color
              else if (u_blendMode == 17) { result = hsl2rgb(vec3(hslBase.x, hslBase.y, hslBlend.z)); } // Luminosity
          }
          
          vec3 finalRGB = result * blend.a + cBase * base.a * (1.0 - blend.a);
          float finalA = blend.a + base.a * (1.0 - blend.a);
          outColor = vec4(finalRGB, finalA);
      }`;

    this.compProgram = this.compiler.createProgram(compFrag, `#version 300 es
      in vec2 a_position;
      in vec2 a_texCoord;
      uniform mat4 u_transform;
      out vec2 v_texCoord;
      void main() {
          v_texCoord = a_texCoord;
          gl_Position = u_transform * vec4(a_position, 0.0, 1.0);
      }
    `);

    this.blitProgram = this.compiler.createProgram(`#version 300 es
      precision highp float;
      in vec2 v_texCoord;
      uniform sampler2D u_image;
      out vec4 outColor;
      void main() { outColor = texture(u_image, vec2(v_texCoord.x, 1.0 - v_texCoord.y)); }
    `, `#version 300 es
      in vec2 a_position;
      in vec2 a_texCoord;
      out vec2 v_texCoord;
      void main() {
          v_texCoord = a_texCoord;
          gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `);

    this.copyProgram = this.compiler.createProgram(`#version 300 es
      precision highp float;
      in vec2 v_texCoord;
      uniform sampler2D u_image;
      out vec4 outColor;
      void main() { outColor = texture(u_image, v_texCoord); }
    `, `#version 300 es
      in vec2 a_position;
      in vec2 a_texCoord;
      out vec2 v_texCoord;
      void main() {
          v_texCoord = a_texCoord;
          gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `);

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  resize(width: number, height: number) {
    if (this.width === width && this.height === height) return;
    this.width = width;
    this.height = height;
    
    // We recreate FBO textures dynamically to avoid memory issues and logic complexity.
    // However, if we're aggressively caching, we should just delete them and recreate.
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texA);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
    
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texB);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
  }

  private drawFullscreenQuad(program: WebGLProgram) {
    const posLoc = this.gl.getAttribLocation(program, 'a_position');
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.enableVertexAttribArray(posLoc);
    this.gl.vertexAttribPointer(posLoc, 2, this.gl.FLOAT, false, 0, 0);

    const tcLoc = this.gl.getAttribLocation(program, 'a_texCoord');
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
    this.gl.enableVertexAttribArray(tcLoc);
    this.gl.vertexAttribPointer(tcLoc, 2, this.gl.FLOAT, false, 0, 0);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }

  private getBlendModeInt(mode: string): number {
    const modes = [
      'normal', 'multiply', 'screen', 'overlay', 'soft_light', 'hard_light', 
      'darken', 'lighten', 'difference', 'exclusion', 'color_dodge', 'color_burn',
      'linear_dodge', 'linear_burn', 'hue', 'saturation', 'color', 'luminosity'
    ];
    return Math.max(0, modes.indexOf(mode));
  }

  private executeRecursiveComposition(layers: RenderLayer[], targetFbo: WebGLFramebuffer, targetTex: WebGLTexture) {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, targetFbo);
    this.gl.clearColor(0,0,0,0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    
    for (const layer of layers) {
      let layerOutputTex: WebGLTexture | null = null;
      
      if (layer.compositionId && layer.layers) {
        // Recursive rendering for Nested Compositions
        const cacheKey = `comp_${layer.compositionId}_t${layer.time}`;
        const cached = this.frameCache.get(cacheKey);
        if (cached) {
          layerOutputTex = cached;
        } else {
          // We need a temporary FBO/Tex for the sub-comp
          const tempTex = this.gl.createTexture()!;
          this.gl.bindTexture(this.gl.TEXTURE_2D, tempTex);
          this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.width, this.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
          this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
          this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
          this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
          
          const tempFbo = this.gl.createFramebuffer()!;
          this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, tempFbo);
          this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, tempTex, 0);
          
          this.executeRecursiveComposition(layer.layers, tempFbo, tempTex);
          
          this.frameCache.put(cacheKey, tempFbo, this.width, this.height);
          layerOutputTex = this.frameCache.get(cacheKey)!;
          
          this.gl.deleteFramebuffer(tempFbo);
          this.gl.deleteTexture(tempTex);
        }
      } else if (layer.isAdjustmentLayer) {
        // Copy accumulated background to texA
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fboA);
        this.gl.useProgram(this.copyProgram!);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, targetTex);
        this.drawFullscreenQuad(this.copyProgram!);
        
        layerOutputTex = this.processEffects(this.texA, layer.effects);
      } else if (layer.source) {
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texA);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, layer.source);
        layerOutputTex = this.processEffects(this.texA, layer.effects);
      }
      
      if (!layerOutputTex) continue;
      
      // We must render this layer on top of the accumulated target.
      // We copy the current target to a secondary FBO, then composite both into targetFbo.
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fboB);
      this.gl.useProgram(this.copyProgram!);
      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, targetTex);
      this.drawFullscreenQuad(this.copyProgram!);
      
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, targetFbo);
      this.gl.useProgram(this.compProgram!);
      
      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.texB); // Background
      this.gl.uniform1i(this.gl.getUniformLocation(this.compProgram!, 'u_base'), 0);
      
      this.gl.activeTexture(this.gl.TEXTURE1);
      this.gl.bindTexture(this.gl.TEXTURE_2D, layerOutputTex); // Blend Layer
      this.gl.uniform1i(this.gl.getUniformLocation(this.compProgram!, 'u_blend'), 1);
      
      this.gl.uniform1f(this.gl.getUniformLocation(this.compProgram!, 'u_opacity'), layer.opacity);
      this.gl.uniform1i(this.gl.getUniformLocation(this.compProgram!, 'u_blendMode'), this.getBlendModeInt(layer.blendMode));
      this.gl.uniform2f(this.gl.getUniformLocation(this.compProgram!, 'u_resolution'), this.width, this.height);
      
      // The transform properties are based on the project resolution (1920x1080), 
      // NOT the current preview canvas size (this.width x this.height)
      const mat = createTransformMatrix(1920, 1080, layer.transform);
      this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.compProgram!, 'u_transform'), false, mat);
      
      this.drawFullscreenQuad(this.compProgram!);
    }
  }

  private processEffects(sourceTex: WebGLTexture, effects: EffectInstance[]): WebGLTexture {
    const activeEffects = effects.filter(e => e.enabled);
    if (activeEffects.length === 0) return sourceTex;

    // Use texA and texB to ping pong for effects
    // We assume sourceTex is currently texA
    let readTex = sourceTex;
    let writeFbo = this.fboB;
    let writeTex = this.texB;

    for (let i = 0; i < activeEffects.length; i++) {
      const effectInst = activeEffects[i];
      const def = EffectRegistry.getEffect(effectInst.effectId);
      if (!def) continue;

      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, writeFbo);
      this.gl.clearColor(0,0,0,0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);

      const program = this.compiler.createProgram(def.fragmentShader);
      this.gl.useProgram(program);

      const posLoc = this.gl.getAttribLocation(program, 'a_position');
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
      this.gl.enableVertexAttribArray(posLoc);
      this.gl.vertexAttribPointer(posLoc, 2, this.gl.FLOAT, false, 0, 0);

      const tcLoc = this.gl.getAttribLocation(program, 'a_texCoord');
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
      this.gl.enableVertexAttribArray(tcLoc);
      this.gl.vertexAttribPointer(tcLoc, 2, this.gl.FLOAT, false, 0, 0);

      const uRes = this.gl.getUniformLocation(program, 'u_resolution');
      if (uRes) this.gl.uniform2f(uRes, this.width, this.height);

      for (const param of def.parameters) {
        const val = effectInst.parameters[param.id] ?? param.defaultValue;
        const loc = this.gl.getUniformLocation(program, `u_${param.id}`);
        if (!loc) continue;

        switch (param.type) {
          case 'float': this.gl.uniform1f(loc, val); break;
          case 'vec2': this.gl.uniform2f(loc, val[0], val[1]); break;
          case 'vec3': this.gl.uniform3f(loc, val[0], val[1], val[2]); break;
        }
      }

      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, readTex);
      const uImg = this.gl.getUniformLocation(program, 'u_image');
      if (uImg) this.gl.uniform1i(uImg, 0);

      this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

      readTex = writeTex;
      writeFbo = (writeFbo === this.fboA) ? this.fboB : this.fboA;
      writeTex = (writeTex === this.texA) ? this.texB : this.texA;
    }

    return readTex;
  }

  public renderStack(source: TexImageSource, effects: EffectInstance[]) {
    this.gl.viewport(0, 0, this.width, this.height);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texA);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, source);
    
    const resultTex = this.processEffects(this.texA, effects);

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.clearColor(0,0,0,0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.useProgram(this.blitProgram!);
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, resultTex);
    this.drawFullscreenQuad(this.blitProgram!);
  }

  public renderTransition(sourceA: TexImageSource, sourceB: TexImageSource, transitionId: string, progress: number, params: any) {
    this.gl.viewport(0, 0, this.width, this.height);
    this.renderStack(sourceA, []); 
  }

  public renderComposition(layers: RenderLayer[]) {
    this.gl.viewport(0, 0, this.width, this.height);
    
    // We use a final output FBO to build up the entire composition
    const finalTex = this.gl.createTexture()!;
    this.gl.bindTexture(this.gl.TEXTURE_2D, finalTex);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.width, this.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    
    const finalFbo = this.gl.createFramebuffer()!;
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, finalFbo);
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, finalTex, 0);
    
    this.executeRecursiveComposition(layers, finalFbo, finalTex);
    
    // Blit to canvas
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.clearColor(0,0,0,0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    
    this.gl.useProgram(this.blitProgram!);
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, finalTex);
    this.drawFullscreenQuad(this.blitProgram!);
    
    this.gl.deleteFramebuffer(finalFbo);
    this.gl.deleteTexture(finalTex);
  }

  public getPixelData(width: number, height: number): Uint8Array {
    const data = new Uint8Array(width * height * 4);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.readPixels(0, 0, width, height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, data);
    return data;
  }
}
