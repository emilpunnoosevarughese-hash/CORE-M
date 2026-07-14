import { pack, unpack } from 'msgpackr';

export enum PacketType {
  CONNECT = 0,
  AUTH = 1,
  SYNC_DELTA = 2,
  CURSOR_MOVE = 3,
  PRESENCE = 4,
  ACK = 5,
  HEARTBEAT = 6
}

export interface SyncPacket {
  type: PacketType;
  sequenceId: number;
  timestamp: number;
  payload: any;
  signature?: string;
}

export class PacketSerializer {
  
  public static serialize(packet: SyncPacket): Uint8Array {
    // Compress the packet into a minimal MessagePack binary buffer
    const buffer = pack(packet);
    return new Uint8Array(buffer);
  }

  public static deserialize(buffer: Uint8Array | ArrayBuffer): SyncPacket {
    const data = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
    return unpack(data) as SyncPacket;
  }
}
