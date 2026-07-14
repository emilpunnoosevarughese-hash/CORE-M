import { AudioGraph } from '../engine/AudioGraph';

export class TrackMixer {
  public id: string;
  private graph: AudioGraph;
  
  // Web Audio Nodes for this track strip
  public inputNode: GainNode;
  public volumeNode: GainNode;
  public pannerNode: StereoPannerNode;
  public outputNode: GainNode;
  
  private isMuted: boolean = false;
  private volume: number = 1.0; // 0.0 to 1.0 (linear scale, mapped from dB)
  private pan: number = 0.0; // -1.0 to +1.0

  constructor(id: string, graph: AudioGraph) {
    this.id = id;
    this.graph = graph;
    const context = graph.getContext();

    // 1. Input Gain (Used for clipping prevention before FX)
    this.inputNode = context.createGain();
    
    // 2. Volume Fader
    this.volumeNode = context.createGain();
    this.volumeNode.gain.value = this.volume;

    // 3. Stereo Panner
    this.pannerNode = context.createStereoPanner();
    this.pannerNode.pan.value = this.pan;

    // 4. Output Routing Node
    this.outputNode = context.createGain();

    // Register nodes in graph
    graph.registerNode(`track_${id}_input`, this.inputNode);
    graph.registerNode(`track_${id}_vol`, this.volumeNode);
    graph.registerNode(`track_${id}_pan`, this.pannerNode);
    graph.registerNode(`track_${id}_out`, this.outputNode);

    // Initial Routing: Input -> Vol -> Pan -> Out
    graph.connect(`track_${id}_input`, `track_${id}_vol`);
    graph.connect(`track_${id}_vol`, `track_${id}_pan`);
    graph.connect(`track_${id}_pan`, `track_${id}_out`);
    
    // By default, route output to Master
    graph.connect(`track_${id}_out`, 'master_out');
  }

  public setVolume(val: number) {
    this.volume = val;
    if (!this.isMuted) {
      // Ramp to prevent clicks
      this.volumeNode.gain.setTargetAtTime(val, this.graph.getContext().currentTime, 0.01);
    }
  }

  public setPan(val: number) {
    this.pan = val;
    this.pannerNode.pan.setTargetAtTime(val, this.graph.getContext().currentTime, 0.01);
  }

  public setMute(mute: boolean) {
    this.isMuted = mute;
    const targetVolume = mute ? 0 : this.volume;
    this.volumeNode.gain.setTargetAtTime(targetVolume, this.graph.getContext().currentTime, 0.01);
  }

  public destroy() {
    this.graph.removeNode(`track_${this.id}_input`);
    this.graph.removeNode(`track_${this.id}_vol`);
    this.graph.removeNode(`track_${this.id}_pan`);
    this.graph.removeNode(`track_${this.id}_out`);
  }
}
