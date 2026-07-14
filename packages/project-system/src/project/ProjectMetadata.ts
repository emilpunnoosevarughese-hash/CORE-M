export interface ProjectMetadata {
  id: string;
  name: string;
  creationDate: number;
  lastModifiedDate: number;
  author: string;
  version: string;
  resolution: { width: number, height: number };
  framerate: number;
  colorSpace: 'sRGB' | 'Rec709' | 'Rec2020' | 'DisplayP3';
  audioSampleRate: number;
  statistics: {
    assetCount: number;
    timelineClipCount: number;
    totalDuration: number; // in seconds
  };
  plugins: string[];
}
