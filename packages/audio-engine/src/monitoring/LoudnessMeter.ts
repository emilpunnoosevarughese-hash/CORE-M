import { AudioEngine } from '../engine/AudioEngine';

export interface MeterData {
  peakL: number;
  peakR: number;
  rmsL: number;
  rmsR: number;
}

export class LoudnessMeter {
  private analyser: AnalyserNode;
  private processor: ScriptProcessorNode;
  private dataCallback: (data: MeterData) => void;

  constructor(targetNode: AudioNode, onUpdate: (data: MeterData) => void) {
    const context = AudioEngine.getInstance().getContext();
    this.dataCallback = onUpdate;

    this.analyser = context.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    // Use ScriptProcessorNode as the fallback/standard for analyzing buffers across browsers without strict Worklet policies.
    // In a fully native AudioWorklet implementation, this logic happens in the worklet thread and posts back via MessagePort.
    this.processor = context.createScriptProcessor(2048, 2, 2);

    targetNode.connect(this.analyser);
    this.analyser.connect(this.processor);
    
    // We must connect the processor to the destination for onaudioprocess to fire
    this.processor.connect(context.destination);

    this.processor.onaudioprocess = (e: AudioProcessingEvent) => {
      const input = e.inputBuffer;
      const left = input.getChannelData(0);
      const right = input.numberOfChannels > 1 ? input.getChannelData(1) : left;

      let sumL = 0;
      let sumR = 0;
      let peakL = 0;
      let peakR = 0;

      for (let i = 0; i < left.length; i++) {
        const valL = Math.abs(left[i]);
        const valR = Math.abs(right[i]);
        
        sumL += valL * valL;
        sumR += valR * valR;
        
        if (valL > peakL) peakL = valL;
        if (valR > peakR) peakR = valR;
      }

      const rmsL = Math.sqrt(sumL / left.length);
      const rmsR = Math.sqrt(sumR / right.length);

      this.dataCallback({ peakL, peakR, rmsL, rmsR });
    };
  }

  public destroy() {
    this.analyser.disconnect();
    this.processor.disconnect();
    this.processor.onaudioprocess = null;
  }
}
