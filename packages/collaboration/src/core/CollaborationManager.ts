import { SessionManager } from './SessionManager';
import { SyncScheduler } from '../performance/SyncScheduler';

export class CollaborationManager {
  private static instance: CollaborationManager;

  private constructor() {}

  public static getInstance(): CollaborationManager {
    if (!CollaborationManager.instance) {
      CollaborationManager.instance = new CollaborationManager();
    }
    return CollaborationManager.instance;
  }

  /**
   * Initializes the collaboration engine.
   * Remains decoupled from other packages.
   */
  public initialize() {
    SyncScheduler.getInstance().start();
  }

  public async createSession(): Promise<string> {
    const sessionToken = crypto.randomUUID();
    // Communicate with backend to create session
    return sessionToken;
  }

  public async joinSession(url: string, token: string) {
    SessionManager.getInstance().joinSession(url, token);
  }

  public leaveSession() {
    SessionManager.getInstance().leaveSession();
    SyncScheduler.getInstance().stop();
  }
}
