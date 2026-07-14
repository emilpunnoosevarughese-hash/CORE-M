import { RenderPass } from './RenderPass';
import { ShaderCompiler } from './ShaderCompiler';

export interface RenderNode {
  id: string;
  pass: RenderPass;
  inputs: Record<string, string>; // Maps input uniform name to output of another Node ID (or 'source')
  bypass: boolean;
}

export class RenderGraph {
  private gl: WebGL2RenderingContext;
  private nodes: Map<string, RenderNode> = new Map();
  private outputNodeId: string | null = null;
  private isHDR: boolean = false;
  
  // Framebuffer cache for reuse (LRU could be implemented here)
  private fbos: WebGLFramebuffer[] = [];
  private textures: WebGLTexture[] = [];

  constructor(gl: WebGL2RenderingContext, enableHDR: boolean = false) {
    this.gl = gl;
    this.isHDR = enableHDR;
    
    // Check HDR support
    if (this.isHDR) {
      const ext = gl.getExtension('EXT_color_buffer_float');
      if (!ext) {
        console.warn('HDR requested but EXT_color_buffer_float not supported. Falling back to 8-bit.');
        this.isHDR = false;
      }
    }
  }

  public addNode(node: RenderNode) {
    this.nodes.set(node.id, node);
    // Compile shader immediately to catch errors early
    if (!node.pass.program) {
      node.pass.program = ShaderCompiler.compileProgram(this.gl, node.pass.vertexShader, node.pass.fragmentShader);
    }
  }

  public removeNode(id: string) {
    this.nodes.delete(id);
  }

  public setOutputNode(id: string) {
    this.outputNodeId = id;
  }

  /**
   * Sorts nodes topologically to resolve dependencies.
   */
  private resolveDependencies(): string[] {
    const sorted: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (id: string) => {
      if (visiting.has(id)) throw new Error(`Circular dependency detected at node: ${id}`);
      if (visited.has(id)) return;

      visiting.add(id);
      const node = this.nodes.get(id);
      if (node) {
        for (const sourceId of Object.values(node.inputs)) {
          if (sourceId !== 'source' && this.nodes.has(sourceId)) {
            visit(sourceId);
          }
        }
      }
      visiting.delete(id);
      visited.add(id);
      sorted.push(id);
    };

    if (this.outputNodeId) {
      visit(this.outputNodeId);
    } else {
      for (const id of this.nodes.keys()) visit(id);
    }

    return sorted;
  }

  /**
   * Executes the render graph.
   * @param sourceTexture The base texture (from video decoder or previous track).
   * @param width Render width.
   * @param height Render height.
   * @param finalFbo Null means render to canvas, otherwise render to specific FBO.
   */
  public execute(sourceTexture: WebGLTexture, width: number, height: number, finalFbo: WebGLFramebuffer | null = null) {
    const executionOrder = this.resolveDependencies();
    const gl = this.gl;

    gl.viewport(0, 0, width, height);

    // Map to hold the output texture of each executed node
    const nodeOutputs = new Map<string, WebGLTexture>();
    nodeOutputs.set('source', sourceTexture);

    for (let i = 0; i < executionOrder.length; i++) {
      const nodeId = executionOrder[i];
      const node = this.nodes.get(nodeId)!;

      if (node.bypass) {
        // Find the primary input and pass it through
        const primaryInput = Object.values(node.inputs)[0] || 'source';
        nodeOutputs.set(nodeId, nodeOutputs.get(primaryInput)!);
        continue;
      }

      const isLastNode = (i === executionOrder.length - 1);
      
      // Determine output target
      let targetFbo = finalFbo;
      let targetTex: WebGLTexture | null = null;
      
      if (!isLastNode) {
        // We need an intermediate framebuffer
        // In a full implementation, we'd pull from `this.fbos` pool based on size/format
        const { fbo, tex } = this.createIntermediateFBO(width, height, node.pass.outputFormat);
        targetFbo = fbo;
        targetTex = tex;
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, targetFbo);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(node.pass.program!);

      // Bind inputs
      let textureUnit = 0;
      for (const [uniformName, sourceId] of Object.entries(node.inputs)) {
        const inputTex = nodeOutputs.get(sourceId);
        if (inputTex) {
          gl.activeTexture(gl.TEXTURE0 + textureUnit);
          gl.bindTexture(gl.TEXTURE_2D, inputTex);
          const loc = gl.getUniformLocation(node.pass.program!, uniformName);
          gl.uniform1i(loc, textureUnit);
          textureUnit++;
        }
      }

      // Bind uniforms
      for (const [name, uniform] of node.pass.uniforms.entries()) {
        const loc = gl.getUniformLocation(node.pass.program!, name);
        if (!loc) continue;
        
        switch (uniform.type) {
          case 'float': gl.uniform1f(loc, uniform.value); break;
          case 'vec2': gl.uniform2f(loc, uniform.value[0], uniform.value[1]); break;
          case 'vec3': gl.uniform3f(loc, uniform.value[0], uniform.value[1], uniform.value[2]); break;
          case 'vec4': gl.uniform4f(loc, uniform.value[0], uniform.value[1], uniform.value[2], uniform.value[3]); break;
          case 'int': gl.uniform1i(loc, uniform.value); break;
          // ... handle others
        }
      }

      // Draw Fullscreen Quad (Geometry assumed bound elsewhere or driven by a global VAO)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      if (!isLastNode && targetTex) {
        nodeOutputs.set(nodeId, targetTex);
      }
    }
  }

  private createIntermediateFBO(width: number, height: number, formatOverride: '8bit' | 'float16') {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);

    let internalFormat = gl.RGBA8;
    let type = gl.UNSIGNED_BYTE;

    if (this.isHDR || formatOverride === 'float16') {
      internalFormat = gl.RGBA16F;
      type = gl.HALF_FLOAT;
    }

    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, gl.RGBA, type, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

    return { fbo, tex };
  }
}
