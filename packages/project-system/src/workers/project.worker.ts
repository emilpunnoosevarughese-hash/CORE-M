import { pack, unpack } from 'msgpackr';

self.onmessage = async (e: MessageEvent) => {
  const { type, messageId, projectState, format, blob } = e.data;

  try {
    if (type === 'serialize') {
      let resultBlob: Blob;
      
      if (format === 'binary') {
        const buffer = pack(projectState);
        resultBlob = new Blob([buffer], { type: 'application/octet-stream' });
      } else {
        const json = JSON.stringify(projectState, null, 2);
        resultBlob = new Blob([json], { type: 'application/json' });
      }

      self.postMessage({ messageId, blob: resultBlob });
    } 
    else if (type === 'deserialize') {
      const arrayBuffer = await blob.arrayBuffer();
      let state: any;

      if (format === 'binary') {
        state = unpack(new Uint8Array(arrayBuffer));
      } else {
        const text = new TextDecoder().decode(arrayBuffer);
        state = JSON.parse(text);
      }

      self.postMessage({ messageId, projectState: state });
    }
  } catch (err: any) {
    self.postMessage({ messageId, error: err.message || 'Worker processing failed' });
  }
};
