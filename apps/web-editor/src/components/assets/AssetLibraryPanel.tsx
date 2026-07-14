import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  Search, Star, Plus, Upload, Grid, List, ChevronDown,
  Heart, Clock, FolderPlus, Play, MoreHorizontal, X
} from 'lucide-react';
import { useAssetStore } from './useAssetStore';
import type { AssetType } from './assetTypes';
import { ASSET_TYPE_LABELS, ASSET_TYPE_COLORS } from './assetTypes';

const TYPES_IN_ORDER: Array<AssetType | 'all'> = [
  'all', 'template', 'music', 'sfx', 'overlay', 'mograph',
  'lut', 'background', 'video', 'image', 'gif', 'sticker',
  'particle', 'frame', 'font', 'shape', 'gradient',
];

function AssetCard({
  asset,
  onToggleFavorite,
  onDragStart,
  onUse,
}: {
  asset: ReturnType<typeof useAssetStore.getState>['assets'][string];
  onToggleFavorite: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onUse: () => void;
}) {
  const [hover, setHover] = useState(false);
  const color = ASSET_TYPE_COLORS[asset.type] ?? '#1e293b';
  const durationStr = asset.duration
    ? asset.duration >= 60
      ? `${Math.floor(asset.duration / 60)}m ${asset.duration % 60}s`
      : `${asset.duration}s`
    : null;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="relative rounded-lg overflow-hidden cursor-grab active:cursor-grabbing border border-border hover:border-primary transition-all group select-none"
      style={{ aspectRatio: '16/9', background: color }}
    >
      {/* Thumbnail / Gradient preview */}
      {asset.thumbnail ? (
        <img src={asset.thumbnail} alt={asset.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center opacity-30 text-white text-3xl">
          {ASSET_TYPE_LABELS[asset.type]?.split(' ')[0]}
        </div>
      )}

      {/* Overlay on hover */}
      {hover && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2">
          <button
            onClick={onUse}
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white hover:scale-110 transition-transform"
          >
            <Play size={14} fill="white" />
          </button>
        </div>
      )}

      {/* Duration badge */}
      {durationStr && (
        <span className="absolute bottom-1 right-1 text-[9px] bg-black/70 text-white px-1.5 py-0.5 rounded">
          {durationStr}
        </span>
      )}

      {/* Favorite */}
      <button
        onClick={e => { e.stopPropagation(); onToggleFavorite(); }}
        className={`absolute top-1 right-1 p-1 rounded transition-colors ${asset.isFavorite ? 'text-yellow-400' : 'text-white/50 opacity-0 group-hover:opacity-100'}`}
      >
        <Star size={12} fill={asset.isFavorite ? 'currentColor' : 'none'} />
      </button>

      {/* Local badge */}
      {asset.isLocal && (
        <span className="absolute top-1 left-1 text-[9px] bg-primary/80 text-white px-1 py-0.5 rounded">Local</span>
      )}
    </div>
  );
}

function AssetListRow({ asset, onToggleFavorite, onDragStart }: {
  asset: ReturnType<typeof useAssetStore.getState>['assets'][string];
  onToggleFavorite: () => void;
  onDragStart: (e: React.DragEvent) => void;
}) {
  const color = ASSET_TYPE_COLORS[asset.type] ?? '#1e293b';
  return (
    <div
      draggable onDragStart={onDragStart}
      className="flex items-center gap-3 px-3 py-2 hover:bg-surface-hover rounded-lg cursor-grab border border-transparent hover:border-border transition-all group"
    >
      <div className="w-10 h-7 rounded flex-shrink-0" style={{ background: color }} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{asset.name}</p>
        <p className="text-[10px] text-foreground/40">{ASSET_TYPE_LABELS[asset.type]}</p>
      </div>
      {asset.duration && <span className="text-[10px] text-foreground/40 shrink-0">{asset.duration}s</span>}
      <button
        onClick={e => { e.stopPropagation(); onToggleFavorite(); }}
        className={`p-1 shrink-0 ${asset.isFavorite ? 'text-yellow-400' : 'text-foreground/30 opacity-0 group-hover:opacity-100'}`}
      >
        <Star size={12} fill={asset.isFavorite ? 'currentColor' : 'none'} />
      </button>
    </div>
  );
}

export function AssetLibraryPanel() {
  const { assets, collections, toggleFavorite, markUsed, addLocalAsset, createCollection, addToCollection, getFiltered } = useAssetStore();
  const [activeType, setActiveType] = useState<AssetType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [favOnly, setFavOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showNewCol, setShowNewCol] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => getFiltered(activeType, search, favOnly), [assets, activeType, search, favOnly]);

  const displayAssets = useMemo(() => {
    if (!activeCollectionId) return filtered;
    const col = collections[activeCollectionId];
    if (!col) return filtered;
    return col.assetIds.map(id => assets[id]).filter(Boolean) as typeof filtered;
  }, [filtered, activeCollectionId, collections, assets]);

  const handleDragStart = useCallback((e: React.DragEvent, assetId: string) => {
    e.dataTransfer.setData('application/corem-asset', assetId);
    e.dataTransfer.setData('text/plain', assetId);
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleDropZone = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      import('@corem/uploader').then(({ useUploaderStore }) => {
        useUploaderStore.getState().addUploads(files);
      });
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      import('@corem/uploader').then(({ useUploaderStore }) => {
        useUploaderStore.getState().addUploads(files);
      });
    }
    e.target.value = '';
  }, []);

  const sortedCollections = useMemo(() =>
    Object.values(collections).sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)),
    [collections]
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      
      {/* Header */}
      <div className="shrink-0 border-b border-border bg-surface px-3 py-2 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Asset Library</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFavOnly(f => !f)}
              className={`p-1.5 rounded transition-colors ${favOnly ? 'text-yellow-400 bg-yellow-400/10' : 'text-foreground/50 hover:bg-surface-hover'}`}
              title="Favorites only"
            >
              <Star size={14} />
            </button>
            <button
              onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
              className="p-1.5 hover:bg-surface-hover rounded transition-colors text-foreground/50"
            >
              {viewMode === 'grid' ? <List size={14} /> : <Grid size={14} />}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 hover:bg-surface-hover rounded transition-colors text-foreground/50"
              title="Import files"
            >
              <Upload size={14} />
            </button>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileInput} accept="video/*,audio/*,image/*,.gif" />
            <input 
              type="file" 
              multiple 
              // @ts-ignore - webkitdirectory is non-standard but supported
              webkitdirectory="" 
              directory="" 
              className="hidden" 
              id="folderInput"
              onChange={handleFileInput} 
            />
            <button
              onClick={() => document.getElementById('folderInput')?.click()}
              className="p-1.5 hover:bg-surface-hover rounded transition-colors text-foreground/50"
              title="Import folder"
            >
              <FolderPlus size={14} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search assets…"
            className="w-full bg-background border border-border rounded-md pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-primary"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Type tabs */}
        <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-hide -mx-1 px-1">
          {TYPES_IN_ORDER.map(t => (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                activeType === t ? 'bg-primary text-primary-foreground' : 'bg-surface-hover text-foreground/60 hover:text-foreground'
              }`}
            >
              {t === 'all' ? '✦ All' : ASSET_TYPE_LABELS[t as AssetType]}
            </button>
          ))}
        </div>
      </div>

      {/* Collections sidebar + main grid */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        
        {/* Collections list */}
        <div className="w-32 border-r border-border flex flex-col shrink-0 overflow-y-auto bg-surface">
          <div className="p-2 border-b border-border">
            <button
              onClick={() => setShowNewCol(s => !s)}
              className="w-full flex items-center gap-1 text-[10px] text-foreground/50 hover:text-foreground transition-colors"
            >
              <FolderPlus size={12} /> New
            </button>
            {showNewCol && (
              <input
                autoFocus
                value={newColName}
                onChange={e => setNewColName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newColName.trim()) {
                    createCollection(newColName.trim());
                    setNewColName('');
                    setShowNewCol(false);
                  }
                  if (e.key === 'Escape') setShowNewCol(false);
                }}
                placeholder="Collection name"
                className="mt-1 w-full text-[10px] bg-background border border-border rounded px-1.5 py-1 outline-none focus:border-primary"
              />
            )}
          </div>

          <button
            onClick={() => setActiveCollectionId(null)}
            className={`px-2 py-1.5 text-[11px] text-left transition-colors ${!activeCollectionId ? 'bg-primary/10 text-primary' : 'hover:bg-surface-hover text-foreground/70'}`}
          >
            All Assets
          </button>

          {sortedCollections.map(col => (
            <button
              key={col.id}
              onClick={() => setActiveCollectionId(c => c === col.id ? null : col.id)}
              className={`px-2 py-1.5 text-[11px] text-left truncate transition-colors ${activeCollectionId === col.id ? 'bg-primary/10 text-primary' : 'hover:bg-surface-hover text-foreground/70'}`}
            >
              {col.name}
            </button>
          ))}
        </div>

        {/* Main asset grid/list */}
        <div
          ref={dropRef}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDropZone}
          className="flex-1 overflow-y-auto p-2"
        >
          {displayAssets.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-foreground/30 py-8">
              <Upload size={32} className="opacity-50" />
              <div className="text-center">
                <p className="text-sm font-medium">No assets found</p>
                <p className="text-xs mt-1">Drag & drop files or click Import</p>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 gap-2">
              {displayAssets.map(a => (
                <AssetCard
                  key={a.id}
                  asset={a}
                  onToggleFavorite={() => toggleFavorite(a.id)}
                  onDragStart={e => handleDragStart(e, a.id)}
                  onUse={() => markUsed(a.id)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-0.5">
              {displayAssets.map(a => (
                <AssetListRow
                  key={a.id}
                  asset={a}
                  onToggleFavorite={() => toggleFavorite(a.id)}
                  onDragStart={e => handleDragStart(e, a.id)}
                />
              ))}
            </div>
          )}

          {/* Drop zone hint */}
          <div className="mt-3 border-2 border-dashed border-border/30 rounded-lg p-4 text-center text-[10px] text-foreground/30">
            Drop files here to import
          </div>
        </div>
      </div>

      {/* Stats footer */}
      <div className="h-7 border-t border-border bg-surface flex items-center px-3 gap-3 shrink-0">
        <span className="text-[10px] text-foreground/40">{displayAssets.length} assets</span>
        <span className="text-[10px] text-foreground/30">·</span>
        <span className="text-[10px] text-foreground/40">{Object.values(assets).filter(a => a.isLocal).length} local</span>
        <span className="ml-auto text-[10px] text-foreground/40">{Object.values(assets).filter(a => a.isFavorite).length} ⭐</span>
      </div>
    </div>
  );
}
