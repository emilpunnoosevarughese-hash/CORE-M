import React, { useState } from 'react';
import { useShareStore } from '@corem/cloud';
import { X, Copy, Check, Link, UserPlus } from 'lucide-react';

export function ShareModal({ projectId, onClose }: { projectId: string; onClose: () => void; isOpen?: boolean }) {
  const { createShareLink } = useShareStore();
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  
  const [inviteId, setInviteId] = useState('');
  const [inviteSent, setInviteSent] = useState(false);

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

  const handleInvite = () => {
    if (!inviteId) return;
    // Mock invite functionality for now
    setInviteSent(true);
    setTimeout(() => {
      setInviteSent(false);
      setInviteId('');
    }, 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-xl w-full max-w-md p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-foreground/50 hover:text-foreground">
          <X size={18} />
        </button>
        
        <h2 className="text-xl font-bold mb-2">Share Project</h2>
        <p className="text-sm text-foreground/60 mb-6">Create a link or invite a teammate directly via their Profile ID.</p>
        
        <div className="space-y-6">
          {/* Invite by ID Section */}
          <div className="bg-background/50 border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3">Invite Teammate</h3>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={inviteId}
                onChange={(e) => setInviteId(e.target.value)}
                placeholder="Paste Teammate's Profile ID..."
                className="flex-1 bg-background border border-border rounded-md px-3 text-sm outline-none focus:border-primary/50"
              />
              <button 
                onClick={handleInvite}
                disabled={!inviteId}
                className="px-4 py-2 bg-primary/20 text-primary rounded-md text-sm font-semibold hover:bg-primary/30 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {inviteSent ? <Check size={16} /> : <UserPlus size={16} />}
                {inviteSent ? 'Invited' : 'Invite'}
              </button>
            </div>
          </div>

          <div className="border-t border-border/50 pt-4">
            <h3 className="text-sm font-semibold mb-3">Share via Link</h3>
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
                  {loading ? 'Generating...' : 'Get Link'}
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
      </div>
    </div>
  );
}
