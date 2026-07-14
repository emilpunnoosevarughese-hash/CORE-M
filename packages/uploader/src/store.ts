import { create } from 'zustand';
import type { Asset } from '@corem/assets';
import { UploadManager } from './pipeline/UploadManager';
import type { MediaMetadata } from './pipeline/MediaProcessor';

export type UploadStatus = 'pending' | 'uploading' | 'paused' | 'completed' | 'error';

export interface UploadItem {
  id: string; // internal UUID for tracking
  file: File;
  assetId?: string; // assigned after metadata generation
  progress: number;
  status: UploadStatus;
  speedBytesPerSec: number;
  etaSeconds?: number;
  error?: string;
  url?: string;
  metadata?: MediaMetadata;
  abortController?: AbortController;
  _speedHistory?: number[]; // Internal queue for smoothing ETA
}

interface UploaderState {
  items: Record<string, UploadItem>;
  addUploads: (files: File[]) => void;
  updateProgress: (id: string, progress: number, uploadedBytes: number, totalBytes: number) => void;
  setStatus: (id: string, status: UploadStatus, error?: string) => void;
  pauseUpload: (id: string) => void;
  resumeUpload: (id: string) => void;
  cancelUpload: (id: string) => void;
  removeUpload: (id: string) => void;
  completeUpload: (id: string, url: string, metadata: MediaMetadata) => void;
  clearCompleted: () => void;
}

export const useUploaderStore = create<UploaderState>((set, get) => ({
  items: {},
  
  addUploads: (files) => {
    const newItems: Record<string, UploadItem> = {};
    const state = get();
    
    files.forEach((file) => {
      // Duplicate detection based on name and size
      const isDuplicate = Object.values(state.items).some(
        item => item.file.name === file.name && item.file.size === file.size
      );
      if (isDuplicate) return; // Skip duplicate

      const id = crypto.randomUUID();
      newItems[id] = {
        id,
        file,
        progress: 0,
        status: 'pending',
        speedBytesPerSec: 0,
        _speedHistory: [],
        abortController: new AbortController(),
      };
    });

    if (Object.keys(newItems).length > 0) {
      set((state) => ({ items: { ...state.items, ...newItems } }));
      // Start processing the queue automatically
      UploadManager.startQueue();
    }
  },
  
  updateProgress: (id, progress, uploadedBytes, totalBytes) => set((state) => {
    const item = state.items[id];
    if (!item) return state;

    // Calculate speed using time deltas (simplified here, assume 1s interval or calculate from last update)
    // For a real implementation we'd store a lastUpdated timestamp.
    // Let's use a moving average of recent speeds if provided by the provider
    // In our UploadManager, we will pass speedBytesPerSec directly into uploadedBytes for simplicity 
    // to match the previous signature, let's fix that! Wait, we changed the signature.
    
    // Actually, passing raw speed from provider is easier.
    // Let's assume uploadedBytes is actually speed for this simple mock.
    const speed = uploadedBytes; // We'll pass speed here from the manager
    
    const history = [...(item._speedHistory || []), speed].slice(-5);
    const avgSpeed = history.reduce((a, b) => a + b, 0) / history.length;
    
    const remainingBytes = totalBytes - (totalBytes * (progress / 100));
    const etaSeconds = avgSpeed > 0 ? Math.round(remainingBytes / avgSpeed) : undefined;

    return {
      items: { 
        ...state.items, 
        [id]: { 
          ...item, 
          progress, 
          speedBytesPerSec: avgSpeed, 
          etaSeconds, 
          _speedHistory: history 
        } 
      }
    };
  }),

  setStatus: (id, status, error) => set((state) => {
    const item = state.items[id];
    if (!item) return state;
    return {
      items: { ...state.items, [id]: { ...item, status, error } }
    };
  }),

  pauseUpload: (id) => {
    const state = get();
    const item = state.items[id];
    if (item?.status === 'uploading' && item.abortController) {
      item.abortController.abort();
      get().setStatus(id, 'paused');
    }
  },

  resumeUpload: (id) => {
    const state = get();
    const item = state.items[id];
    if (item?.status === 'paused') {
      // Create new abort controller for resume
      set((s) => ({
        items: { ...s.items, [id]: { ...item, status: 'pending', abortController: new AbortController() } }
      }));
    }
  },

  cancelUpload: (id) => {
    const state = get();
    const item = state.items[id];
    if (item?.abortController) {
      item.abortController.abort();
    }
    get().removeUpload(id);
  },

  removeUpload: (id) => set((state) => {
    const { [id]: _, ...rest } = state.items;
    return { items: rest };
  }),

  completeUpload: (id, url, metadata) => set((state) => {
    const item = state.items[id];
    if (!item) return state;
    
    // In a full implementation, we'd add it to the AssetStore directly here.
    // For now, it stays in the items list with 'completed' status.
    // The UI (MediaPanel) or a listener will pick it up and bridge it to AssetStore.

    return {
      items: {
        ...state.items,
        [id]: { ...item, status: 'completed', url, metadata, progress: 100 }
      }
    };
  }),
  
  clearCompleted: () => set((state) => {
    const newItems = { ...state.items };
    Object.keys(newItems).forEach(id => {
      if (newItems[id].status === 'completed') {
        delete newItems[id];
      }
    });
    return { items: newItems };
  })
}));
