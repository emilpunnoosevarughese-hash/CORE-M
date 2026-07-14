import React from 'react';
import { Search, Sparkles } from 'lucide-react';
import { TransitionRegistry } from '@corem/effects';

export function TransitionLibrary() {
  const transitions = TransitionRegistry.getAllTransitions();
  
  const handleDragStart = (e: React.DragEvent, transitionId: string) => {
    e.dataTransfer.setData('application/x-corem-transition', transitionId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background border-r border-border overflow-hidden">
      <div className="p-4 border-b border-border space-y-4 shrink-0">
        <h2 className="font-semibold text-sm">Transitions</h2>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={16} />
          <input 
            type="text" 
            placeholder="Search transitions..." 
            className="w-full bg-surface border border-border rounded-md pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {transitions.map(def => (
          <div 
            key={def.id}
            draggable
            onDragStart={(e) => handleDragStart(e, def.id)}
            className="bg-surface rounded-lg p-3 border border-border hover:border-primary/50 cursor-grab active:cursor-grabbing transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded bg-background flex items-center justify-center shrink-0">
                <Sparkles size={18} className="text-primary group-hover:animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-medium">{def.name}</h3>
                <p className="text-[10px] text-foreground/50 truncate max-w-[150px]">{def.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
