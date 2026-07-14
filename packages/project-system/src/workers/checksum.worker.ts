self.onmessage = async (e: MessageEvent) => {
  const { type, messageId, file } = e.data;

  if (type === 'hash') {
    try {
      // Calculate SHA-256 hash of the file using Web Crypto API
      const buffer = await (file as File).arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      self.postMessage({ messageId, hash: hashHex });
    } catch (err: any) {
      self.postMessage({ messageId, error: err.message || 'Hash calculation failed' });
    }
  }
};
