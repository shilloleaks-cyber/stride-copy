import React, { useState } from 'react';
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

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', post?.id],
    queryFn: () => base44.entities.Comment.filter({ post_id: post?.id }, '-created_date'),
    enabled: open && !!post?.id,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content) => {
      await base44.entities.Comment.create({
        post_id: post.id,
        content,
        author_name: currentUser?.full_name || 'Runner',
        author_email: currentUser?.email,
      });
      // Update comments count
      await base44.entities.Post.update(post.id, {
        comments_count: (post.comments_count || 0) + 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', post?.id]);
      queryClient.invalidateQueries(['posts']);
      setNewComment('');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId) => {
      await base44.entities.Comment.delete(commentId);
      await base44.entities.Post.update(post.id, {
        comments_count: Math.max(0, (post.comments_count || 1) - 1),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', post?.id]);
      queryClient.invalidateQueries(['posts']);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment.trim());
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="bg-gray-900 border-gray-800 h-[70vh] rounded-t-3xl">
        <SheetHeader className="pb-4 border-b border-white/10">
          <SheetTitle className="text-white text-center">ความคิดเห็น</SheetTitle>
        </SheetHeader>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 max-h-[calc(70vh-140px)]">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length > 0 ? (
            <AnimatePresence>
              {comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex gap-3"
                >
                  <Avatar className="w-8 h-8 flex-shrink-0 bg-gradient-to-br from-blue-400 to-blue-600">
                    <AvatarFallback className="text-xs bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                      {getInitials(comment.author_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-white/5 rounded-2xl px-4 py-2">
                      <p className="text-sm font-medium text-white">{comment.author_name}</p>
                      <p className="text-sm text-gray-300">{comment.content}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-1 px-2">
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(comment.created_date), { addSuffix: true, locale: th })}
                      </span>
                      {comment.author_email === currentUser?.email && (
                        <button 
                          onClick={() => deleteCommentMutation.mutate(comment.id)}
                          className="text-xs text-red-400 hover:text-red-300"
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
            <div className="text-center py-8">
              <p className="text-gray-500">ยังไม่มีความคิดเห็น</p>
              <p className="text-sm text-gray-600 mt-1">เป็นคนแรกที่แสดงความคิดเห็น!</p>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="pt-4 border-t border-white/10 flex gap-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="เขียนความคิดเห็น..."
            className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!newComment.trim() || addCommentMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}