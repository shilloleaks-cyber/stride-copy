import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import { 
  Heart, MessageCircle, Share2, MoreHorizontal, 
  MapPin, Clock, Flame, Zap, Trash2 
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PostCard({ 
  post, 
  currentUserEmail, 
  onLike, 
  onComment, 
  onDelete,
  onViewComments 
}) {
  const isLiked = post.likes?.includes(currentUserEmail);
  const likesCount = post.likes?.length || 0;

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPace = (pace) => {
    if (!pace || pace === 0) return '--:--';
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600">
            <AvatarFallback className="text-sm bg-gradient-to-br from-emerald-400 to-emerald-600 text-white">
              {getInitials(post.author_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-white">{post.author_name}</p>
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(post.created_date), { addSuffix: true, locale: th })}
            </p>
          </div>
        </div>
        
        {post.author_email === currentUserEmail && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-900 border-gray-800">
              <DropdownMenuItem 
                onClick={() => onDelete(post.id)}
                className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                ลบโพสต์
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-gray-200 whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Run Data Card */}
      {post.run_data && (
        <div className="mx-4 mb-4 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🏃‍♂️</span>
            <span className="text-sm text-emerald-400 font-medium">กิจกรรมวิ่ง</span>
          </div>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                <MapPin className="w-3 h-3" />
              </div>
              <p className="text-lg font-light text-white">{post.run_data.distance_km?.toFixed(2)}</p>
              <p className="text-[10px] text-gray-500">กม.</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                <Clock className="w-3 h-3" />
              </div>
              <p className="text-lg font-light text-white">{formatDuration(post.run_data.duration_seconds)}</p>
              <p className="text-[10px] text-gray-500">เวลา</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                <Zap className="w-3 h-3" />
              </div>
              <p className="text-lg font-light text-white">{formatPace(post.run_data.pace_min_per_km)}</p>
              <p className="text-[10px] text-gray-500">/กม.</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                <Flame className="w-3 h-3" />
              </div>
              <p className="text-lg font-light text-white">{post.run_data.calories_burned || 0}</p>
              <p className="text-[10px] text-gray-500">kcal</p>
            </div>
          </div>
        </div>
      )}

      {/* Image */}
      {post.image_url && (
        <div className="px-4 pb-4">
          <img 
            src={post.image_url} 
            alt="Post image" 
            className="w-full rounded-xl object-cover max-h-80"
          />
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t border-white/5 flex items-center gap-6">
        <button 
          onClick={() => onLike(post.id, isLiked)}
          className="flex items-center gap-2 transition-colors"
        >
          <Heart 
            className={`w-5 h-5 transition-colors ${isLiked ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-400'}`} 
          />
          <span className={`text-sm ${isLiked ? 'text-red-500' : 'text-gray-400'}`}>
            {likesCount > 0 ? likesCount : ''}
          </span>
        </button>
        
        <button 
          onClick={() => onViewComments(post)}
          className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm">{post.comments_count > 0 ? post.comments_count : ''}</span>
        </button>
      </div>
    </motion.div>
  );
}