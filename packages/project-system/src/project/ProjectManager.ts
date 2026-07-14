import { ProjectMetadata } from './ProjectMetadata';
import { ProjectSerializer } from './ProjectSerializer';
// Mocks for cross-package state gathering
// import { TimelineStore } from '@corem/timeline'; 
// import { AssetManager } from '../assets/AssetManager';

export class ProjectManager {
  private static instance: ProjectManager;
  private currentMetadata: ProjectMetadata | null = null;
  private isDevelopmentMode: boolean = process.env.NODE_ENV === 'development';

  private constructor() {}

  public static getInstance(): ProjectManager {
    if (!ProjectManager.instance) {
      ProjectManager.instance = new ProjectManager();
    }
    return ProjectManager.instance;
  }

  public async createProject(name: string, resolution: {width: number, height: number}, framerate: number) {
    this.currentMetadata = {
      id: crypto.randomUUID(),
      name,
      creationDate: Date.now(),
      lastModifiedDate: Date.now(),
      author: 'User',
      version: '1.0.0',
      resolution,
      framerate,
      colorSpace: 'sRGB',
      audioSampleRate: 48000,
      statistics: {
        assetCount: 0,
        timelineClipCount: 0,
        totalDuration: 0
      },
      plugins: []
    };
    // Notify UI / Reset stores
  }

  public async saveProject(): Promise<Blob> {
    if (!this.currentMetadata) throw new Error('No active project');
    this.currentMetadata.lastModifiedDate = Date.now();

    // In a real implementation, we gather state from TimelineStore, EffectEngine, etc.
    const projectState = {
      metadata: this.currentMetadata,
      timeline: {}, // Mock TimelineStore.getState()
      assets: [], // Mock AssetManager.getAll()
      versions: [] // Mock Snapshot data
    };

    const format = this.isDevelopmentMode ? 'json' : 'binary';
    const blob = await ProjectSerializer.serialize(projectState, format);
    return blob;
  }

  public async loadProject(blob: Blob, format: 'json' | 'binary') {
    const projectState = await ProjectSerializer.deserialize(blob, format);
    this.currentMetadata = projectState.metadata;
    // Dispatch loaded state to TimelineStore, AssetManager, etc.
  }

  public getMetadata(): ProjectMetadata | null {
    return this.currentMetadata;
  }
}
