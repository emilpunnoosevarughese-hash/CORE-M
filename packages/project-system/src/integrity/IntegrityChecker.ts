import { AssetDatabase } from '../assets/AssetDatabase';

export class IntegrityChecker {
  private db: AssetDatabase;

  constructor(db: AssetDatabase) {
    this.db = db;
  }

  /**
   * Scans a timeline's clips against the asset database to identify missing media.
   * Runs non-blockingly using indexedDB async requests.
   */
  public async validateTimeline(clips: any[]): Promise<{ missingIds: string[], validCount: number }> {
    const missingIds: string[] = [];
    let validCount = 0;

    for (const clip of clips) {
      if (clip.assetId) {
        const asset = await this.db.getAsset(clip.assetId);
        if (!asset || !asset.originalPath /* or some other check like file handle validation */) {
          missingIds.push(clip.assetId);
        } else {
          validCount++;
        }
      }
    }

    return { missingIds, validCount };
  }
}
