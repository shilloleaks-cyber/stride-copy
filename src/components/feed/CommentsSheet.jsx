import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { shortTimeAgo } from '@/components/utils/timeUtils';
import { X, Send, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { notifyPostCommented, notifyCommentReplied, notifyMentioned, extractMentions } from '@/lib/notifications';

export default function CommentsSheet({ open, onClose, post, currentUser, entityType = 'post', groupId }) {
  const [newComment, setNewComment] = useState('');
  // replyToComment: the comment being replied to { id, author_email, author_name }
  const [replyToComment, setReplyToComment] = useState(null);
  const queryClient = useQueryClient();
  const postId = post?.id;

  // Fetch group members for mention resolution (group posts only)
  const { data: groupMembers = [] } = useQuery({
    queryKey: ['groupMembers', groupId],
    queryFn: () => base44.entities.GroupMember.filter({ group_id: groupId, status: 'active' }),
    enabled: entityType === 'group' && !!groupId,
    staleTime: 60000,
  });

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async ({ queryKey }) => {
      const [, id] = queryKey;
      console.log('🔍 Fetching comments for post:', id);
      console.log('🔍 Filter query:', { post_id: id });
      const result = await base44.entities.Comment.filter({ post_id: id }, '-created_date');
      console.log('📦 Comments fetched:', result);
      console.log('📦 Comments count:', result?.length);
      return result;
    },
    enabled: !!postId && open,
  });

  // Real-time comment updates via WebSocket
  useEffect(() => {
    if (!open || !postId) return;

    const unsubscribe = base44.entities.Comment.subscribe((event) => {
      console.log('🔴 Real-time comment event:', event);

      // Only process comments for this post
      if (event.data?.post_id !== postId && event.type !== 'delete') return;

      if (event.type === 'create') {
        // Add new comment to cache
        queryClient.setQueryData(['comments', postId], (oldComments = []) => {
          return [event.data, ...oldComments];
        });
        // Update post comment count
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      } else if (event.type === 'update') {
        // Update existing comment
        queryClient.setQueryData(['comments', postId], (oldComments = []) => {
          return oldComments.map(c => c.id === event.id ? event.data : c);
        });
      } else if (event.type === 'delete') {
        // Remove deleted comment
        queryClient.setQueryData(['comments', postId], (oldComments = []) => {
          const filtered = oldComments.filter(c => c.id !== event.id);
          // Check if the deleted comment was for this post
          if (filtered.length !== oldComments.length) {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
          }
          return filtered;
        });
      }
    });

    return unsubscribe;
  }, [open, postId, queryClient]);

  const addCommentMutation = useMutation({
    mutationFn: async ({ content, replyTarget }) => {
      const newCommentData = await base44.entities.Comment.create({
        post_id: postId,
        content,
        author_name: currentUser?.full_name || 'Runner',
        author_email: currentUser?.email,
      });

      const nextCount = (post?.comments_count || 0) + 1;
      if (entityType === 'group') {
        await base44.entities.GroupPost.update(postId, { comments_count: nextCount });
      } else {
        await base44.entities.Post.update(postId, { comments_count: nextCount });
      }

      // Return enough context for onSuccess to fire notifications correctly
      return { newCommentData, content, replyTarget };
    },
    onSuccess: ({ content, replyTarget }) => {
      // Cache updates
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      if (entityType === 'group') {
        queryClient.setQueryData(['groupPosts', groupId], (old = []) =>
          old.map((p) => p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p)
        );
        queryClient.invalidateQueries({ queryKey: ['groupPosts', groupId] });
      } else {
        queryClient.setQueryData(['posts'], (old = []) =>
          old.map((p) => p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p)
        );
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      }

      const actorName = currentUser?.full_name || 'Someone';
      const preview = content.length > 80 ? content.slice(0, 80) + '…' : content;

      if (entityType !== 'group') {
        if (replyTarget) {
          // comment_replied: notify the original comment author (not self)
          if (replyTarget.author_email && replyTarget.author_email !== currentUser?.email) {
            notifyCommentReplied({
              user_email: replyTarget.author_email,
              actor_name: actorName,
              post_id: postId,
              reply_preview: preview,
            });
          }
        } else {
          // post_commented: notify the post author (not self)
          if (post?.author_email && post.author_email !== currentUser?.email) {
            notifyPostCommented({
              user_email: post.author_email,
              actor_name: actorName,
              post_id: postId,
              comment_preview: preview,
            });
          }
        }
      }

      // Detect @mentions in comment content (group posts: resolve via groupMembers)
      if (entityType === 'group' && groupMembers.length > 0) {
        const mentionTokens = extractMentions(content);
        if (mentionTokens.length > 0) {
          const seen = new Set();
          for (const m of groupMembers) {
            if (m.user_email === currentUser?.email) continue;
            const nameToken = m.user_name?.toLowerCase().replace(/\s+/g, '') || '';
            const emailToken = m.user_email?.toLowerCase().split('@')[0] || '';
            const matched = mentionTokens.some(t => t === nameToken || t === emailToken);
            if (matched && !seen.has(m.user_email)) {
              seen.add(m.user_email);
              notifyMentioned({
                user_email: m.user_email,
                actor_name: currentUser?.full_name || 'Someone',
                post_id: postId,
                context: content.trim().slice(0, 100),
              });
            }
          }
        }
      }

      setNewComment('');
      setReplyToComment(null);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId) => {
      await base44.entities.Comment.delete(commentId);

      const nextCount = Math.max(0, (post?.comments_count || 0) - 1);

      if (entityType === 'group') {
        await base44.entities.GroupPost.update(postId, { comments_count: nextCount });
      } else {
        await base44.entities.Post.update(postId, { comments_count: nextCount });
      }

      return commentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });

      if (entityType === 'group') {
        queryClient.setQueryData(['groupPosts', groupId], (old = []) =>
          old.map((p) => p.id === postId ? { ...p, comments_count: Math.max(0, (p.comments_count || 0) - 1) } : p)
        );
        queryClient.invalidateQueries({ queryKey: ['groupPosts', groupId] });
      } else {
        queryClient.setQueryData(['posts'], (old = []) =>
          old.map((p) => p.id === postId ? { ...p, comments_count: Math.max(0, (p.comments_count || 0) - 1) } : p)
        );
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      }
    },
  });



  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="commentsSheet">
        <SheetHeader className="pb-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <SheetTitle className="text-white text-center font-bold tracking-wide" style={{ letterSpacing: '0.05em' }}>
            Comments
          </SheetTitle>
        </SheetHeader>

        {/* Comments List */}
        <div className="commentsListArea" style={{ position: 'relative', zIndex: 1 }}>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--green)', borderTopColor: 'transparent' }} />
            </div>
          ) : comments.length > 0 ? (
            <AnimatePresence>
              {comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex gap-3 mb-4"
                >
                  <Avatar className="w-8 h-8 flex-shrink-0 commentAvatar">
                    <AvatarFallback className="text-xs bg-gradient-to-br from-purple-500 to-purple-700 text-white font-bold">
                      {getInitials(comment.author_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="commentBubble">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white">{comment.author_name}</p>
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>•</span>
                        <span 
                          className="text-[10px] whitespace-nowrap overflow-hidden" 
                          style={{ 
                            color: 'rgba(188, 19, 254, 0.6)', 
                            textShadow: '0 0 6px rgba(188, 19, 254, 0.17)',
                            maxWidth: '100px',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {shortTimeAgo(comment.created_date, 'th')}
                        </span>
                      </div>
                      <p className="text-sm text-white mt-1" style={{ lineHeight: '1.5' }}>{comment.content}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-1 px-2">
                      {comment.author_email !== currentUser?.email && (
                        <button
                          onClick={() => setReplyToComment({ id: comment.id, author_email: comment.author_email, author_name: comment.author_name })}
                          className="text-xs transition-colors"
                          style={{ color: 'rgba(191,255,0,0.6)' }}
                        >
                          ↩ Reply
                        </button>
                      )}
                      {comment.author_email === currentUser?.email && (
                        <button 
                          onClick={() => deleteCommentMutation.mutate(comment.id)}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          ลบ
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="commentsEmpty">
              <div className="emptyIcon">💬</div>
              <p className="emptyTitle">No comments yet</p>
              <p className="emptySubtext">Start the conversation</p>
            </div>
          )}
        </div>

        {/* Reply context banner */}
        {currentUser && replyToComment && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '6px 16px', background: 'rgba(191,255,0,0.06)',
            borderTop: '1px solid rgba(191,255,0,0.15)',
            fontSize: 12, color: 'rgba(191,255,0,0.8)',
          }}>
            <span>↩ Replying to <strong>{replyToComment.author_name}</strong></span>
            <button onClick={() => setReplyToComment(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
        )}

        {/* Input — only shown for authenticated users */}
        {!currentUser && (
          <div className="commentInputArea" style={{ justifyContent: 'center' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
              Sign in to leave a comment
            </p>
          </div>
        )}
        {currentUser && <form
          className="commentInputArea"
          style={{ 
            position: 'relative',
            zIndex: 100,
            pointerEvents: 'auto',
            background: 'rgba(10, 10, 10, 0.95)',
          }}
          onSubmit={(e) => {
            e.preventDefault();
            console.log("🔥 Form submitted");

            const text = newComment.trim();
            console.log("📝 Comment data:", { 
              text, 
              textLen: text.length, 
              isPending: addCommentMutation.isPending,
              disabled: !newComment.trim() || addCommentMutation.isPending
            });

            if (!text) {
              console.log("❌ Empty text, aborting");
              return;
            }
            
            if (addCommentMutation.isPending) {
              console.log("⏳ Already pending, aborting");
              return;
            }

            console.log("✅ Sending comment...");
            addCommentMutation.mutate({ content: text, replyTarget: replyToComment });
          }}
        >
          <Input
            value={newComment}
            onChange={(e) => {
              console.log("📥 Input changed:", e.target.value);
              setNewComment(e.target.value);
            }}
            placeholder="Write a comment..."
            className="commentInput"
            style={{ pointerEvents: 'auto' }}
          />

          <button
            type="submit"
            disabled={!newComment.trim() || addCommentMutation.isPending}
            className={`commentSendBtn ${addCommentMutation.isPending ? "sending" : ""}`}
            aria-label="Send comment"
            style={{ 
              pointerEvents: 'auto',
              position: 'relative',
              zIndex: 10,
              background: addCommentMutation.isPending ? 'rgba(191, 255, 0, 0.8)' : '#BFFF00',
            }}
            onClick={(e) => {
              console.log("🖱️ Button clicked", {
                disabled: !newComment.trim() || addCommentMutation.isPending,
                newComment: newComment,
                type: e.type
              });
            }}
          >
            {addCommentMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" style={{ pointerEvents: "none" }} />
            )}
          </button>
        </form>}
      </SheetContent>
    </Sheet>
  );
}