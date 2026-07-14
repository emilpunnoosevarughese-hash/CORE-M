import { OfflineQueue } from './offlineQueue';
import { useProjectStore } from '../projects/projectStore';

export class SyncEngine {
  private static isOnline = navigator.onLine;
  private static syncInProgress = false;

  static init() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushQueue();
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  static async pushUpdate(projectId: string, payload: any) {
    if (this.isOnline) {
      try {
        await useProjectStore.getState().updateProject(projectId, payload);
      } catch (e) {
        console.error('Online update failed, queuing offline', e);
        await OfflineQueue.enqueue({ projectId, type: 'UPDATE_PROJECT', payload });
      }
    } else {
      await OfflineQueue.enqueue({ projectId, type: 'UPDATE_PROJECT', payload });
    }
  }

  static async flushQueue() {
    if (!this.isOnline || this.syncInProgress) return;
    this.syncInProgress = true;
    
    try {
      const queue = await OfflineQueue.getQueue();
      for (const op of queue) {
        if (op.type === 'UPDATE_PROJECT') {
          await useProjectStore.getState().updateProject(op.projectId, op.payload);
        }
        await OfflineQueue.dequeue(op.id);
      }
    } catch (e) {
      console.error('Failed to flush offline queue', e);
    } finally {
      this.syncInProgress = false;
    }
  }
}
