// Asset Library core types and built-in catalog

export type AssetType =
  | 'music' | 'sfx' | 'video' | 'image' | 'sticker' | 'gif'
  | 'overlay' | 'transition' | 'effect' | 'mograph' | 'background'
  | 'particle' | 'frame' | 'border' | 'icon' | 'emoji' | 'font'
  | 'lut' | 'brush' | 'texture' | 'shape' | 'gradient' | 'palette'
  | 'template' | 'smart_object';

export type TemplateCategory =
  | 'reel' | 'short' | 'tiktok' | 'story' | 'youtube' | 'gaming'
  | 'sports' | 'education' | 'travel' | 'wedding' | 'business'
  | 'podcast' | 'product' | 'intro' | 'outro' | 'logo' | 'lower-third'
  | 'subtitle' | 'presentation';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  category?: TemplateCategory;
  tags: string[];
  thumbnail?: string;
  previewUrl?: string;
  sourceUrl?: string;
  proxyUrl?: string;       // For offline/proxy workflows
  highResUrl?: string;     // For high resolution swap
  
  // Smart Objects
  isSmartObject?: boolean;
  linkedCompositionId?: string; // Edit once, update everywhere
  
  duration?: number;       // seconds, for audio/video
  size?: number;           // bytes
  resolution?: string;     // e.g. '1920x1080'
  colorLabel?: string;
  isFavorite: boolean;
  isLocal: boolean;        // user-imported vs built-in
  isDownloaded: boolean;
  addedAt: number;         // timestamp
  lastUsed?: number;
  meta?: Record<string, unknown>;
}

export interface AssetCollection {
  id: string;
  name: string;
  parentId?: string;
  isPinned: boolean;
  assetIds: string[];
  createdAt: number;
}

export interface DownloadJob {
  id: string;
  assetId: string;
  status: 'queued' | 'downloading' | 'done' | 'error' | 'paused';
  progress: number;         // 0–100
  bytesReceived?: number;
  totalBytes?: number;
  error?: string;
}

// ─── Built-in sample catalog ────────────────────────────────────────────────

const gradient = (from: string, to: string) =>
  `linear-gradient(135deg, ${from}, ${to})`;

export const BUILT_IN_ASSETS: Asset[] = [
  // Music
  { id: 'mus-01', name: 'Cinematic Rise',     type: 'music',      tags: ['cinematic','epic','drums'], isFavorite: false, isLocal: false, isDownloaded: true,  duration: 180, addedAt: 0 },
  { id: 'mus-02', name: 'Lo-Fi Chill',        type: 'music',      tags: ['lofi','calm','background'], isFavorite: true,  isLocal: false, isDownloaded: true,  duration: 120, addedAt: 0 },
  { id: 'mus-03', name: 'Upbeat Corporate',   type: 'music',      tags: ['corporate','upbeat','bright'], isFavorite: false, isLocal: false, isDownloaded: true, duration: 90, addedAt: 0 },
  // SFX
  { id: 'sfx-01', name: 'Whoosh Impact',      type: 'sfx',        tags: ['transition','impact','swoosh'], isFavorite: false, isLocal: false, isDownloaded: true,  duration: 1.2, addedAt: 0 },
  { id: 'sfx-02', name: 'Glass Shatter',      type: 'sfx',        tags: ['break','glass','crash'],   isFavorite: false, isLocal: false, isDownloaded: true,  duration: 0.8, addedAt: 0 },
  { id: 'sfx-03', name: 'Notification Ping',  type: 'sfx',        tags: ['ui','alert','ping'],       isFavorite: false, isLocal: false, isDownloaded: true,  duration: 0.5, addedAt: 0 },
  // Overlays
  { id: 'ovl-01', name: 'Light Leak 1',       type: 'overlay',    tags: ['light','cinematic','warm'], isFavorite: true,  isLocal: false, isDownloaded: true,  addedAt: 0 },
  { id: 'ovl-02', name: 'Film Grain Heavy',   type: 'overlay',    tags: ['grain','film','texture'],  isFavorite: false, isLocal: false, isDownloaded: true,  addedAt: 0 },
  { id: 'ovl-03', name: 'Lens Flare Gold',    type: 'overlay',    tags: ['lens','flare','gold'],     isFavorite: false, isLocal: false, isDownloaded: true,  addedAt: 0 },
  // LUTs
  { id: 'lut-01', name: 'Teal & Orange',      type: 'lut',        tags: ['cinematic','color','grade'], isFavorite: true,  isLocal: false, isDownloaded: true,  addedAt: 0 },
  { id: 'lut-02', name: 'Faded Film',         type: 'lut',        tags: ['vintage','film','fade'],   isFavorite: false, isLocal: false, isDownloaded: true,  addedAt: 0 },
  { id: 'lut-03', name: 'Cold Blue',          type: 'lut',        tags: ['cold','blue','winter'],    isFavorite: false, isLocal: false, isDownloaded: true,  addedAt: 0 },
  { id: 'lut-04', name: 'Golden Hour',        type: 'lut',        tags: ['warm','golden','sunset'],  isFavorite: true,  isLocal: false, isDownloaded: true,  addedAt: 0 },
  // Motion Graphics
  { id: 'mg-01',  name: 'Text Reveal Slide',  type: 'mograph',    tags: ['text','reveal','slide'],   isFavorite: false, isLocal: false, isDownloaded: true,  addedAt: 0 },
  { id: 'mg-02',  name: 'Lower Third Pack',   type: 'mograph',    tags: ['lower-third','text','broadcast'], isFavorite: true,  isLocal: false, isDownloaded: true, addedAt: 0 },
  { id: 'mg-03',  name: 'Countdown Timer',    type: 'mograph',    tags: ['countdown','timer','sports'], isFavorite: false, isLocal: false, isDownloaded: true, addedAt: 0 },
  // Backgrounds
  { id: 'bg-01',  name: 'Dark Gradient',      type: 'background', tags: ['dark','gradient','clean'], isFavorite: false, isLocal: false, isDownloaded: true,  addedAt: 0 },
  { id: 'bg-02',  name: 'Bokeh Blue',         type: 'background', tags: ['bokeh','blue','blur'],     isFavorite: false, isLocal: false, isDownloaded: true,  addedAt: 0 },
  // Templates
  { id: 'tpl-01', name: 'Travel Reel',        type: 'template',   category: 'reel',      tags: ['travel','reel','cinematic'], isFavorite: true,  isLocal: false, isDownloaded: true,  addedAt: 0, duration: 30 },
  { id: 'tpl-02', name: 'TikTok Dance Intro', type: 'template',   category: 'tiktok',    tags: ['tiktok','dance','trending'], isFavorite: false, isLocal: false, isDownloaded: true,  addedAt: 0, duration: 15 },
  { id: 'tpl-03', name: 'Product Promo',      type: 'template',   category: 'product',   tags: ['product','promo','clean'],   isFavorite: false, isLocal: false, isDownloaded: true,  addedAt: 0, duration: 30 },
  { id: 'tpl-04', name: 'Wedding Highlight',  type: 'template',   category: 'wedding',   tags: ['wedding','romantic','elegant'], isFavorite: true,  isLocal: false, isDownloaded: true, addedAt: 0, duration: 60 },
  { id: 'tpl-05', name: 'YouTube Intro',      type: 'template',   category: 'youtube',   tags: ['youtube','intro','logo'],    isFavorite: false, isLocal: false, isDownloaded: true,  addedAt: 0, duration: 10 },
  { id: 'tpl-06', name: 'Gaming Stream',      type: 'template',   category: 'gaming',    tags: ['gaming','stream','overlay'], isFavorite: false, isLocal: false, isDownloaded: true,  addedAt: 0, duration: 20 },
  { id: 'tpl-07', name: 'Podcast Outro',      type: 'template',   category: 'podcast',   tags: ['podcast','outro','subscribe'], isFavorite: false, isLocal: false, isDownloaded: true, addedAt: 0, duration: 12 },
  { id: 'tpl-08', name: 'Education Slide',    type: 'template',   category: 'education', tags: ['education','slide','clean'], isFavorite: false, isLocal: false, isDownloaded: true,  addedAt: 0, duration: 8 },
];

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  music:      '🎵 Music',
  sfx:        '🔊 Sound FX',
  video:      '🎬 Video',
  image:      '🖼 Images',
  sticker:    '🎉 Stickers',
  gif:        '✨ GIFs',
  overlay:    '💡 Overlays',
  transition: '↔ Transitions',
  effect:     '⚡ Effects',
  mograph:    '🎞 Motion Graphics',
  background: '🌌 Backgrounds',
  particle:   '✦ Particles',
  frame:      '🖼 Frames',
  border:     '⬜ Borders',
  icon:       '🔷 Icons',
  emoji:      '😀 Emoji',
  font:       '🔤 Fonts',
  lut:        '🎨 LUTs',
  brush:      '🖌 Brushes',
  texture:    '◼ Textures',
  shape:      '◯ Shapes',
  gradient:   '🌈 Gradients',
  palette:    '🎭 Palettes',
  template:   '📋 Templates',
  smart_object: '🧩 Smart Object',
};

// Visual placeholders using CSS gradients (shown when no real thumbnail available)
export const ASSET_TYPE_COLORS: Record<AssetType, string> = {
  music:      '#6366f1',
  sfx:        '#8b5cf6',
  video:      '#ec4899',
  image:      '#f59e0b',
  sticker:    '#10b981',
  gif:        '#06b6d4',
  overlay:    '#64748b',
  transition: '#f97316',
  effect:     '#ef4444',
  mograph:    '#a855f7',
  background: '#1e293b',
  particle:   '#22d3ee',
  frame:      '#84cc16',
  border:     '#94a3b8',
  icon:       '#3b82f6',
  emoji:      '#f59e0b',
  font:       '#cbd5e1',
  lut:        '#7c3aed',
  brush:      '#b45309',
  texture:    '#374151',
  shape:      '#4b5563',
  gradient:   '#0ea5e9',
  palette:    '#d946ef',
  template:   '#0f172a',
  smart_object: '#eab308',
};
