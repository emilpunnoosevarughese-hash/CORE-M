import { ProjectManager } from '../project/ProjectManager';

export class RecoveryEngine {
  
  /**
   * Scans the RecoveryDB for any autosaves that are newer than the latest explicitly saved project file.
   * If a crash occurred, the autosave timestamp will be more recent.
   */
  public static async checkForCrashRecovery(projectId: string, lastKnownSaveTime: number): Promise<boolean> {
    const db = await this.openRecoveryDB();
    return new Promise((resolve) => {
      const transaction = db.transaction('autosaves', 'readonly');
      const store = transaction.objectStore('autosaves');
      const index = store.index('projectId');
      const request = index.getAll(projectId);

      request.onsuccess = () => {
        const records = request.result || [];
        if (records.length === 0) return resolve(false);

        // Sort to find the latest
        records.sort((a, b) => b.timestamp - a.timestamp);
        const latestAutosave = records[0];

        if (latestAutosave.timestamp > lastKnownSaveTime) {
          // A crash or force-close occurred
          resolve(true);
        } else {
          resolve(false);
        }
      };
    });
  }

  public static async restoreLatestAutosave(projectId: string): Promise<void> {
    const db = await this.openRecoveryDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('autosaves', 'readonly');
      const store = transaction.objectStore('autosaves');
      const index = store.index('projectId');
      const request = index.getAll(projectId);

      request.onsuccess = async () => {
        const records = request.result || [];
        if (records.length === 0) return reject(new Error('No autosave found'));

        records.sort((a, b) => b.timestamp - a.timestamp);
        const latestAutosave = records[0];

        try {
          const pm = ProjectManager.getInstance();
          await pm.loadProject(latestAutosave.blob, 'binary'); // Autosaves are always binary msgpack
          resolve();
        } catch (e) {
          reject(e);
        }
      };
    });
  }

  private static openRecoveryDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('corem_recovery', 1);
      request.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
      request.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
    });
  }
}
