import { TransportManager } from './TransportManager';
import { SyncPacket } from './PacketSerializer';

export class MessageQueue {
  private static instance: MessageQueue;
  private transport = TransportManager.getInstance();
  
  private pendingQueue: SyncPacket[] = [];
  private unacknowledgedMessages: Map<number, SyncPacket> = new Map();
  private sequenceCounter = 0;

  private isFlushing = false;

  private constructor() {
    this.transport.onConnectionStateChange = (state) => {
      if (state === 'connected') {
        this.flushQueue();
      }
    };

    // Listen for ACKs to resolve unacknowledged messages
    const originalOnMessage = this.transport.onMessage;
    this.transport.onMessage = (packet) => {
      if (packet.type === 5 /* ACK */) {
        this.unacknowledgedMessages.delete(packet.payload.ackSequenceId);
      }
      if (originalOnMessage) originalOnMessage(packet);
    };
  }

  public static getInstance(): MessageQueue {
    if (!MessageQueue.instance) {
      MessageQueue.instance = new MessageQueue();
    }
    return MessageQueue.instance;
  }

  public enqueue(packet: Omit<SyncPacket, 'sequenceId'>) {
    const fullPacket: SyncPacket = {
      ...packet,
      sequenceId: ++this.sequenceCounter
    };

    this.pendingQueue.push(fullPacket);
    this.flushQueue();
  }

  private async flushQueue() {
    if (this.isFlushing || this.pendingQueue.length === 0) return;

    try {
      this.isFlushing = true;
      while (this.pendingQueue.length > 0) {
        const packet = this.pendingQueue[0];
        
        try {
          this.transport.send(packet);
          this.unacknowledgedMessages.set(packet.sequenceId, packet);
          this.pendingQueue.shift(); // Remove on successful dispatch
        } catch (e) {
          // Transport failed (offline), stop flushing
          break;
        }
      }
    } finally {
      this.isFlushing = false;
    }
  }

  public getUnacknowledgedCount() {
    return this.unacknowledgedMessages.size;
  }
}
