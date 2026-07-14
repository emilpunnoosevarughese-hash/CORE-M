/// <reference lib="webworker" />

self.onmessage = async (e: MessageEvent) => {
  const { imageBitmap, id } = e.data;
  
  if (!imageBitmap) return;

  try {
    // The main thread creates an ImageBitmap from a hidden video element
    // and transfers it to the worker to handle the heavy compression/encoding
    const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(imageBitmap, 0, 0);
      
      // Generate multiple sizes if needed
      const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 });
      
      self.postMessage({
        id,
        type: 'success',
        blob
      });
    }
  } catch (err: any) {
    self.postMessage({ id, type: 'error', error: err.message });
  } finally {
    // Cleanup ImageBitmap to free memory
    if (imageBitmap && typeof imageBitmap.close === 'function') {
      imageBitmap.close();
    }
  }
};
