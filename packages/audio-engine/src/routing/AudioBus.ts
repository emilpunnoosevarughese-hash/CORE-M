import { AudioGraph } from '../engine/AudioGraph';

export class AudioBus {
  public id: string;
  private graph: AudioGraph;
  
  public inputNode: GainNode;
  public volumeNode: GainNode;
  public pannerNode: StereoPannerNode;
  public outputNode: GainNode;

  constructor(id: string, graph: AudioGraph) {
    this.id = id;
    this.graph = graph;
    const context = graph.getContext();

    this.inputNode = context.createGain();
    this.volumeNode = context.createGain();
    this.pannerNode = context.createStereoPanner();
    this.outputNode = context.createGain();

    graph.registerNode(`bus_${id}_input`, this.inputNode);
    graph.registerNode(`bus_${id}_vol`, this.volumeNode);
    graph.registerNode(`bus_${id}_pan`, this.pannerNode);
    graph.registerNode(`bus_${id}_out`, this.outputNode);

    graph.connect(`bus_${id}_input`, `bus_${id}_vol`);
    graph.connect(`bus_${id}_vol`, `bus_${id}_pan`);
    graph.connect(`bus_${id}_pan`, `bus_${id}_out`);
    
    // Buses usually route to master
    graph.connect(`bus_${id}_out`, 'master_vol'); // We connect before the master limiter!
  }

  public setVolume(val: number) {
    this.volumeNode.gain.setTargetAtTime(val, this.graph.getContext().currentTime, 0.01);
  }
}
