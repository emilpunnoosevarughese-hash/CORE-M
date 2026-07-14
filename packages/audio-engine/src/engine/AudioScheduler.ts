import { AudioEngine } from './AudioEngine';
import { AudioGraph } from './AudioGraph';
import { AudioClock } from './AudioClock';

export interface AudioClip {
  id: string;
  buffer: AudioBuffer;
  startTime: number; // Timeline start time in seconds
  duration: number; // Timeline duration in seconds
  sourceOffset: number; // Offset into the audio file in seconds
  playbackRate: number;
  trackId: string;
}

export class AudioScheduler {
  private engine = AudioEngine.getInstance();
  private clock = AudioClock.getInstance();
  private graph: AudioGraph;
  
  // Track active sources so we can stop them when pausing/seeking
  private activeSources: Map<string, AudioBufferSourceNode> = new Map();

  constructor(graph: AudioGraph) {
    this.graph = graph;
  }

  /**
   * Schedules a clip to play at the correct absolute Web Audio time.
   */
  public scheduleClip(clip: AudioClip) {
    const context = this.graph.getContext();
    const currentTimelineTime = this.clock.getCurrentTime();

    // If the clip ends before the current playhead, ignore it
    if (clip.startTime + clip.duration <= currentTimelineTime) return;

    const source = context.createBufferSource();
    source.buffer = clip.buffer;
    source.playbackRate.value = clip.playbackRate;

    // We must route this source into the Track's input node
    const trackInputId = `track_${clip.trackId}_input`;
    const trackInputNode = this.graph.getNode(trackInputId);
    
    if (trackInputNode) {
      source.connect(trackInputNode);
    } else {
      console.warn(`Track input node ${trackInputId} not found, routing to master`);
      source.connect(context.destination);
    }

    // Register source so we can stop it later
    const sourceId = `source_${clip.id}_${crypto.randomUUID()}`;
    this.activeSources.set(sourceId, source);

    source.onended = () => {
      source.disconnect();
      this.activeSources.delete(sourceId);
    };

    // Math for scheduling:
    // When should this play in context time?
    // contextTime = currentTime + (clipStartTime - timelineTime)
    let when = context.currentTime + (clip.startTime - currentTimelineTime);
    let offset = clip.sourceOffset;

    // If the playhead is already past the start of the clip
    if (currentTimelineTime > clip.startTime) {
      when = context.currentTime;
      offset += (currentTimelineTime - clip.startTime) * clip.playbackRate;
    }

    source.start(when, offset, clip.duration);
  }

  public stopAll() {
    for (const [id, source] of this.activeSources.entries()) {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Source might have already stopped
      }
    }
    this.activeSources.clear();
  }
}
