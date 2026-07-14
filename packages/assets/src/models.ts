export type AssetType = 'video' | 'audio' | 'image' | 'document' | 'font' | 'lut';

export interface AssetMetadata {
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
  mimeType: string;
  extension: string;
  originalName: string;
  
  // Video & Audio specific
  duration?: number;
  bitrate?: number;
  codec?: string;
  
  // Video & Image specific
  width?: number;
  height?: number;
  
  // Video specific
  fps?: number;
  audioTracks?: number;
  
  // Audio specific
  sampleRate?: number;
  channels?: number;
  
  // Image specific
  colorProfile?: string;
  hasTransparency?: boolean;
}

export interface Asset {
  id: string;
  projectId: string; // the project it belongs to (or 'global' for user-wide library)
  type: AssetType;
  metadata: AssetMetadata;
  
  // Cloudinary / Firebase Storage URL
  url: string;
  thumbnailUrl?: string;
  waveformUrl?: string; // for audio previews
  
  status: 'uploading' | 'processing' | 'ready' | 'error';
  tags: string[];
  folderId?: string;
  isFavorite: boolean;
}
