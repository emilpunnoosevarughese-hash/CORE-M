import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, Copy, Scissors, Edit2, Info } from 'lucide-react';
import { useTimelineStore } from '@corem/timeline';

interface Props {
  clipId: string;
  x: number;
  y: number;
  onClose: () => void;
}

export function ClipContextMenu({ clipId, x, y, onClose }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { deleteClip, duplicateClip, splitClip, playhead } = useTimelineStore();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Use timeout to prevent immediate close on the right-click that opened it
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 10);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Prevent menu from going off-screen
  const safeX = Math.min(x, window.innerWidth - 200);
  const safeY = Math.min(y, window.innerHeight - 250);

  return createPortal(
    <div 
      ref={menuRef}
      className="fixed z-[200] w-48 bg-surface border border-border rounded-lg shadow-xl py-1 text-sm flex flex-col"
      style={{ left: safeX, top: safeY }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <button 
        className="flex items-center gap-2 px-3 py-2 hover:bg-surface-hover text-left"
        onClick={() => { splitClip(clipId, playhead.currentFrame); onClose(); }}
      >
        <Scissors size={14} className="opacity-70" /> Split at Playhead
      </button>
      <button 
        className="flex items-center gap-2 px-3 py-2 hover:bg-surface-hover text-left"
        onClick={() => { duplicateClip(clipId); onClose(); }}
      >
        <Copy size={14} className="opacity-70" /> Duplicate
      </button>
      <button 
        className="flex items-center gap-2 px-3 py-2 hover:bg-surface-hover text-left disabled:opacity-50"
        onClick={() => { /* Rename logic */ onClose(); }}
        disabled
      >
        <Edit2 size={14} className="opacity-70" /> Rename
      </button>
      <div className="h-px bg-border my-1" />
      <button 
        className="flex items-center gap-2 px-3 py-2 hover:bg-red-500/10 text-red-500 text-left"
        onClick={() => { deleteClip(clipId); onClose(); }}
      >
        <Trash2 size={14} /> Delete
      </button>
    </div>,
    document.body
  );
}
