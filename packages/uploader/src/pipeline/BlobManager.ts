export class BlobManager {
  private static blobs: Map<string, { url: string; refs: number }> = new Map();

  static register(id: string, url: string) {
    if (this.blobs.has(id)) {
      this.blobs.get(id)!.refs++;
    } else {
      this.blobs.set(id, { url, refs: 1 });
    }
  }

  static addRef(id: string) {
    const item = this.blobs.get(id);
    if (item) item.refs++;
  }

  static release(id: string) {
    const item = this.blobs.get(id);
    if (item) {
      item.refs--;
      if (item.refs <= 0) {
        if (item.url.startsWith('blob:')) {
          URL.revokeObjectURL(item.url);
        }
        this.blobs.delete(id);
      }
    }
  }

  static releaseAll() {
    this.blobs.forEach((item) => {
      if (item.url.startsWith('blob:')) {
        URL.revokeObjectURL(item.url);
      }
    });
    this.blobs.clear();
  }
}
