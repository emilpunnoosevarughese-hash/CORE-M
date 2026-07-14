import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, Pause, Play, X } from 'lucide-react';
import { useUploaderStore } from '@corem/uploader';
import { useAssetStore } from './assets/useAssetStore';
import { useEffect } from 'react';
export function MediaPanel() {
  const { items, addUploads, pauseUpload, resumeUpload, cancelUpload, clearCompleted } = useUploaderStore();
  const { addAsset } = useAssetStore();
  const uploads = Object.values(items);

  // Bridge completed uploads to AssetStore
  useEffect(() => {
    uploads.forEach(upload => {
      if (upload.status === 'completed' && upload.url && upload.metadata && !upload.assetId) {
        // Create an asset in the AssetStore
        const assetId = `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        let type = 'file';
        if (upload.file.type.startsWith('video/')) type = 'video';
        else if (upload.file.type.startsWith('audio/')) type = 'audio';
        else if (upload.file.type.startsWith('image/')) type = 'image';

        addAsset({
          id: assetId,
          type: type as any,
          name: upload.file.name,
          sourceUrl: upload.url,
          thumbnail: upload.metadata.thumbnailUrl,
          duration: upload.metadata.duration,
          isLocal: true, // If using LocalProvider
          tags: [],
          isFavorite: false,
          isDownloaded: true,
          addedAt: Date.now(),
        });

        // Mark this upload as bridged (we could update the store, or just rely on clearCompleted)
        useUploaderStore.setState(s => {
          const item = s.items[upload.id];
          if (!item) return s;
          return { items: { ...s.items, [upload.id]: { ...item, assetId } } };
        });
        
        // Auto-clear is removed so user can drag the imported file from this panel
      }
    });
  }, [uploads, addAsset]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    addUploads(acceptedFiles);
  }, [addUploads]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, noClick: uploads.length > 0 });

  return (
    <div className="flex flex-col h-full bg-surface text-foreground relative overflow-hidden" {...getRootProps()}>
      <input {...getInputProps()} />
      
      {/* Header */}
      <div className="p-3 border-b border-border font-medium flex justify-between items-center bg-surface shrink-0 z-10">
        <span>Import Queue</span>
        {uploads.some(u => u.status === 'completed') && (
          <button onClick={clearCompleted} className="text-xs text-primary hover:underline">Clear Completed</button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 relative">
        {uploads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-foreground/50 border-2 border-dashed border-border/50 rounded-lg p-8">
            <UploadCloud size={48} className="mb-4 opacity-50" />
            <p className="text-sm text-center mb-2">Drag and drop media here</p>
            <p className="text-xs text-center opacity-70">Support for Videos, Audio, Images, and Fonts up to 20GB</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {uploads.map((upload) => (
              <div 
                key={upload.id} 
                draggable={upload.status === 'completed' && !!upload.assetId}
                onDragStart={(e) => {
                  if (upload.assetId) {
                    e.dataTransfer.setData('application/corem-asset', upload.assetId);
                    e.dataTransfer.setData('text/plain', upload.assetId);
                    e.dataTransfer.effectAllowed = 'copy';
                  }
                }}
                className={`bg-background border border-border rounded-lg overflow-hidden group relative flex flex-col h-28 ${upload.status === 'completed' ? 'cursor-grab active:cursor-grabbing hover:border-primary' : ''}`}
              >
                {/* Info */}
                <div className="flex-1 p-2 flex flex-col justify-center items-center relative z-10">
                  {upload.metadata?.thumbnailUrl ? (
                    <div 
                      className="absolute inset-0 bg-cover bg-center z-0" 
                      style={{ backgroundImage: `url(${upload.metadata.thumbnailUrl})` }} 
                    />
                  ) : (
                    <File size={24} className="text-foreground/40 mb-1 z-10" />
                  )}
                  <span className={`text-[10px] truncate w-full text-center px-2 z-10 ${upload.metadata?.thumbnailUrl ? 'bg-black/50 absolute bottom-1' : ''}`}>
                    {upload.file.name}
                  </span>
                </div>
                
                {/* Progress Bar & Actions */}
                <div className="h-8 bg-surface-hover border-t border-border flex items-center px-2 justify-between z-10">
                  <span className="text-[10px] font-medium">{Math.round(upload.progress)}%</span>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {upload.status === 'uploading' || upload.status === 'pending' ? (
                      <button onClick={(e) => { e.stopPropagation(); pauseUpload(upload.id); }} className="p-1 hover:bg-surface rounded text-foreground/70 hover:text-foreground">
                        <Pause size={12} />
                      </button>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); resumeUpload(upload.id); }} className="p-1 hover:bg-surface rounded text-foreground/70 hover:text-foreground">
                        <Play size={12} />
                      </button>
                    )}
                    {upload.status !== 'completed' && (
                      <button onClick={(e) => { e.stopPropagation(); cancelUpload(upload.id); }} className="p-1 hover:bg-surface rounded text-red-400 hover:text-red-500 hover:bg-red-500/10">
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Overlay */}
                <div 
                  className="absolute bottom-8 left-0 right-0 h-1 bg-primary/20 z-0"
                >
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
                
                {/* Status Overlay */}
                {upload.status === 'completed' && (
                  <div className="absolute top-1 right-1 bg-green-500/90 rounded px-1.5 py-0.5 z-20 text-[9px] font-bold text-white shadow">
                    ✓ Imported
                  </div>
                )}
                {upload.status === 'paused' && (
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center z-20 text-xs font-medium">
                    Paused
                  </div>
                )}
                {upload.status === 'error' && (
                  <div className="absolute inset-0 bg-red-950/50 flex flex-col items-center justify-center z-20 text-xs text-red-200 p-2 text-center">
                    <span className="font-bold">Error</span>
                    <span className="text-[9px] mt-1">{upload.error}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drag Overlay */}
      {isDragActive && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-primary border-dashed z-50 flex items-center justify-center backdrop-blur-sm m-2 rounded-lg pointer-events-none">
          <div className="bg-surface px-6 py-3 rounded-full shadow-xl flex items-center space-x-2 text-primary">
            <UploadCloud size={20} />
            <span className="font-medium text-sm">Drop to upload</span>
          </div>
        </div>
      )}
    </div>
  );
}
