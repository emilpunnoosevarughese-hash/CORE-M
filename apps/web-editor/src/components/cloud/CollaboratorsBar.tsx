import React, { useEffect } from 'react';
import { usePresenceStore, useAuthStore } from '@corem/cloud';
import { Share2 } from 'lucide-react';

export function CollaboratorsBar({ projectId, onShareClick }: { projectId: string; onShareClick: () => void }) {
  const { user } = useAuthStore();
  const { collaborators, joinProject, leaveProject } = usePresenceStore();

  useEffect(() => {
    if (user && projectId) {
      joinProject(projectId);
      return () => leaveProject(projectId);
    }
  }, [user, projectId, joinProject, leaveProject]);

  const users = Object.values(collaborators);

  return (
    <div className="flex items-center gap-3">
      {/* Avatars */}
      <div className="flex items-center -space-x-2 overflow-hidden px-2">
        {users.map(u => (
          <div
            key={u.uid}
            className="w-7 h-7 rounded-full border-2 border-surface flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-sm relative group"
            style={{ backgroundColor: u.color }}
            title={u.displayName}
          >
            {u.photoURL ? (
              <img src={u.photoURL} alt={u.displayName} className="w-full h-full rounded-full" />
            ) : (
              (u.displayName || 'U')[0].toUpperCase()
            )}
            
            {/* Tooltip */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
              {u.displayName}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onShareClick}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors"
      >
        <Share2 size={13} />
        Share
      </button>
    </div>
  );
}
