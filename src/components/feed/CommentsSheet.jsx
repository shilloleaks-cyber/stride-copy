import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
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

export default function CommentsSheet({ open, onClose, post, currentUser }) {
  const [newComment, setNewComment] = useState('');
  const queryClient = useQueryClient();
  const postId = post?.id;

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
    mutationFn: async (content) => {
      console.log('🚀 Creating comment for post:', postId);
      const newCommentData = await base44.entities.Comment.create({
        post_id: postId,
        content,
        author_name: currentUser?.full_name || 'Runner',
        author_email: currentUser?.email,
      });
      console.log('✅ Comment created:', newCommentData);
      // Update comments count
      await base44.entities.Post.update(postId, {
        comments_count: (post.comments_count || 0) + 1,
      });
      return newCommentData;
    },
    onSuccess: (data) => {
      console.log('🎉 Comment mutation success, invalidating queries');
      console.log('📅 NEW COMMENT CREATED_DATE:', data?.created_date);
      console.log('📦 FULL NEW COMMENT DATA:', data);
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setNewComment('');
    },
    onError: (err) => {
      console.log('❌ ADD COMMENT ERROR', err);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId) => {
      await base44.entities.Comment.delete(commentId);
      await base44.entities.Post.update(postId, {
        comments_count: Math.max(0, (post.comments_count || 1) - 1),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
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
                      <p className="text-sm font-bold text-white">{comment.author_name}</p>
                      <p className="text-sm text-white mt-1" style={{ lineHeight: '1.5' }}>{comment.content}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-1 px-2">
                      <span className="text-xs" style={{ color: 'var(--muted)' }}>
                        {formatDistanceToNow(new Date(comment.created_date), { addSuffix: true, locale: th })}
                      </span>
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

        {/* Input */}
        <form
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
            addCommentMutation.mutate(text);
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
        </form>
      </SheetContent>
    </Sheet>
  );
}