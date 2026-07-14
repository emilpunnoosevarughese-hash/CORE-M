import { AudioEffect } from './NativeEffects';

export class EffectRack {
  private effects: AudioEffect[] = [];
  
  // The endpoints of the rack
  public inputNode: AudioNode | null = null;
  public outputNode: AudioNode | null = null;
  private finalDestination: AudioNode | null = null;

  public addEffect(effect: AudioEffect) {
    this.effects.push(effect);
    this.rebuildChain();
  }

  public removeEffect(id: string) {
    const effect = this.effects.find(e => e.id === id);
    if (effect) {
      effect.destroy();
      this.effects = this.effects.filter(e => e.id !== id);
      this.rebuildChain();
    }
  }

  public setDestination(dest: AudioNode) {
    this.finalDestination = dest;
    this.rebuildChain();
  }

  /**
   * Reconnects all effects in sequential order.
   */
  private rebuildChain() {
    // 1. Disconnect everything
    for (const effect of this.effects) {
      effect.disconnect();
    }

    if (this.effects.length === 0) {
      this.inputNode = null;
      this.outputNode = null;
      return;
    }

    // 2. Chain them up
    for (let i = 0; i < this.effects.length - 1; i++) {
      this.effects[i].connect(this.effects[i + 1].inputNode);
    }

    this.inputNode = this.effects[0].inputNode;
    this.outputNode = this.effects[this.effects.length - 1].outputNode;

    // 3. Connect to final destination if set
    if (this.finalDestination) {
      this.outputNode.connect(this.finalDestination);
    }
  }
}
