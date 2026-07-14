import { EffectStack } from './EffectStack';
import { RenderGraph, RenderNode } from './GPU/RenderGraph';
import { EffectRegistry } from './EffectRegistry';
// Note: In real app, we use `@corem/animation`, but we can mock the import for architecture typing.
import { AnimationEngine } from '@corem/animation';

export class EffectEngine {
  private static instance: EffectEngine;
  private gl: WebGL2RenderingContext | null = null;
  private renderGraph: RenderGraph | null = null;
  
  // Maps a Layer ID to its specific Effect Stack
  private stacks: Map<string, EffectStack> = new Map();

  private constructor() {}

  public static getInstance(): EffectEngine {
    if (!EffectEngine.instance) {
      EffectEngine.instance = new EffectEngine();
    }
    return EffectEngine.instance;
  }

  public initialize(gl: WebGL2RenderingContext, enableHDR: boolean = false) {
    this.gl = gl;
    this.renderGraph = new RenderGraph(gl, enableHDR);
  }

  public getStack(layerId: string): EffectStack {
    let stack = this.stacks.get(layerId);
    if (!stack) {
      stack = new EffectStack();
      this.stacks.set(layerId, stack);
    }
    return stack;
  }

  /**
   * Applies the effect stack for a given layer at a specific frame.
   * This bridges Animation Engine (for keyframed parameters) with the RenderGraph.
   */
  public processLayer(
    layerId: string, 
    sourceTexture: WebGLTexture, 
    width: number, 
    height: number, 
    localFrame: number, 
    targetFbo: WebGLFramebuffer | null = null
  ) {
    if (!this.gl || !this.renderGraph) throw new Error('EffectEngine not initialized');

    const stack = this.stacks.get(layerId);
    if (!stack || stack.getActiveEffects().length === 0) {
      // If no effects, we would normally just blit the texture.
      // For this architecture demo, we assume the compositor handles passthrough if this returns null.
      return false; 
    }

    const activeEffects = stack.getActiveEffects();
    let previousNodeId = 'source';

    // Build the dynamic render graph for this frame
    // In a highly optimized engine, we only rebuild the graph if the stack topology changes.
    // For this implementation, we map it out for clarity.
    
    // Clear old transient nodes (in reality, we'd cache the graph structure per layer)
    const currentNodes: string[] = [];

    for (let i = 0; i < activeEffects.length; i++) {
      const effect = activeEffects[i];
      const def = EffectRegistry.getInstance().get(effect.effectId)!;
      const nodeId = `${layerId}_${effect.id}`;
      currentNodes.push(nodeId);

      // 1. Sync parameters with AnimationEngine
      // E.g., blur.radius might be animated
      for (const param of def.parameters) {
        // Construct the track ID that AnimationEngine uses
        const trackId = `layer_${layerId}.effect_${effect.id}.${param.id}`;
        
        // This is a simplified fetch. In full app, we pass the actual track object.
        // We assume AnimationCache handles the heavy lifting.
        const animatedValue = AnimationEngine.getInstance().evaluateTrack(
          { propertyId: trackId, keyframes: [], enabled: true }, // mock track fetch
          localFrame, 
          effect.parameters[param.id]
        );
        
        // Update the RenderPass uniform
        effect.pass.setUniform(param.uniformName, animatedValue);
      }

      // 2. Add node to graph
      this.renderGraph.addNode({
        id: nodeId,
        pass: effect.pass,
        inputs: {
          'u_source': previousNodeId // link to previous effect's output
        },
        bypass: effect.bypassed
      });

      previousNodeId = nodeId;
    }

    // Set the final node as the output
    this.renderGraph.setOutputNode(previousNodeId);

    // Execute the graph
    this.renderGraph.execute(sourceTexture, width, height, targetFbo);

    // Cleanup transient nodes
    for (const nodeId of currentNodes) {
      this.renderGraph.removeNode(nodeId);
    }

    return true;
  }
}
