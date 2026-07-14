import React, { useState } from 'react';
import { useShareStore } from '@corem/cloud';
import { X, Copy, Check, Link } from 'lucide-react';

export function ShareModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { createShareLink } = useShareStore();
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const linkId = await createShareLink(projectId, isPublic);
      const url = `${window.location.origin}/share/${linkId}`;
      setShareUrl(url);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-surface border border-border rounded-xl w-full max-w-sm p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-foreground/50 hover:text-foreground">
          <X size={18} />
        </button>
        
        <h2 className="text-xl font-bold mb-2">Share Project</h2>
        <p className="text-sm text-foreground/60 mb-6">Create a link to collaborate with others.</p>
        
        {!shareUrl ? (
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="accent-primary" />
              Anyone with link can view & comment
            </label>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate Link'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 bg-background border border-border rounded-lg p-2">
              <Link size={16} className="text-foreground/40 shrink-0 ml-1" />
              <input
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent text-xs outline-none"
              />
              <button
                onClick={handleCopy}
                className="p-1.5 hover:bg-surface-hover rounded transition-colors text-foreground/80"
              >
                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
