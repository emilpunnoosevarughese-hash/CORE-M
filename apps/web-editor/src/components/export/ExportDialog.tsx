import React, { useState, useEffect } from 'react';
import { X, Download, Youtube, Instagram, MonitorPlay, Settings2, FileAudio, FileImage, LayoutGrid } from 'lucide-react';
import { ExportEngine, RenderQueue, ExportPresetManager, JobManager, ExportFormat, VideoCodec, AudioCodec } from '@corem/export';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sequenceId: string;
}

export function ExportDialog({ isOpen, onClose, sequenceId }: ExportDialogProps) {
  const presetManager = ExportPresetManager.getInstance();
  const presets = presetManager.getPresets();
  
  const [selectedPresetId, setSelectedPresetId] = useState('youtube-4k');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Form State
  const [format, setFormat] = useState<ExportFormat>('mp4');
  const [res, setRes] = useState('3840x2160');
  const [fps, setFps] = useState<number>(60);
  const [videoCodec, setVideoCodec] = useState<VideoCodec>('h264');
  const [audioCodec, setAudioCodec] = useState<AudioCodec>('aac');
  const [bitrate, setBitrate] = useState<number>(60000000); // bps
  const [bitrateMode, setBitrateMode] = useState<'cbr' | 'vbr'>('vbr');
  const [audioBitrate, setAudioBitrate] = useState<number>(128000); // bps
  const [audioSampleRate, setAudioSampleRate] = useState<number>(48000);
  const [audioChannels, setAudioChannels] = useState<1 | 2 | 6>(2);
  const [hardwareAccel, setHardwareAccel] = useState(true);

  if (!isOpen) return null;

  const handlePresetChange = (id: string) => {
    setSelectedPresetId(id);
    const p = presets.find(x => x.id === id);
    if (p) {
      setFormat(p.format);
      setRes(`${p.resolution.width}x${p.resolution.height}`);
      setFps(p.fps);
      setVideoCodec(p.videoCodec);
      setAudioCodec(p.audioCodec);
      setBitrate(p.bitrate);
      setBitrateMode(p.bitrateMode);
      setAudioBitrate(p.audioBitrate || 128000);
      setAudioSampleRate(p.audioSampleRate || 48000);
      setAudioChannels(p.audioChannels || 2);
      setHardwareAccel(p.hardwareAcceleration);
    }
  };

  const handleExport = () => {
    const [w, h] = res.split('x').map(Number);
    
    JobManager.getInstance().submitJob({
      name: `Export_${format.toUpperCase()}_${res}_${fps}fps`,
      sequenceId,
      preset: selectedPresetId,
      format,
      resolution: { width: w, height: h },
      fps,
      videoCodec,
      audioCodec,
      bitrate,
      bitrateMode,
      audioBitrate,
      audioSampleRate,
      audioChannels,
      hardwareAcceleration: hardwareAccel,
      priority: 1 // Default priority
    });
    
    onClose();
  };

  const estSizeMB = Math.round((bitrate * 60) / 8 / 1024 / 1024);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-xl shadow-2xl w-[700px] flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="h-14 border-b border-border flex items-center justify-between px-6 bg-surface-hover shrink-0">
          <h2 className="font-bold text-lg">Export & Render</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface rounded-md">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Sidebar Presets */}
          <div className="w-56 border-r border-border bg-surface-hover/30 p-4 space-y-2 overflow-y-auto">
            <div className="text-xs font-semibold text-foreground/50 mb-3 px-2">PRESETS</div>
            {presets.map(p => (
              <button
                key={p.id}
                onClick={() => handlePresetChange(p.id)}
                className={`w-full flex flex-col items-start px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedPresetId === p.id ? 'bg-primary/20 text-primary border border-primary/30' : 'hover:bg-surface text-foreground/80 border border-transparent'
                }`}
              >
                <span className="font-medium">{p.name}</span>
                <span className="text-[10px] opacity-70 truncate w-full text-left">{p.description}</span>
              </button>
            ))}
          </div>

          {/* Settings Form */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Format</label>
                <select 
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  value={format}
                  onChange={e => setFormat(e.target.value as ExportFormat)}
                >
                  <optgroup label="Video">
                    <option value="mp4">MP4 (MPEG-4)</option>
                    <option value="webm">WebM</option>
                    <option value="mov">QuickTime (.MOV)</option>
                  </optgroup>
                  <optgroup label="Audio Only">
                    <option value="mp3">MP3</option>
                    <option value="wav">WAV (Lossless)</option>
                    <option value="aac">AAC</option>
                  </optgroup>
                  <optgroup label="Images & Animation">
                    <option value="gif">Animated GIF</option>
                    <option value="png_sequence">PNG Sequence</option>
                    <option value="jpg_sequence">JPEG Sequence</option>
                  </optgroup>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Resolution</label>
                <select 
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  value={res}
                  onChange={e => setRes(e.target.value)}
                >
                  <option value="7680x4320">8K (7680x4320)</option>
                  <option value="3840x2160">4K (3840x2160)</option>
                  <option value="2560x1440">1440p (2560x1440)</option>
                  <option value="1920x1080">1080p (1920x1080)</option>
                  <option value="1280x720">720p (1280x720)</option>
                  <option value="854x480">480p (854x480)</option>
                  <option value="640x360">360p (640x360)</option>
                  <option value="1080x1920">Vertical 1080p (1080x1920)</option>
                  <option value="1080x1080">Square (1080x1080)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Frame Rate</label>
                <select 
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  value={fps}
                  onChange={e => setFps(Number(e.target.value))}
                >
                  <option value="24">24 fps (Cinematic)</option>
                  <option value="25">25 fps (PAL)</option>
                  <option value="30">30 fps (NTSC)</option>
                  <option value="50">50 fps</option>
                  <option value="60">60 fps (Smooth)</option>
                  <option value="120">120 fps</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Hardware Acceleration</label>
                <select 
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  value={hardwareAccel ? 'true' : 'false'}
                  onChange={e => setHardwareAccel(e.target.value === 'true')}
                >
                  <option value="true">Enabled (WebCodecs)</option>
                  <option value="false">Disabled (FFmpeg Software)</option>
                </select>
              </div>
            </div>

            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-primary flex items-center gap-1 hover:underline"
            >
              <Settings2 size={14}/> {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
            </button>

            {showAdvanced && (
              <div className="p-4 bg-surface-hover/50 rounded-lg space-y-4 border border-border/50">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground/80">Video Codec</label>
                    <select 
                      className="w-full bg-background border border-border rounded-md px-2 py-1 text-xs focus:outline-none focus:border-primary"
                      value={videoCodec}
                      onChange={e => setVideoCodec(e.target.value as VideoCodec)}
                    >
                      <option value="h264">H.264</option>
                      <option value="hevc">H.265 / HEVC</option>
                      <option value="vp9">VP9</option>
                      <option value="av1">AV1</option>
                      <option value="prores">Apple ProRes</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground/80">Audio Codec</label>
                    <select 
                      className="w-full bg-background border border-border rounded-md px-2 py-1 text-xs focus:outline-none focus:border-primary"
                      value={audioCodec}
                      onChange={e => setAudioCodec(e.target.value as AudioCodec)}
                    >
                      <option value="aac">AAC</option>
                      <option value="mp3">MP3</option>
                      <option value="wav">WAV</option>
                      <option value="none">No Audio</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-end">
                    <label className="text-xs font-medium text-foreground/80">Video Bitrate</label>
                    <div className="flex items-center gap-2">
                      <select 
                        className="bg-background border border-border rounded px-1 py-0.5 text-[10px]"
                        value={bitrateMode}
                        onChange={e => setBitrateMode(e.target.value as 'cbr' | 'vbr')}
                      >
                        <option value="vbr">VBR</option>
                        <option value="cbr">CBR</option>
                      </select>
                      <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded font-mono">
                        {(bitrate / 1000000).toFixed(1)} Mbps
                      </span>
                    </div>
                  </div>
                  <input 
                    type="range" 
                    className="w-full accent-primary" 
                    min="500000" max="200000000" step="500000"
                    value={bitrate}
                    onChange={e => setBitrate(Number(e.target.value))}
                  />
                </div>
              </div>
            )}

            <div className="bg-surface-hover rounded-lg p-4 flex flex-col space-y-1 border border-border/50 mt-4">
              <span className="text-xs text-foreground/50 uppercase font-semibold">Est. File Size (1 Min)</span>
              <span className="text-2xl font-bold font-mono">~{estSizeMB} MB</span>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="h-16 border-t border-border flex items-center justify-end px-6 gap-3 shrink-0 bg-surface">
          <button onClick={onClose} className="px-4 py-2 rounded-md hover:bg-surface-hover text-sm font-medium transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
          >
            <Download size={16} />
            Render Background Job
          </button>
        </div>

      </div>
    </div>
  );
}
