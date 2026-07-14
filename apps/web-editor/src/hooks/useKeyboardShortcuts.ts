import { useEffect } from 'react';
import { useTimelineStore } from '@corem/timeline';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      const store = useTimelineStore.getState();

      switch (e.key.toLowerCase()) {
        case ' ': // Space
          e.preventDefault();
          import('@corem/playback').then(({ usePlaybackStore }) => {
            usePlaybackStore.getState().togglePlay();
          });
          break;
        case 's': // Split
          if (store.selection.clipIds.length > 0) {
            store.selection.clipIds.forEach(id => {
              store.splitClip(id, store.playhead.currentFrame);
            });
          }
          break;
        case 'b': // Blade Tool
          store.setActiveTool('blade');
          break;
        case 'm': // Mute / Unmute selected clip (disable audio)
          if (store.selection.clipIds.length > 0) {
             // In a full app this might mute the track or the clip's audio volume
             // For now we'll toggle visibility as disabled/enabled
             store.selection.clipIds.forEach(id => store.toggleVisibility(id));
          }
          break;
        case 'h': // Hide / Disable clip
          if (store.selection.clipIds.length > 0) {
             store.selection.clipIds.forEach(id => store.toggleVisibility(id));
          }
          break;
        case 'home': // Go to start
          e.preventDefault();
          store.setPlayhead(0);
          store.setScroll(0, store.scrollY);
          break;
        case 'end': // Go to end of active sequence
          e.preventDefault();
          const seq = store.sequences[store.activeSequenceId || ''];
          if (seq) {
            store.setPlayhead(seq.duration);
          }
          break;
        case 'escape': // Clear selection
          store.setSelection([]);
          store.setActiveTool('selection');
          break;

        case 'backspace':
        case 'delete':
          if (store.selection.clipIds.length > 0) {
            if (e.shiftKey) {
              // Ripple Delete on Shift+Delete
              store.selection.clipIds.forEach(id => store.rippleDelete(id));
            } else {
              store.selection.clipIds.forEach(id => store.deleteClip(id));
            }
            // Clear selection after delete
            store.setSelection([]);
          }
          break;
        case 'c': // Copy
          if (e.ctrlKey || e.metaKey) {
            store.copySelection();
          }
          break;
        case 'v': 
          if (e.ctrlKey || e.metaKey) {
            store.pasteSelection(0);
          } else {
            store.setActiveTool('selection');
          }
          break;
        case 'z': // Undo / Redo
          if (e.ctrlKey || e.metaKey) {
            if (e.shiftKey) {
              store.redo();
            } else {
              store.undo();
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
