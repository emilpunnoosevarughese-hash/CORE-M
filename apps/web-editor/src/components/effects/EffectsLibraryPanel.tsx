import React, { useState } from 'react';
import { Search, Sparkles, Filter } from 'lucide-react';
import { EffectRegistry } from '@corem/effects';
import type { EffectDefinition } from '@corem/effects';

export function EffectsLibraryPanel() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  
  const allEffects = EffectRegistry.getAllEffects();
  
  const categories = ['All', ...Array.from(new Set(allEffects.map(e => e.category)))];

  const filteredEffects = allEffects.filter(e => {
    if (activeCategory !== 'All' && e.category !== activeCategory) return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-surface border-r border-border w-64">
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center px-4 shrink-0 bg-surface-hover/30">
        <Sparkles size={16} className="text-primary mr-2" />
        <h2 className="font-semibold text-sm">Effects Library</h2>
      </div>

      {/* Search & Filter */}
      <div className="p-3 border-b border-border space-y-3 shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-foreground/50" />
          <input 
            type="text" 
            placeholder="Search effects..." 
            className="w-full bg-background border border-border rounded-md pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-primary"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-surface-hover border border-border'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Effects List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredEffects.length === 0 ? (
          <div className="text-center text-xs text-foreground/50 py-8">
            No effects found.
          </div>
        ) : (
          filteredEffects.map(effect => (
            <div 
              key={effect.id}
              className="group flex flex-col p-2 rounded-md hover:bg-surface-hover cursor-grab active:cursor-grabbing border border-transparent hover:border-border transition-colors"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/x-corem-effect', effect.id);
                e.dataTransfer.effectAllowed = 'copy';
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{effect.name}</span>
                <span className="text-[9px] uppercase font-bold text-foreground/40 bg-background px-1.5 py-0.5 rounded">
                  {effect.category}
                </span>
              </div>
              <p className="text-[10px] text-foreground/60 mt-1 line-clamp-2">
                {effect.description}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
