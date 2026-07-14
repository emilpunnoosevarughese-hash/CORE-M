export class ConflictResolver {
  // Simple LWW (Last Write Wins) for now
  static resolve(localState: any, remoteState: any, localTimestamp: number, remoteTimestamp: number) {
    if (localTimestamp > remoteTimestamp) {
      return localState;
    }
    return remoteState;
  }
}
