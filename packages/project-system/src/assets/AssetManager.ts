import { AssetDatabase, AssetRecord } from './AssetDatabase';

export class AssetManager {
  private static instance: AssetManager;
  private db: AssetDatabase;

  private constructor() {
    this.db = new AssetDatabase();
    this.db.initialize().catch(err => console.error('Failed to init AssetDatabase', err));
  }

  public static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  public async addAsset(file: File): Promise<AssetRecord> {
    // 1. Generate Hash via Worker
    // 2. Extract Metadata (Resolution, FPS, Codec) via Worker
    // 3. Generate Thumbnail via Worker
    
    // For architectural representation:
    const asset: AssetRecord = {
      id: crypto.randomUUID(),
      hash: 'mock_generated_hash',
      fileName: file.name,
      originalPath: file.webkitRelativePath || file.name,
      metadata: {},
      importDate: Date.now(),
      lastModified: file.lastModified,
      tags: [],
      rating: 0,
      usageCount: 0
    };

    await this.db.putAsset(asset);
    return asset;
  }

  public async getAsset(id: string): Promise<AssetRecord | null> {
    return await this.db.getAsset(id);
  }
}
