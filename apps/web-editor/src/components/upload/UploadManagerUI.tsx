import React from 'react';
import { useUploaderStore } from '@corem/uploader';

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatTime(seconds: number) {
  if (!seconds || seconds < 0) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const UploadManagerUI: React.FC = () => {
  const { items, pauseUpload, resumeUpload, cancelUpload, clearCompleted } = useUploaderStore();
  const uploadList = Object.values(items);
  
  if (uploadList.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-gray-900 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-50 font-sans text-white">
      <div className="bg-gray-800 px-4 py-3 flex justify-between items-center border-b border-gray-700">
        <h3 className="font-semibold text-sm tracking-wide">Transfers</h3>
        <button 
          onClick={clearCompleted}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          Clear Completed
        </button>
      </div>
      
      <div className="max-h-80 overflow-y-auto">
        {uploadList.map((item) => (
          <div key={item.id} className="p-4 border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition-colors">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium truncate max-w-[200px]" title={item.file.name}>
                {item.file.name}
              </span>
              <span className="text-xs text-gray-400 font-mono">
                {Math.round(item.progress)}%
              </span>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-1.5 mb-2 overflow-hidden">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  item.status === 'error' ? 'bg-red-500' :
                  item.status === 'paused' ? 'bg-yellow-500' :
                  item.status === 'completed' ? 'bg-green-500' :
                  'bg-blue-500'
                }`}
                style={{ width: `${item.progress}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center text-xs text-gray-400">
              <div className="font-mono">
                {item.status === 'uploading' && item.speedBytesPerSec > 0 ? (
                  <>
                    <span>{formatBytes(item.speedBytesPerSec)}/s</span>
                    <span className="mx-2">•</span>
                    <span>{formatTime(item.etaSeconds || 0)} left</span>
                  </>
                ) : (
                  <span className="capitalize">{item.status}</span>
                )}
                {item.error && <span className="text-red-400 ml-2 truncate max-w-[120px]">{item.error}</span>}
              </div>
              
              <div className="flex space-x-2">
                {item.status === 'uploading' && (
                  <button onClick={() => pauseUpload(item.id)} className="hover:text-white" title="Pause">⏸</button>
                )}
                {item.status === 'paused' && (
                  <button onClick={() => resumeUpload(item.id)} className="hover:text-white" title="Resume">▶</button>
                )}
                {item.status !== 'completed' && (
                  <button onClick={() => cancelUpload(item.id)} className="hover:text-red-400" title="Cancel">✕</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
