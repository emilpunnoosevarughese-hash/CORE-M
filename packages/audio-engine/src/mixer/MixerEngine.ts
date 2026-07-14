import { AudioGraph } from '../engine/AudioGraph';
import { MasterMixer } from './MasterMixer';
import { TrackMixer } from './TrackMixer';
import { AudioBus } from '../routing/AudioBus';

export class MixerEngine {
  private static instance: MixerEngine;
  private graph: AudioGraph | null = null;
  
  public masterMixer!: MasterMixer;
  private tracks: Map<string, TrackMixer> = new Map();
  private buses: Map<string, AudioBus> = new Map();

  private constructor() {}

  public static getInstance(): MixerEngine {
    if (!MixerEngine.instance) {
      MixerEngine.instance = new MixerEngine();
    }
    return MixerEngine.instance;
  }

  public initialize(graph: AudioGraph) {
    this.graph = graph;
    this.masterMixer = new MasterMixer(graph);
  }

  public getTrack(id: string): TrackMixer {
    if (!this.graph) throw new Error('MixerEngine not initialized');
    let track = this.tracks.get(id);
    if (!track) {
      track = new TrackMixer(id, this.graph);
      this.tracks.set(id, track);
    }
    return track;
  }

  public getBus(id: string): AudioBus {
    if (!this.graph) throw new Error('MixerEngine not initialized');
    let bus = this.buses.get(id);
    if (!bus) {
      bus = new AudioBus(id, this.graph);
      this.buses.set(id, bus);
    }
    return bus;
  }

  public routeTrackToBus(trackId: string, busId: string) {
    if (!this.graph) return;
    // Disconnect from master
    this.graph.disconnect(`track_${trackId}_out`, 'master_out');
    // Connect to bus
    this.graph.connect(`track_${trackId}_out`, `bus_${busId}_input`);
  }
}
