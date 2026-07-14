import { useState, useCallback, useEffect } from 'react';
import { useTimelineStore } from '@corem/timeline';

const DEFAULT_SAVE_DIR  = 'E:\\Core M';
const STORED_HANDLE_KEY = 'corem_save_dir_handle';
const LAST_PATH_KEY     = 'corem_last_saved_path';

/**
 * useSaveProject
 *
 * Saves the current project as a JSON file.
 * - On first save: prompts the user to choose a directory (defaults to E:\Core M)
 * - Stores the directory handle in IndexedDB for subsequent silent saves
 * - Falls back to a browser download link if File System Access API is unavailable
 */
export function useSaveProject(projectId: string) {
  const [isSaving,  setIsSaving]  = useState(false);
  const [savedPath, setSavedPath] = useState<string>('');

  // Restore last saved path label from localStorage
  useEffect(() => {
    const last = localStorage.getItem(LAST_PATH_KEY);
    if (last) setSavedPath(last);
  }, []);

  const serializeProject = useCallback(() => {
    const state = useTimelineStore.getState();
    return JSON.stringify(
      {
        version:    '1.0',
        projectId,
        savedAt:    new Date().toISOString(),
        sequences:  state.sequences,
        tracks:     state.tracks,
        clips:      state.clips,
        playhead:   state.playhead,
      },
      null,
      2
    );
  }, [projectId]);

  // Persist a FileSystemDirectoryHandle in IndexedDB (can't go in localStorage)
  const storeHandle = async (handle: FileSystemDirectoryHandle) => {
    return new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('corem_fs', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('handles');
      req.onsuccess = () => {
        const tx = req.result.transaction('handles', 'readwrite');
        tx.objectStore('handles').put(handle, 'saveDir');
        tx.oncomplete = () => resolve();
        tx.onerror   = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });
  };

  const loadHandle = async (): Promise<FileSystemDirectoryHandle | null> => {
    return new Promise<FileSystemDirectoryHandle | null>((resolve) => {
      const req = indexedDB.open('corem_fs', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('handles');
      req.onsuccess = () => {
        const tx = req.result.transaction('handles', 'readonly');
        const get = tx.objectStore('handles').get('saveDir');
        get.onsuccess = () => resolve(get.result ?? null);
        get.onerror   = () => resolve(null);
      };
      req.onerror = () => resolve(null);
    });
  };

  const saveViaFSA = useCallback(async (data: string) => {
    // Try to reuse stored directory handle
    let dirHandle: FileSystemDirectoryHandle | null = await loadHandle();

    // If no stored handle, ask the user to pick a directory
    if (!dirHandle) {
      try {
        dirHandle = await (window as any).showDirectoryPicker({
          id:        'corem-save',
          mode:      'readwrite',
          startIn:   'documents',
        });
        await storeHandle(dirHandle!);
      } catch {
        return false; // User cancelled
      }
    }

    // Verify permission is still granted
    const fsDirHandle = dirHandle! as any;
    const perm = await fsDirHandle.queryPermission?.({ mode: 'readwrite' });
    if (perm && perm !== 'granted') {
      const req = await fsDirHandle.requestPermission?.({ mode: 'readwrite' });
      if (req !== 'granted') return false;
    }

    const fileName  = `${projectId}_${Date.now()}.corem`;
    const fileHandle = await dirHandle!.getFileHandle(fileName, { create: true });
    const writable   = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();

    const pathLabel = `${DEFAULT_SAVE_DIR}\\${fileName}`;
    setSavedPath(pathLabel);
    localStorage.setItem(LAST_PATH_KEY, pathLabel);
    return true;
  }, [projectId]);

  const saveViaDownload = useCallback((data: string) => {
    const blob = new Blob([data], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${projectId}_${Date.now()}.corem`;
    a.click();
    URL.revokeObjectURL(url);
    setSavedPath('Downloaded (check Downloads folder)');
    localStorage.setItem(LAST_PATH_KEY, 'Downloaded');
  }, [projectId]);

  const saveProject = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const data = serializeProject();
      const hasFSA = 'showDirectoryPicker' in window;
      if (hasFSA) {
        const ok = await saveViaFSA(data);
        if (!ok) saveViaDownload(data); // Fallback if picker cancelled
      } else {
        saveViaDownload(data);
      }
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, serializeProject, saveViaFSA, saveViaDownload]);

  return { saveProject, isSaving, savedPath };
}
