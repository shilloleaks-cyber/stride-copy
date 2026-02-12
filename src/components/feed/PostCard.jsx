import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import { 
  Heart, MessageCircle, Share2, MoreHorizontal, 
  MapPin, Clock, Flame, Zap, Trash2 
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  onViewComments,
  isGroupPost = false
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

  const formatPace = (pace, distance, duration) => {
    // Prevent unrealistic pace values
    if (!distance || distance <= 0 || !duration || duration <= 0) {
      return '--:--';
    }
    
    if (!pace || pace === 0 || !isFinite(pace)) return '--:--';
    
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    
    if (secs === 60) {
      return `${mins + 1}:00`;
    }
    
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="feedCard"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="feedAvatarGlow">
            <Avatar className="w-12 h-12">
              {post.author_image ? (
                <AvatarImage src={post.author_image} alt={post.author_name} className="object-cover" />
              ) : null}
              <AvatarFallback className="text-sm bg-gradient-to-br from-purple-500 to-purple-700 text-white font-bold">
                {getInitials(post.author_name)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div>
            <p className="font-bold text-white">{post.author_name}</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {post.created_date ? formatDistanceToNow(new Date(post.created_date), { addSuffix: true, locale: th }) : 'เมื่อสักครู่'}
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
        <p className="text-white whitespace-pre-wrap" style={{ lineHeight: '1.6' }}>{post.content}</p>
      </div>

      {/* Run Data Card */}
      {post.run_data && (
        <div className="eventGlassBox">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🏃‍♂️</span>
            <span className="text-sm font-bold" style={{ color: 'var(--green)' }}>กิจกรรมวิ่ง</span>
          </div>
          <div className="eventGrid">
            <div className="eventStat">
              <div className="flex items-center justify-center gap-1 mb-1" style={{ color: 'var(--muted)' }}>
                <MapPin className="w-3 h-3" />
              </div>
              <p className="eventVal" style={{ color: 'var(--green)' }}>
                {post.run_data.distance_km?.toFixed(2) || '0.00'}
              </p>
              <p className="eventLbl">กม.</p>
            </div>
            <div className="eventStat">
              <div className="flex items-center justify-center gap-1 mb-1" style={{ color: 'var(--muted)' }}>
                <Clock className="w-3 h-3" />
              </div>
              <p className="eventVal">
                {formatDuration(post.run_data.duration_seconds)}
              </p>
              <p className="eventLbl">เวลา</p>
            </div>
            <div className="eventStat">
              <div className="flex items-center justify-center gap-1 mb-1" style={{ color: 'var(--muted)' }}>
                <Zap className="w-3 h-3" />
              </div>
              <p 
                className="eventVal" 
                style={{ 
                  color: !post.run_data.distance_km || post.run_data.distance_km <= 0 || !post.run_data.duration_seconds || post.run_data.duration_seconds <= 0 
                    ? 'var(--muted)' 
                    : 'var(--green)' 
                }}
              >
                {formatPace(post.run_data.pace_min_per_km, post.run_data.distance_km, post.run_data.duration_seconds)}
              </p>
              <p className="eventLbl">/กม.</p>
            </div>
            <div className="eventStat">
              <div className="flex items-center justify-center gap-1 mb-1" style={{ color: 'var(--muted)' }}>
                <Flame className="w-3 h-3" />
              </div>
              <p className="eventVal">
                {post.run_data.calories_burned || 0}
              </p>
              <p className="eventLbl">kcal</p>
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
            className="w-full rounded-xl object-cover max-h-80 feedGlassPanel"
          />
        </div>
      )}

      {/* Video */}
      {post.video_url && (
        <div className="px-4 pb-4">
          <video 
            src={post.video_url} 
            controls
            className="w-full rounded-xl object-cover max-h-80 feedGlassPanel"
          />
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t flex items-center gap-6" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <button 
          onClick={() => onLike(post.id, isLiked)}
          className="flex items-center gap-2 transition-colors"
        >
          <Heart 
            className={`w-5 h-5 transition-colors ${isLiked ? 'text-red-500 fill-red-500' : 'hover:text-red-400'}`}
            style={{ color: isLiked ? undefined : 'var(--muted)' }}
          />
          <span className={`text-sm ${isLiked ? 'text-red-500' : ''}`} style={{ color: isLiked ? undefined : 'var(--muted)' }}>
            {likesCount > 0 ? likesCount : ''}
          </span>
        </button>
        
        <button 
          onClick={() => onViewComments(post)}
          className="flex items-center gap-2 transition-colors"
          style={{ color: 'var(--muted)' }}
        >
          <MessageCircle className="w-5 h-5 hover:opacity-70" />
          <span className="text-sm">{post.comments_count > 0 ? post.comments_count : ''}</span>
        </button>
      </div>
    </motion.div>
  );
}