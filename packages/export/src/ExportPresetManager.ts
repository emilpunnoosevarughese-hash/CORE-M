import { ExportJob, ExportFormat, VideoCodec, AudioCodec } from './RenderQueue';

export interface ExportPreset {
  id: string;
  name: string;
  description: string;
  format: ExportFormat;
  resolution: { width: number; height: number };
  fps: number;
  videoCodec: VideoCodec;
  audioCodec: AudioCodec;
  bitrate: number;
  bitrateMode: 'cbr' | 'vbr';
  audioBitrate: number;
  audioSampleRate: number;
  audioChannels: 1 | 2 | 6;
  gopSize: number;
  hardwareAcceleration: boolean;
}

export class ExportPresetManager {
  private static instance: ExportPresetManager;
  private presets: Map<string, ExportPreset> = new Map();

  private constructor() {
    this.loadBuiltInPresets();
  }

  public static getInstance(): ExportPresetManager {
    if (!ExportPresetManager.instance) {
      ExportPresetManager.instance = new ExportPresetManager();
    }
    return ExportPresetManager.instance;
  }

  private loadBuiltInPresets() {
    const defaultAudio = { audioCodec: 'aac' as AudioCodec, audioBitrate: 128000, audioSampleRate: 48000, audioChannels: 2 as const };
    
    this.addPreset({
      id: 'youtube-1080p',
      name: 'YouTube 1080p',
      description: 'Standard 1080p export optimized for YouTube.',
      format: 'mp4',
      resolution: { width: 1920, height: 1080 },
      fps: 30,
      videoCodec: 'h264',
      bitrate: 8000000,
      bitrateMode: 'vbr',
      gopSize: 15,
      hardwareAcceleration: true,
      ...defaultAudio
    });

    this.addPreset({
      id: 'youtube-4k',
      name: 'YouTube 4K',
      description: 'High-quality 4K export for YouTube.',
      format: 'webm',
      resolution: { width: 3840, height: 2160 },
      fps: 60,
      videoCodec: 'vp9',
      bitrate: 45000000,
      bitrateMode: 'vbr',
      gopSize: 30,
      hardwareAcceleration: true,
      ...defaultAudio
    });

    this.addPreset({
      id: 'tiktok',
      name: 'TikTok / Reels',
      description: '1080x1920 portrait format optimized for short-form video.',
      format: 'mp4',
      resolution: { width: 1080, height: 1920 },
      fps: 30,
      videoCodec: 'h264',
      bitrate: 5000000,
      bitrateMode: 'vbr',
      gopSize: 15,
      hardwareAcceleration: true,
      ...defaultAudio
    });

    this.addPreset({
      id: 'cinema',
      name: 'Cinema (ProRes)',
      description: 'Lossless quality export for archival and digital cinema.',
      format: 'mov',
      resolution: { width: 4096, height: 2160 },
      fps: 24,
      videoCodec: 'prores',
      bitrate: 200000000,
      bitrateMode: 'cbr',
      gopSize: 1,
      hardwareAcceleration: false,
      audioCodec: 'wav',
      audioBitrate: 1536000,
      audioSampleRate: 48000,
      audioChannels: 6
    });

    this.addPreset({
      id: 'whatsapp',
      name: 'WhatsApp',
      description: 'Highly compressed video for quick sharing over messaging apps.',
      format: 'mp4',
      resolution: { width: 854, height: 480 },
      fps: 24,
      videoCodec: 'h264',
      bitrate: 1500000,
      bitrateMode: 'cbr',
      gopSize: 12,
      hardwareAcceleration: true,
      ...defaultAudio
    });
    
    // Additional presets like Instagram Feed, Facebook, LinkedIn, X, Threads, Snapchat, Broadcast, Archive
    // omitted for brevity but they follow the same pattern.
  }

  public addPreset(preset: ExportPreset) {
    this.presets.set(preset.id, preset);
  }

  public getPresets(): ExportPreset[] {
    return Array.from(this.presets.values());
  }

  public getPreset(id: string): ExportPreset | undefined {
    return this.presets.get(id);
  }
}
