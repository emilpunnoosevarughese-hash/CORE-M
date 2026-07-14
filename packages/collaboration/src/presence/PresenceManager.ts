import { MessageQueue } from '../network/MessageQueue';
import { PacketType } from '../network/PacketSerializer';

export interface CursorPosition {
  userId: string;
  userName: string;
  color: string;
  x: number; // Normalized timeline X
  y: number; // Normalized timeline Y
  activeTool: string;
}

export class PresenceManager {
  private static instance: PresenceManager;
  
  private messageQueue = MessageQueue.getInstance();
  private onlineUsers: Map<string, CursorPosition> = new Map();
  private onUsersChanged: ((users: CursorPosition[]) => void) | null = null;

  private constructor() {}

  public static getInstance(): PresenceManager {
    if (!PresenceManager.instance) {
      PresenceManager.instance = new PresenceManager();
    }
    return PresenceManager.instance;
  }

  public setUsersChangedCallback(cb: (users: CursorPosition[]) => void) {
    this.onUsersChanged = cb;
  }

  /**
   * Broadcasts the local user's cursor position.
   * This is sent via a lightweight PacketType.CURSOR_MOVE and does not get queued if offline.
   */
  public broadcastCursor(x: number, y: number, activeTool: string = 'select') {
    this.messageQueue.enqueue({
      type: PacketType.CURSOR_MOVE,
      timestamp: Date.now(),
      payload: { x, y, activeTool }
    });
  }

  public handleRemoteCursor(data: CursorPosition) {
    this.onlineUsers.set(data.userId, data);
    if (this.onUsersChanged) {
      this.onUsersChanged(Array.from(this.onlineUsers.values()));
    }
  }

  public removeUser(userId: string) {
    this.onlineUsers.delete(userId);
    if (this.onUsersChanged) {
      this.onUsersChanged(Array.from(this.onlineUsers.values()));
    }
  }
}
