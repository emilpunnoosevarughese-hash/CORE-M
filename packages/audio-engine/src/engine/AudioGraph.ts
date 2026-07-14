import { AudioEngine } from './AudioEngine';

export class AudioGraph {
  private context: BaseAudioContext;
  private nodes: Map<string, AudioNode> = new Map();
  private connections: Map<string, Set<string>> = new Map(); // Source -> Destinations

  constructor(offlineContext?: OfflineAudioContext) {
    this.context = offlineContext || AudioEngine.getInstance().getContext();
  }

  public getContext(): BaseAudioContext {
    return this.context;
  }

  public registerNode(id: string, node: AudioNode) {
    this.nodes.set(id, node);
    this.connections.set(id, new Set());
  }

  public removeNode(id: string) {
    const node = this.nodes.get(id);
    if (node) {
      node.disconnect();
      this.nodes.delete(id);
      this.connections.delete(id);
      
      // Remove this node from any other node's connection list
      for (const dests of this.connections.values()) {
        dests.delete(id);
      }
    }
  }

  public connect(sourceId: string, destId: string) {
    const source = this.nodes.get(sourceId);
    let dest: AudioNode | undefined;

    // Special case for Master Output
    if (destId === 'master_out') {
      dest = this.context.destination;
    } else {
      dest = this.nodes.get(destId);
    }

    if (source && dest) {
      source.connect(dest);
      if (destId !== 'master_out') {
        this.connections.get(sourceId)!.add(destId);
      }
    }
  }

  public disconnect(sourceId: string, destId: string) {
    const source = this.nodes.get(sourceId);
    const dest = destId === 'master_out' ? this.context.destination : this.nodes.get(destId);

    if (source && dest) {
      source.disconnect(dest);
      if (destId !== 'master_out') {
        this.connections.get(sourceId)!.delete(destId);
      }
    }
  }

  public getNode(id: string): AudioNode | undefined {
    return this.nodes.get(id);
  }
}
