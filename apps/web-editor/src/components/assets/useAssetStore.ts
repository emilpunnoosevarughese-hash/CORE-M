import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Asset, AssetCollection, DownloadJob, AssetType } from './assetTypes';
import { BUILT_IN_ASSETS } from './assetTypes';
import { set as idbSet, get as idbGet, del as idbDel } from 'idb-keyval';

interface AssetStore {
  assets:      Record<string, Asset>;
  collections: Record<string, AssetCollection>;
  downloads:   Record<string, DownloadJob>;
  recentlyUsed:   string[];
  searchHistory:  string[];

  // Asset actions
  addAsset:       (asset: Asset) => void;
  removeAsset:    (id: string) => void;
  toggleFavorite: (id: string) => void;
  markUsed:       (id: string) => void;
  addLocalAsset:  (file: File) => Promise<Asset>;
  relinkAsset:    (id: string, newUrl: string, isProxy?: boolean) => void;
  initLocalAssets: () => Promise<void>;

  // Collection actions
  createCollection: (name: string, parentId?: string) => string;
  renameCollection: (id: string, name: string) => void;
  deleteCollection: (id: string) => void;
  togglePin:        (id: string) => void;
  addToCollection:  (collectionId: string, assetId: string) => void;
  removeFromCollection: (collectionId: string, assetId: string) => void;

  // Search
  addSearchTerm: (term: string) => void;

  // Download
  queueDownload: (assetId: string) => void;
  updateDownload: (jobId: string, updates: Partial<DownloadJob>) => void;

  // Computed helpers
  getFiltered: (type: AssetType | 'all', search: string, favOnly: boolean) => Asset[];
}

export const useAssetStore = create<AssetStore>()(
  persist(
    (set, get) => ({
      // Initialize with built-in assets
      assets: Object.fromEntries(BUILT_IN_ASSETS.map(a => [a.id, a])),
      collections: {
        'favorites': { id: 'favorites', name: '⭐ Favorites', isPinned: true, assetIds: [], createdAt: Date.now() },
        'recent':    { id: 'recent',    name: '🕒 Recent',    isPinned: true, assetIds: [], createdAt: Date.now() },
      },
      downloads:    {},
      recentlyUsed: [],
      searchHistory: [],

      addAsset: (asset) => set(s => ({ assets: { ...s.assets, [asset.id]: asset } })),

      removeAsset: (id) => set(s => {
        const asset = s.assets[id];
        if (asset) {
          // Direct Blob cleanup
          if (asset.sourceUrl?.startsWith('blob:')) URL.revokeObjectURL(asset.sourceUrl);
          if (asset.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(asset.previewUrl);
          if (asset.proxyUrl?.startsWith('blob:')) URL.revokeObjectURL(asset.proxyUrl);
          
          import('@corem/playback').then(({ MediaPool }) => {
            MediaPool.release(id);
          });
          
          // Remove from IndexedDB if local
          if (asset.isLocal) {
            idbDel(id).catch(console.error);
          }
        }
        const { [id]: _, ...rest } = s.assets;
        return { assets: rest };
      }),

      toggleFavorite: (id) => set(s => ({
        assets: {
          ...s.assets,
          [id]: { ...s.assets[id], isFavorite: !s.assets[id]?.isFavorite }
        }
      })),

      markUsed: (id) => set(s => ({
        assets: { ...s.assets, [id]: { ...s.assets[id], lastUsed: Date.now() } },
        recentlyUsed: [id, ...s.recentlyUsed.filter(x => x !== id)].slice(0, 50),
      })),

      addLocalAsset: async (file: File) => {
        const id  = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const type: AssetType =
          ['mp4','mov','webm','avi','mkv'].includes(ext)      ? 'video'  :
          ['mp3','wav','m4a','aac','ogg','flac'].includes(ext)? 'music'  :
          ['png','jpg','jpeg','webp','avif','svg'].includes(ext) ? 'image' :
          ['gif'].includes(ext)                               ? 'gif'    : 'image';

        const url = URL.createObjectURL(file);
        
        // Extract metadata if possible
        let duration = 0;
        let resolution = '';
        if (type === 'video' || type === 'music') {
          try {
            await new Promise<void>((resolve) => {
              const media = type === 'video' ? document.createElement('video') : document.createElement('audio');
              media.onloadedmetadata = () => {
                duration = media.duration;
                if (type === 'video') {
                  resolution = `${(media as HTMLVideoElement).videoWidth}x${(media as HTMLVideoElement).videoHeight}`;
                }
                resolve();
              };
              media.onerror = () => resolve();
              media.src = url;
            });
          } catch (e) {}
        }

        const asset: Asset = {
          id, name: file.name, type, tags: ['local'],
          previewUrl: url,
          sourceUrl: url,
          size: file.size,
          duration: duration || undefined,
          resolution: resolution || undefined,
          isFavorite: false, isLocal: true, isDownloaded: true,
          addedAt: Date.now(),
        };
        
        // Save to IndexedDB asynchronously
        idbSet(id, file).catch(console.error);
        
        set(s => ({ assets: { ...s.assets, [id]: asset } }));
        return asset;
      },

      initLocalAssets: async () => {
        const state = get();
        const updates: Record<string, Asset> = {};
        let hasChanges = false;
        
        for (const [id, asset] of Object.entries(state.assets)) {
          if (asset.isLocal) {
            try {
              const file = await idbGet<File>(id);
              if (file) {
                const url = URL.createObjectURL(file);
                updates[id] = { ...asset, sourceUrl: url, previewUrl: url };
                hasChanges = true;
              } else {
                updates[id] = { ...asset, sourceUrl: undefined, previewUrl: undefined, tags: ['local', 'error'] };
                hasChanges = true;
              }
            } catch (err) {
              console.warn(`Failed to restore local asset ${id}`, err);
            }
          }
        }
        
        if (hasChanges) {
          set(s => ({ assets: { ...s.assets, ...updates } }));
        }
      },

      relinkAsset: (id, newUrl, isProxy) => set(s => {
        const asset = s.assets[id];
        if (!asset) return s;
        const updates: Partial<Asset> = isProxy ? { proxyUrl: newUrl } : { sourceUrl: newUrl };
        if (!isProxy) updates.previewUrl = newUrl; // Auto-update preview if it's the main source
        return { assets: { ...s.assets, [id]: { ...asset, ...updates } } };
      }),

      createCollection: (name, parentId) => {
        const id = `col-${Date.now()}`;
        set(s => ({
          collections: {
            ...s.collections,
            [id]: { id, name, parentId, isPinned: false, assetIds: [], createdAt: Date.now() }
          }
        }));
        return id;
      },

      renameCollection: (id, name) => set(s => ({
        collections: { ...s.collections, [id]: { ...s.collections[id], name } }
      })),

      deleteCollection: (id) => set(s => {
        const { [id]: _, ...rest } = s.collections;
        return { collections: rest };
      }),

      togglePin: (id) => set(s => ({
        collections: { ...s.collections, [id]: { ...s.collections[id], isPinned: !s.collections[id].isPinned } }
      })),

      addToCollection: (collectionId, assetId) => set(s => {
        const col = s.collections[collectionId];
        if (!col || col.assetIds.includes(assetId)) return s;
        return { collections: { ...s.collections, [collectionId]: { ...col, assetIds: [...col.assetIds, assetId] } } };
      }),

      removeFromCollection: (collectionId, assetId) => set(s => {
        const col = s.collections[collectionId];
        if (!col) return s;
        return { collections: { ...s.collections, [collectionId]: { ...col, assetIds: col.assetIds.filter(x => x !== assetId) } } };
      }),

      addSearchTerm: (term) => set(s => ({
        searchHistory: [term, ...s.searchHistory.filter(x => x !== term)].slice(0, 20),
      })),

      queueDownload: (assetId) => {
        const jobId = `dl-${Date.now()}`;
        set(s => ({
          downloads: {
            ...s.downloads,
            [jobId]: { id: jobId, assetId, status: 'queued', progress: 0 }
          }
        }));
      },

      updateDownload: (jobId, updates) => set(s => ({
        downloads: {
          ...s.downloads,
          [jobId]: { ...s.downloads[jobId], ...updates }
        }
      })),

      getFiltered: (type, search, favOnly) => {
        const assets = Object.values(get().assets);
        const q = search.toLowerCase();
        return assets.filter(a => {
          if (type !== 'all' && a.type !== type) return false;
          if (favOnly && !a.isFavorite) return false;
          if (q && !a.name.toLowerCase().includes(q) && !a.tags.some(t => t.includes(q))) return false;
          return true;
        });
      },
    }),
    {
      name: 'corem-asset-store',
      partialize: (s) => ({
        assets:       Object.fromEntries(Object.entries(s.assets).filter(([,v]) => v.isLocal)),
        collections:  s.collections,
        recentlyUsed: s.recentlyUsed,
        searchHistory: s.searchHistory,
      }),
    }
  )
);

// Synchronization: Listen to completed uploads and bridge them to AssetStore
let syncInitialized = false;
if (typeof window !== 'undefined' && !syncInitialized) {
  syncInitialized = true;
  import('@corem/uploader').then(({ useUploaderStore }) => {
    useUploaderStore.subscribe((state, prevState) => {
      Object.values(state.items).forEach(item => {
        const prevItem = prevState.items[item.id];
        // Transitioned to completed
        if (item.status === 'completed' && prevItem?.status !== 'completed' && item.metadata && item.url) {
          const ext = item.file.name.split('.').pop()?.toLowerCase() || '';
          let type: AssetType = 'video';
          if (item.file.type.startsWith('audio/') || ['mp3','wav','m4a','aac','ogg','flac'].includes(ext)) {
            type = 'music';
          } else if (item.file.type.startsWith('image/') || ['png','jpg','jpeg','webp','avif','svg','gif'].includes(ext)) {
            type = 'image';
          }
          
          const assetId = item.assetId || `asset-${item.id}`;
          
          useAssetStore.getState().addAsset({
            id: assetId,
            name: item.file.name,
            type,
            tags: ['uploaded'],
            previewUrl: item.metadata.proxyUrl || item.url,
            sourceUrl: item.url,
            proxyUrl: item.metadata.proxyUrl,
            size: item.file.size,
            duration: item.metadata.duration,
            resolution: `${item.metadata.width}x${item.metadata.height}`,
            meta: {
              fps: item.metadata.fps,
              hash: item.metadata.hash,
            },
            isFavorite: false,
            isLocal: false,
            isDownloaded: true,
            addedAt: Date.now(),
          });
          
          // Clean up completed item automatically
          setTimeout(() => {
            useUploaderStore.getState().removeUpload(item.id);
          }, 3000);
        }
      });
    });
  });
}
