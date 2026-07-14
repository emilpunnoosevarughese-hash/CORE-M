import { EffectRegistry, EffectDefinition } from './EffectRegistry';
import { RenderPass } from './GPU/RenderPass';

export interface EffectInstance {
  id: string; // unique instance id
  effectId: string; // references EffectDefinition
  enabled: boolean;
  bypassed: boolean;
  solo: boolean;
  parameters: Record<string, any>; // Current values (can be driven by AnimationEngine)
  
  // Runtime
  pass: RenderPass;
}

export class EffectStack {
  public instances: EffectInstance[] = [];

  public addEffect(effectId: string, instanceId: string = crypto.randomUUID()): EffectInstance {
    const def = EffectRegistry.getInstance().get(effectId);
    if (!def) throw new Error(`Effect ${effectId} not found`);

    const parameters: Record<string, any> = {};
    for (const param of def.parameters) {
      parameters[param.id] = param.defaultValue;
    }

    const instance: EffectInstance = {
      id: instanceId,
      effectId,
      enabled: true,
      bypassed: false,
      solo: false,
      parameters,
      pass: def.createPass()
    };

    this.instances.push(instance);
    return instance;
  }

  public removeEffect(instanceId: string) {
    this.instances = this.instances.filter(e => e.id !== instanceId);
  }

  public reorder(startIndex: number, endIndex: number) {
    const result = Array.from(this.instances);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    this.instances = result;
  }

  public duplicate(instanceId: string): EffectInstance | null {
    const original = this.instances.find(e => e.id === instanceId);
    if (!original) return null;

    const duplicateId = crypto.randomUUID();
    const newInstance: EffectInstance = {
      id: duplicateId,
      effectId: original.effectId,
      enabled: original.enabled,
      bypassed: original.bypassed,
      solo: false,
      parameters: JSON.parse(JSON.stringify(original.parameters)),
      pass: EffectRegistry.getInstance().get(original.effectId)!.createPass()
    };
    
    const index = this.instances.indexOf(original);
    this.instances.splice(index + 1, 0, newInstance);
    return newInstance;
  }

  public getActiveEffects(): EffectInstance[] {
    const soloEffect = this.instances.find(e => e.solo);
    if (soloEffect) return [soloEffect];
    return this.instances.filter(e => e.enabled && !e.bypassed);
  }
}
