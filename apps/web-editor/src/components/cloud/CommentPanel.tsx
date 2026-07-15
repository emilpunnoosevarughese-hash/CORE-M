import React, { useEffect, useState } from 'react';
import { useCommentStore } from '@corem/cloud';
import { useTimelineStore } from '@corem/timeline';
import { MessageSquare, Send, Check } from 'lucide-react';

export function CommentPanel({ projectId }: { projectId: string }) {
  const { comments, subscribeToComments, addComment, addReply, resolveComment } = useCommentStore();
  const [newComment, setNewComment] = useState('');
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const { playhead } = useTimelineStore();

  useEffect(() => {
    if (projectId) {
      return subscribeToComments(projectId);
    }
  }, [projectId, subscribeToComments]);

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addComment(projectId, playhead.currentFrame, newComment.trim());
    setNewComment('');
  };

  const handleReply = (commentId: string) => {
    const text = replyText[commentId];
    if (!text?.trim()) return;
    addReply(projectId, commentId, text.trim());
    setReplyText(s => ({ ...s, [commentId]: '' }));
  };

  const activeComments = comments.filter(c => !c.resolvedAt);
  const resolvedComments = comments.filter(c => c.resolvedAt);

  return (
    <div className="flex flex-col h-full bg-surface border-l border-border w-full shrink-0">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <MessageSquare size={16} /> Comments
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeComments.length === 0 && (
          <div className="text-center text-foreground/40 text-xs py-8">No open comments</div>
        )}
        
        {activeComments.map(c => (
          <div key={c.id} className="bg-background rounded-lg border border-border p-3 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-semibold text-xs">{c.authorName}</span>
                <span className="text-[10px] text-foreground/40 ml-2">
                  Frame {Math.floor(c.frame)}
                </span>
              </div>
              <button
                onClick={() => resolveComment(projectId, c.id)}
                className="p-1 hover:bg-surface-hover rounded text-green-500 transition-colors"
                title="Resolve"
              >
                <Check size={14} />
              </button>
            </div>
            
            <p className="text-xs">{c.text}</p>
            
            {/* Action Bar */}
            <div className="flex gap-2">
              <button
                onClick={() => useTimelineStore.setState(s => ({ playhead: { ...s.playhead, currentFrame: c.frame } }))}
                className="text-[10px] text-primary hover:underline"
              >
                Jump to frame
              </button>
            </div>

            {/* Replies */}
            {c.replies.length > 0 && (
              <div className="pl-3 border-l-2 border-border/50 space-y-2 mt-2">
                {c.replies.map(r => (
                  <div key={r.id}>
                    <span className="font-semibold text-[10px]">{r.authorName}</span>
                    <p className="text-[11px] text-foreground/80">{r.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Reply Input */}
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
              <input
                value={replyText[c.id] || ''}
                onChange={e => setReplyText(s => ({ ...s, [c.id]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleReply(c.id)}
                placeholder="Reply..."
                className="flex-1 bg-transparent text-[11px] text-foreground outline-none"
              />
              <button
                onClick={() => handleReply(c.id)}
                className="text-primary disabled:opacity-50"
                disabled={!replyText[c.id]?.trim()}
              >
                <Send size={12} />
              </button>
            </div>
          </div>
        ))}

        {resolvedComments.length > 0 && (
          <div className="pt-4 border-t border-border">
            <h4 className="text-xs text-foreground/50 mb-2">Resolved ({resolvedComments.length})</h4>
            {/* Show brief resolved list if needed */}
          </div>
        )}
      </div>

      {/* New Comment Input */}
      <div className="p-3 border-t border-border bg-surface-hover/30">
        <div className="text-[10px] text-foreground/50 mb-1">
          Add comment at frame {Math.floor(playhead.currentFrame)}
        </div>
        <div className="flex items-center gap-2 bg-background border border-border rounded-lg p-2 focus-within:border-primary transition-colors">
          <input
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddComment()}
            placeholder="Type a comment..."
            className="flex-1 bg-transparent text-xs text-foreground outline-none"
          />
          <button
            onClick={handleAddComment}
            disabled={!newComment.trim()}
            className="p-1.5 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
