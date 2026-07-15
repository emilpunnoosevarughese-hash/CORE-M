import React, { useState } from 'react';
import { Search, Play, Star, ThumbsUp, Eye } from 'lucide-react';

// Mock data for the showcase
const MOCK_VIDEOS = [
  { id: 1, title: 'Cinematic Travel Vlog', editor: 'Alex D.', views: '12K', likes: '1.2K', thumbnail: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&q=80' },
  { id: 2, title: 'Cyberpunk Short Film', editor: 'Neon VFX', views: '8.5K', likes: '940', thumbnail: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=800&q=80' },
  { id: 3, title: 'Product Commercial', editor: 'Studio M', views: '45K', likes: '3.4K', thumbnail: 'https://images.unsplash.com/photo-1600508513258-396b8ebde249?w=800&q=80' },
  { id: 4, title: 'Music Video Edit', editor: 'BeatSync', views: '22K', likes: '2.1K', thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80' },
  { id: 5, title: 'Documentary Trailer', editor: 'DocuWorks', views: '5K', likes: '420', thumbnail: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&q=80' },
  { id: 6, title: 'Gaming Highlights', editor: 'ProGamer', views: '110K', likes: '14K', thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80' },
];

export function DashboardShowcase() {
  const [search, setSearch] = useState('');

  const filteredVideos = MOCK_VIDEOS.filter(v => 
    v.title.toLowerCase().includes(search.toLowerCase()) || 
    v.editor.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Community Showcase</h1>
          <p className="text-foreground/60">Discover and watch amazing videos edited with CORE M Cloud.</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Star size={18} />
          Submit Your Edit
        </button>
      </div>
      
      <div className="bg-surface border border-border rounded-xl p-4 mb-8 flex items-center gap-3">
        <Search size={20} className="text-foreground/40 ml-2" />
        <input 
          type="text" 
          placeholder="Search edits by title or editor..." 
          className="bg-transparent border-none outline-none w-full p-2 text-foreground"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map(video => (
          <div key={video.id} className="bg-surface border border-border rounded-xl overflow-hidden group hover:border-primary/50 transition-colors cursor-pointer">
            <div className="aspect-video bg-black relative">
              <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                  <Play size={24} className="ml-1" />
                </div>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg mb-1 truncate">{video.title}</h3>
              <p className="text-sm text-foreground/60 mb-3 truncate">by {video.editor}</p>
              <div className="flex items-center gap-4 text-xs text-foreground/40 font-medium">
                <span className="flex items-center gap-1"><Eye size={14} /> {video.views}</span>
                <span className="flex items-center gap-1"><ThumbsUp size={14} /> {video.likes}</span>
              </div>
            </div>
          </div>
        ))}
        {filteredVideos.length === 0 && (
          <div className="col-span-full py-12 text-center text-foreground/50">
            No videos found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
