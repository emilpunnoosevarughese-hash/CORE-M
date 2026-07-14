import { ConnectionManager } from '../network/ConnectionManager';
import { RemoteInputManager } from './RemoteInputManager';

export class RemoteControlServer {
  private static instance: RemoteControlServer;
  private connectionManager = ConnectionManager.getInstance();
  private inputManager = RemoteInputManager.getInstance();

  private constructor() {
    this.connectionManager.onMessage = (payload) => {
      this.handleCommand(payload);
    };
  }

  public static getInstance(): RemoteControlServer {
    if (!RemoteControlServer.instance) {
      RemoteControlServer.instance = new RemoteControlServer();
    }
    return RemoteControlServer.instance;
  }

  private handleCommand(payload: any) {
    // payload should be validated and authenticated via MobileSession before reaching here
    if (payload.type === 'remote_command') {
      this.inputManager.dispatchCommand(payload.command, payload.args);
    }
  }

  public start() {
    // Called when the editor activates the remote control feature
    this.connectionManager.initializeLocalWebSocket();
  }
}
