import { RenderNode, RenderGraph } from './GPU/RenderGraph';
import { RenderPass } from './GPU/RenderPass';

export interface EffectParameter {
  id: string;
  name: string;
  type: 'float' | 'color' | 'boolean' | 'int' | 'vec2' | 'vec3';
  defaultValue: any;
  min?: number;
  max?: number;
  uniformName: string;
}

export interface EffectDefinition {
  id: string;
  name: string;
  category: 'Blur' | 'Color' | 'Stylize' | 'Distortion' | 'Utility';
  parameters: EffectParameter[];
  createPass: () => RenderPass;
}

export class EffectRegistry {
  private static instance: EffectRegistry;
  private effects: Map<string, EffectDefinition> = new Map();

  private constructor() {}

  public static getInstance(): EffectRegistry {
    if (!EffectRegistry.instance) {
      EffectRegistry.instance = new EffectRegistry();
    }
    return EffectRegistry.instance;
  }

  public register(def: EffectDefinition) {
    this.effects.set(def.id, def);
  }

  public get(id: string): EffectDefinition | undefined {
    return this.effects.get(id);
  }

  public getAll(): EffectDefinition[] {
    return Array.from(this.effects.values());
  }
}
