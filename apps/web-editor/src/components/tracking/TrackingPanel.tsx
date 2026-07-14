import React from 'react';
import { Target, Play, Square, Settings2, Trash2 } from 'lucide-react';
import { useTrackerStore } from '@corem/cv';

export function TrackingPanel() {
  const { trackers, activeTrackerId, setActiveTracker, addTracker, removeTracker, isTracking, setTrackingStatus } = useTrackerStore();

  const handleStartTracking = () => {
    if (!activeTrackerId) return;
    setTrackingStatus(true);
    
    // Simulate tracking progress
    setTimeout(() => {
      setTrackingStatus(false);
      alert('Tracking complete for the current clip bounds.');
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Motion Tracking
        </h3>
        <button 
          onClick={() => addTracker('point', 'current_clip_1')}
          className="text-xs bg-primary/20 text-primary px-2 py-1 rounded hover:bg-primary/30 transition-colors"
        >
          Add Point Tracker
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {trackers.length === 0 ? (
          <div className="text-xs text-foreground/40 text-center py-8">
            No trackers on this clip.<br />Add a tracker to begin.
          </div>
        ) : (
          trackers.map((t: any) => (
            <div 
              key={t.id}
              onClick={() => setActiveTracker(t.id)}
              className={`p-3 rounded border cursor-pointer transition-colors ${activeTrackerId === t.id ? 'bg-primary/10 border-primary/50' : 'bg-background border-border hover:border-foreground/20'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{t.name}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeTracker(t.id); }}
                  className="text-foreground/40 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-foreground/60">
                <span className="capitalize">{t.type} Tracker</span>
                <span>•</span>
                <span>{t.data.length} frames tracked</span>
              </div>
            </div>
          ))
        )}
      </div>

      {activeTrackerId && (
        <div className="p-4 border-t border-border bg-surface-hover/30 space-y-4">
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={handleStartTracking}
              disabled={isTracking}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded font-medium text-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {isTracking ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isTracking ? 'Stop Tracking' : 'Track Forward'}
            </button>
          </div>
          <div className="flex items-center justify-between text-xs text-foreground/60">
            <span>Analyze:</span>
            <div className="flex gap-2">
              <button className="px-2 py-1 bg-surface rounded hover:text-foreground">Backward</button>
              <button className="px-2 py-1 bg-surface rounded hover:text-foreground">Forward</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
