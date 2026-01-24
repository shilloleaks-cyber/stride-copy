import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { X, Image, MapPin, Clock, Flame, Zap, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CreatePostModal({ open, onClose, onSubmit, user }) {
  const [content, setContent] = useState('');
  const [selectedRunId, setSelectedRunId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: runs = [] } = useQuery({
    queryKey: ['myRuns'],
    queryFn: () => base44.entities.Run.filter({ created_by: user?.email }, '-start_time', 20),
    enabled: open && !!user?.email,
  });

  const completedRuns = runs.filter(r => r.status === 'completed');
  const selectedRun = completedRuns.find(r => r.id === selectedRunId);

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

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    
    const postData = {
      content: content.trim(),
      author_name: user?.full_name || 'Runner',
      author_email: user?.email,
      likes: [],
      comments_count: 0,
    };

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

    await onSubmit(postData);
    setContent('');
    setSelectedRunId('');
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">สร้างโพสต์ใหม่</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="แชร์ความรู้สึกเกี่ยวกับการวิ่งของคุณ..."
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 min-h-[120px] resize-none"
          />

          {/* Attach Run */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">แนบกิจกรรมวิ่ง (ไม่บังคับ)</label>
            <Select value={selectedRunId} onValueChange={setSelectedRunId}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="เลือกกิจกรรมวิ่ง" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-800">
                <SelectItem value={null} className="text-gray-400">ไม่แนบกิจกรรม</SelectItem>
                {completedRuns.map((run) => (
                  <SelectItem 
                    key={run.id} 
                    value={run.id}
                    className="text-white focus:bg-white/10 focus:text-white"
                  >
                    {format(new Date(run.start_time), 'd MMM yyyy')} - {run.distance_km?.toFixed(2)} กม.
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Run Preview */}
          {selectedRun && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-400">กิจกรรมที่เลือก</span>
              </div>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div>
                  <MapPin className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                  <p className="text-lg font-light text-white">{selectedRun.distance_km?.toFixed(2)}</p>
                  <p className="text-[10px] text-gray-500">กม.</p>
                </div>
                <div>
                  <Clock className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                  <p className="text-lg font-light text-white">{formatDuration(selectedRun.duration_seconds)}</p>
                  <p className="text-[10px] text-gray-500">เวลา</p>
                </div>
                <div>
                  <Zap className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                  <p className="text-lg font-light text-white">{formatPace(selectedRun.pace_min_per_km)}</p>
                  <p className="text-[10px] text-gray-500">/กม.</p>
                </div>
                <div>
                  <Flame className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                  <p className="text-lg font-light text-white">{selectedRun.calories_burned || 0}</p>
                  <p className="text-[10px] text-gray-500">kcal</p>
                </div>
              </div>
            </motion.div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button 
              variant="ghost" 
              onClick={onClose}
              className="text-gray-400"
            >
              ยกเลิก
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? 'กำลังโพสต์...' : 'โพสต์'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}