import { AudioGraph } from '../engine/AudioGraph';

export class MasterMixer {
  private graph: AudioGraph;
  
  public masterVolumeNode: GainNode;
  public masterLimiterNode: DynamicsCompressorNode;
  
  private volume: number = 1.0;

  constructor(graph: AudioGraph) {
    this.graph = graph;
    const context = graph.getContext();

    // The Master Bus
    this.masterVolumeNode = context.createGain();
    this.masterVolumeNode.gain.value = this.volume;

    // Master Limiter (Hard knee, fast attack, infinity ratio to prevent clipping)
    this.masterLimiterNode = context.createDynamicsCompressor();
    this.masterLimiterNode.threshold.value = -0.1; // dB
    this.masterLimiterNode.knee.value = 0.0;
    this.masterLimiterNode.ratio.value = 20.0;
    this.masterLimiterNode.attack.value = 0.001; // extremely fast
    this.masterLimiterNode.release.value = 0.1;

    // Register nodes
    graph.registerNode('master_vol', this.masterVolumeNode);
    graph.registerNode('master_limiter', this.masterLimiterNode);

    // Route: Master Vol -> Master Limiter -> AudioContext Destination
    graph.connect('master_vol', 'master_limiter');
    graph.connect('master_limiter', 'master_out');
  }

  public setVolume(val: number) {
    this.volume = val;
    this.masterVolumeNode.gain.setTargetAtTime(val, this.graph.getContext().currentTime, 0.01);
  }
}
