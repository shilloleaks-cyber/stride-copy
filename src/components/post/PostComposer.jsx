import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Send, Paperclip, X, MapPin, Clock, Zap, Flame, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * PostComposer — shared post creation UI
 * mode="feed"  → posts to Post entity, calls onSubmit(postData)
 * mode="group" → posts to GroupPost entity directly (groupId required)
 */
export default function PostComposer({ mode = 'feed', groupId, user, onSubmit, onSuccess }) {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [selectedRunId, setSelectedRunId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mediaInputRef = useRef(null);

  const { data: runs = [] } = useQuery({
    queryKey: ['myRuns', user?.email],
    queryFn: () => base44.entities.Run.filter({ created_by: user?.email }, '-start_time', 20),
    enabled: mode === 'feed' && !!user?.email,
  });

  const completedRuns = runs.filter(r => r.status === 'completed');
  const selectedRun = completedRuns.find(r => r.id === selectedRunId);

  const formatDuration = (s) => {
    if (!s) return '--:--';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const formatPace = (pace) => {
    if (!pace) return '--:--';
    const m = Math.floor(pace);
    const s = Math.round((pace - m) * 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const onPickMedia = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const maxMB = f.type.startsWith('video/') ? 60 : 10;
    if (f.size > maxMB * 1024 * 1024) return;
    setMediaFile(f);
    setMediaPreview(URL.createObjectURL(f));
  };

  const clearMedia = () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaPreview(null);
    setMediaFile(null);
    setImageUrl('');
    setVideoUrl('');
    if (mediaInputRef.current) mediaInputRef.current.value = '';
  };

  const canPost = (content.trim() || mediaFile || imageUrl || videoUrl) && !isSubmitting;

  const handleSubmit = async () => {
    if (!canPost) return;
    setIsSubmitting(true);

    try {
      if (mode === 'group') {
        let uploadedImageUrl = null;
        let uploadedVideoUrl = null;
        if (mediaFile) {
          const uploaded = await base44.integrations.Core.UploadFile({ file: mediaFile });
          const url = uploaded?.file_url ?? null;
          if (!url) throw new Error('Upload failed');
          if (mediaFile.type.startsWith('video/')) uploadedVideoUrl = url;
          else uploadedImageUrl = url;
        }

        const postData = {
          group_id: groupId,
          author_email: user?.email || '',
          author_name: user?.full_name || 'Runner',
          author_image: user?.profile_image || '',
          content: content.trim() || '',
          image_url: uploadedImageUrl,
          video_url: uploadedVideoUrl,
          likes: [],
          comments_count: 0,
        };

        await base44.entities.GroupPost.create(postData);
        base44.functions.invoke('awardActivityCoins', { activityType: 'group_post' });

      } else {
        // feed mode — caller provides onSubmit
        let uploadedImageUrl = imageUrl || null;
        let uploadedVideoUrl = videoUrl || null;
        if (mediaFile) {
          const uploaded = await base44.integrations.Core.UploadFile({ file: mediaFile });
          const url = uploaded?.file_url ?? null;
          if (!url) throw new Error('Upload failed');
          if (mediaFile.type.startsWith('video/')) uploadedVideoUrl = url;
          else uploadedImageUrl = url;
        }

        const postData = {
          content: content.trim(),
          author_name: user?.full_name || 'Runner',
          author_email: user?.email,
          author_image: user?.profile_image || '',
          likes: [],
          comments_count: 0,
        };
        if (uploadedImageUrl) postData.image_url = uploadedImageUrl;
        if (uploadedVideoUrl) postData.video_url = uploadedVideoUrl;
        if (selectedRun) {
          postData.run_id = selectedRun.id;
          postData.run_data = {
            distance_km: selectedRun.distance_km,
            duration_seconds: selectedRun.duration_seconds,
            pace_min_per_km: selectedRun.pace_min_per_km,
            calories_burned: selectedRun.calories_burned,
            avg_heart_rate: selectedRun.avg_heart_rate,
          };
        }
        if (onSubmit) await onSubmit(postData);
      }

      // Reset
      setContent('');
      setSelectedRunId('');
      clearMedia();
      if (onSuccess) onSuccess();

    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
      {/* Author row */}
      <div className="flex gap-3 p-4">
        <Avatar className="w-10 h-10 flex-shrink-0">
          {user?.profile_image && <AvatarImage src={user.profile_image} />}
          <AvatarFallback className="text-white text-sm font-semibold" style={{ background: 'linear-gradient(135deg, #8A2BE2, #BFFF00)' }}>
            {user?.full_name?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={mode === 'group' ? 'Share with the group...' : 'แชร์ความรู้สึกเกี่ยวกับการวิ่งของคุณ...'}
            rows={2}
            className="w-full rounded-xl px-4 py-3 text-sm text-white resize-none outline-none border border-white/10 placeholder:text-gray-500 bg-black focus:border-white/25 transition-colors"
            style={{ fontFamily: 'inherit' }}
          />

          {/* Media preview */}
          {mediaPreview && (
            <div className="relative mt-2 rounded-xl overflow-hidden">
              {mediaFile?.type?.startsWith('video/') ? (
                <video src={mediaPreview} controls playsInline className="w-full rounded-xl max-h-48 object-cover" />
              ) : (
                <img src={mediaPreview} alt="preview" className="w-full rounded-xl max-h-48 object-cover" />
              )}
              <button
                onClick={clearMedia}
                className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          )}

          {/* Run selector (feed only) */}
          {mode === 'feed' && completedRuns.length > 0 && (
            <div className="mt-3">
              <Select value={selectedRunId} onValueChange={setSelectedRunId}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm h-9">
                  <SelectValue placeholder="แนบกิจกรรมวิ่ง (ไม่บังคับ)" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800">
                  <SelectItem value={null} className="text-gray-400">ไม่แนบกิจกรรม</SelectItem>
                  {completedRuns.map((run) => (
                    <SelectItem key={run.id} value={run.id} className="text-white focus:bg-white/10">
                      {format(new Date(run.start_time), 'd MMM yyyy')} — {run.distance_km?.toFixed(2)} กม.
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Selected run preview */}
          {selectedRun && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 rounded-xl p-3 border border-white/10"
              style={{ backgroundColor: 'rgba(191,255,0,0.06)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-3 h-3" style={{ color: '#BFFF00' }} />
                <span className="text-xs" style={{ color: '#BFFF00' }}>กิจกรรมที่เลือก</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { icon: MapPin, val: selectedRun.distance_km?.toFixed(2), lbl: 'กม.' },
                  { icon: Clock, val: formatDuration(selectedRun.duration_seconds), lbl: 'เวลา' },
                  { icon: Zap, val: formatPace(selectedRun.pace_min_per_km), lbl: '/กม.' },
                  { icon: Flame, val: selectedRun.calories_burned || 0, lbl: 'kcal' },
                ].map(({ icon: Icon, val, lbl }) => (
                  <div key={lbl}>
                    <Icon className="w-3 h-3 text-gray-400 mx-auto mb-1" />
                    <p className="text-sm font-light text-white">{val}</p>
                    <p className="text-[10px] text-gray-500">{lbl}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-2 px-4 pb-4">
        {/* Hidden file input */}
        <input
          ref={mediaInputRef}
          type="file"
          accept="image/*,video/*"
          className="sr-only"
          onChange={onPickMedia}
        />

        <button
          type="button"
          onClick={() => mediaInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-400 border border-white/10 transition-colors hover:bg-purple-500/20 hover:text-white"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
        >
          <Paperclip className="w-4 h-4" />
          Media
        </button>

        <div className="flex-1" />

        <button
          type="submit"
          disabled={!canPost || isSubmitting}
          onClick={handleSubmit}
          className="inline-flex items-center justify-center gap-2 min-w-[132px] h-11 rounded-xl px-4 font-medium transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#BFFF00', color: '#0A0A0A' }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Posting...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Post</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}