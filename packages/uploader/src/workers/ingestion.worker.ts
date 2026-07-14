/// <reference lib="webworker" />

// Simple polyfill/mock for Heavy Ingestion Tasks
self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === 'PROCESS_MEDIA') {
    const { file, generateProxy, id } = payload;
    
    // Simulate hashing (SHA-256)
    const hash = await mockHash(file);
    
    let proxyUrl = undefined;
    if (generateProxy && file.type.startsWith('image/')) {
      proxyUrl = await createProxyImage(file);
    }
    // Video proxy generation via WebCodecs would go here

    self.postMessage({
      type: 'PROCESS_COMPLETE',
      payload: { id, hash, proxyUrl }
    });
  }
};

async function mockHash(file: File) {
  // Real implementation would chunk read file and crypto.subtle.digest
  return `mock_hash_${file.size}_${file.name}`;
}

async function createProxyImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const canvas = new OffscreenCanvas(640, (640 / bitmap.width) * bitmap.height);
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  }
  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.6 });
  return URL.createObjectURL(blob);
}
