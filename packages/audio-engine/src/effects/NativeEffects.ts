import { AudioEngine } from '../engine/AudioEngine';
import { AudioGraph } from '../engine/AudioGraph';

export interface AudioEffect {
  id: string;
  name: string;
  inputNode: AudioNode;
  outputNode: AudioNode;
  connect(dest: AudioNode): void;
  disconnect(): void;
  destroy(): void;
}

export class CompressorEffect implements AudioEffect {
  public id: string;
  public name = 'Compressor';
  public inputNode: DynamicsCompressorNode;
  public outputNode: DynamicsCompressorNode;

  constructor(id: string) {
    this.id = id;
    const context = AudioEngine.getInstance().getContext();
    this.inputNode = context.createDynamicsCompressor();
    this.outputNode = this.inputNode;
    
    // Default settings
    this.inputNode.threshold.value = -24;
    this.inputNode.knee.value = 30;
    this.inputNode.ratio.value = 12;
    this.inputNode.attack.value = 0.003;
    this.inputNode.release.value = 0.25;
  }

  public connect(dest: AudioNode) {
    this.outputNode.connect(dest);
  }

  public disconnect() {
    this.outputNode.disconnect();
  }
  
  public destroy() {
    this.disconnect();
  }
}

export class EqualizerEffect implements AudioEffect {
  public id: string;
  public name = 'Equalizer';
  
  public inputNode: BiquadFilterNode;
  public outputNode: BiquadFilterNode;
  
  private bands: BiquadFilterNode[] = [];

  constructor(id: string) {
    this.id = id;
    const context = AudioEngine.getInstance().getContext();
    
    // Create a 3-band EQ for standard purposes
    const low = context.createBiquadFilter();
    low.type = 'lowshelf';
    low.frequency.value = 320;

    const mid = context.createBiquadFilter();
    mid.type = 'peaking';
    mid.frequency.value = 1000;

    const high = context.createBiquadFilter();
    high.type = 'highshelf';
    high.frequency.value = 3200;

    low.connect(mid);
    mid.connect(high);

    this.inputNode = low;
    this.outputNode = high;
    this.bands = [low, mid, high];
  }

  public connect(dest: AudioNode) {
    this.outputNode.connect(dest);
  }

  public disconnect() {
    this.outputNode.disconnect();
  }
  
  public destroy() {
    this.disconnect();
  }
}
