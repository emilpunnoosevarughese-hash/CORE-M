/// <reference lib="webworker" />

import MP4Box from 'mp4box';

self.onmessage = async (e: MessageEvent) => {
  const { file, id } = e.data;
  
  if (!file) return;

  try {
    // For Video (MP4) files, we use mp4box to parse metadata without loading the whole file
    if (file.type.startsWith('video/mp4')) {
      const mp4boxfile = MP4Box.createFile();
      
      mp4boxfile.onReady = (info: any) => {
        const videoTrack = info.videoTracks[0];
        const audioTrack = info.audioTracks[0];
        
        self.postMessage({
          id,
          type: 'success',
          metadata: {
            duration: info.duration / info.timescale,
            width: videoTrack?.video.width,
            height: videoTrack?.video.height,
            fps: videoTrack?.video.fps,
            codec: videoTrack?.codec,
            audioTracks: info.audioTracks.length,
          }
        });
      };

      mp4boxfile.onError = (e: any) => {
        self.postMessage({ id, type: 'error', error: e });
      };

      // Read the first 2MB to extract moov atom
      const chunkSize = 2 * 1024 * 1024;
      const slice = file.slice(0, chunkSize);
      const buffer = await slice.arrayBuffer();
      
      (buffer as any).fileStart = 0;
      mp4boxfile.appendBuffer(buffer);
      mp4boxfile.flush();
    } else {
      // Basic fallback for other types or basic images
      self.postMessage({
        id,
        type: 'success',
        metadata: {
          sizeBytes: file.size,
          mimeType: file.type,
        }
      });
    }
  } catch (err: any) {
    self.postMessage({ id, type: 'error', error: err.message });
  }
};
