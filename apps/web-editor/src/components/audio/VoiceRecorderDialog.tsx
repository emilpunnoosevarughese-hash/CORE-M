import React, { useEffect, useState, useRef } from 'react';
import { VoiceRecorder } from '@corem/audio';
import { Mic, Square, X } from 'lucide-react';

interface VoiceRecorderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (blob: Blob) => void;
}

export function VoiceRecorderDialog({ isOpen, onClose, onSave }: VoiceRecorderDialogProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [livePeak, setLivePeak] = useState(0);
  const recorderRef = useRef<VoiceRecorder | null>(null);
  const reqRef = useRef<number>(0);

  useEffect(() => {
    if (isOpen) {
      recorderRef.current = new VoiceRecorder();
    } else {
      if (recorderRef.current && isRecording) {
        recorderRef.current.stopRecording();
      }
      recorderRef.current = null;
      setIsRecording(false);
    }
  }, [isOpen, isRecording]);

  useEffect(() => {
    const updateMeter = () => {
      if (recorderRef.current && isRecording) {
        setLivePeak(recorderRef.current.getLivePeak());
      } else {
        setLivePeak(0);
      }
      reqRef.current = requestAnimationFrame(updateMeter);
    };
    reqRef.current = requestAnimationFrame(updateMeter);
    return () => cancelAnimationFrame(reqRef.current);
  }, [isRecording]);

  const handleStart = async () => {
    if (!recorderRef.current) return;
    const granted = await recorderRef.current.requestPermissions();
    if (granted) {
      recorderRef.current.startRecording();
      setIsRecording(true);
    } else {
      alert('Microphone permission denied.');
    }
  };

  const handleStop = async () => {
    if (!recorderRef.current) return;
    const blob = await recorderRef.current.stopRecording();
    setIsRecording(false);
    onSave(blob);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-xl shadow-2xl w-96 overflow-hidden">
        
        {/* Header */}
        <div className="h-12 border-b border-border flex items-center justify-between px-4">
          <div className="font-semibold text-sm flex items-center gap-2">
            <Mic size={16} className="text-red-500" />
            Voiceover Recording
          </div>
          <button onClick={onClose} className="p-1 hover:bg-surface-hover rounded-md text-foreground/50">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center">
          
          {/* Status */}
          <div className={`text-lg font-bold mb-6 ${isRecording ? 'text-red-500 animate-pulse' : 'text-foreground/50'}`}>
            {isRecording ? 'RECORDING...' : 'READY'}
          </div>

          {/* Meter */}
          <div className="w-full h-4 bg-black rounded-full overflow-hidden mb-8">
            <div 
              className={`h-full transition-all duration-75 ${livePeak > 0.9 ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(100, livePeak * 100)}%` }}
            />
          </div>

          {/* Controls */}
          {isRecording ? (
            <button 
              onClick={handleStop}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-500/20 transition-all"
            >
              <Square size={24} fill="currentColor" />
            </button>
          ) : (
            <button 
              onClick={handleStart}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-500/20 transition-all"
            >
              <Mic size={24} />
            </button>
          )}

        </div>
      </div>
    </div>
  );
}
