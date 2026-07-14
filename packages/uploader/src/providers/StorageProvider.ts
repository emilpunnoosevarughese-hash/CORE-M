export interface UploadProgress {
  bytesUploaded: number;
  totalBytes: number;
  percentage: number;
}

export interface UploadResult {
  url: string;
  providerId: string; // e.g. cloudinary public_id
  format: string;
  size: number;
  secureUrl?: string;
  streamingUrl?: string; // HLS/DASH if available
}

export interface StorageCapabilities {
  supportsChunking: boolean;
  supportsStreaming: boolean;
  supportsResume: boolean;
  isLocal: boolean;
}

export interface StorageProvider {
  name: string;
  capabilities: StorageCapabilities;
  
  upload(
    file: File, 
    onProgress?: (progress: UploadProgress) => void,
    abortSignal?: AbortSignal
  ): Promise<UploadResult>;
  
  // Optional advanced controls (mostly handled by AbortSignal, but explicit for some APIs)
  pause?(uploadId: string): void;
  resume?(uploadId: string): void;
  cancel?(uploadId: string): void;
}
