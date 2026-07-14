export type RenderNodeType = 'Clip' | 'Effect' | 'Mask' | 'ColorGrade' | 'AdjustmentLayer' | 'Blend' | 'Transition' | 'Composite' | 'Output';

export interface RenderNode {
  id: string;
  type: RenderNodeType;
  inputs: RenderNode[];
  execute: (context: RenderContext) => void;
}

export interface RenderContext {
  gl: WebGL2RenderingContext | WebGLRenderingContext;
  time: number;
  // FramePool, TexturePool, etc would be passed here
}

export class RenderGraph {
  private nodes: Map<string, RenderNode> = new Map();
  private outputNode: RenderNode | null = null;

  addNode(node: RenderNode) {
    this.nodes.set(node.id, node);
  }

  removeNode(id: string) {
    this.nodes.delete(id);
  }

  setOutputNode(id: string) {
    const node = this.nodes.get(id);
    if (node) this.outputNode = node;
  }

  /**
   * Topologically sort and execute the render graph
   */
  execute(context: RenderContext) {
    if (!this.outputNode) return;

    const visited = new Set<string>();
    
    // Depth-first execution
    const traverse = (node: RenderNode) => {
      if (visited.has(node.id)) return;
      
      for (const input of node.inputs) {
        traverse(input);
      }
      
      node.execute(context);
      visited.add(node.id);
    };

    traverse(this.outputNode);
  }
}
