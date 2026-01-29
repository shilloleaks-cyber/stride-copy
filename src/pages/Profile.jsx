import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  ArrowLeft, Share2, User, MapPin, Clock, Flame, Heart, 
  Award, Calendar, TrendingUp, Facebook, Copy, Check,
  Settings, LogOut, Trophy, Target, Users, Edit3, Palette, Wallet
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import SkinsShop from '@/components/skins/SkinsShop';
import PersonalBestsSection from '@/components/profile/PersonalBestsSection';
import AchievementBadgesSection from '@/components/profile/AchievementBadgesSection';
import RunningHistorySection from '@/components/profile/RunningHistorySection';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function Profile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [editBioOpen, setEditBioOpen] = useState(false);
  const [bio, setBio] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSkins, setShowSkins] = useState(false);

  const { data: user, refetch: refetchUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: follows = [] } = useQuery({
    queryKey: ['follows', user?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: followers = [] } = useQuery({
    queryKey: ['followers', user?.email],
    queryFn: () => base44.entities.Follow.filter({ following_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: myParticipations = [] } = useQuery({
    queryKey: ['myParticipations', user?.email],
    queryFn: () => base44.entities.ChallengeParticipant.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const completedChallenges = myParticipations.filter(p => p.is_completed);

  React.useEffect(() => {
    if (user?.bio) setBio(user.bio);
  }, [user?.bio]);

  const handleSaveBio = async () => {
    await base44.auth.updateMe({ bio });
    refetchUser();
    setEditBioOpen(false);
    toast.success('บันทึกสำเร็จ!');
  };

  const { data: runs = [] } = useQuery({
    queryKey: ['runs'],
    queryFn: () => base44.entities.Run.list('-start_time', 500),
  });

  const completedRuns = runs.filter(r => r.status === 'completed');

  // Stats
  const stats = {
    totalDistance: completedRuns.reduce((sum, r) => sum + (r.distance_km || 0), 0),
    totalTime: completedRuns.reduce((sum, r) => sum + (r.duration_seconds || 0), 0),
    totalCalories: completedRuns.reduce((sum, r) => sum + (r.calories_burned || 0), 0),
    totalRuns: completedRuns.length,
    avgPace: completedRuns.length > 0 
      ? completedRuns.reduce((sum, r) => sum + (r.pace_min_per_km || 0), 0) / completedRuns.length 
      : 0,
  };

  // Personal bests
  const longestRun = completedRuns.reduce((max, r) => (r.distance_km || 0) > (max?.distance_km || 0) ? r : max, null);
  const fastestPace = completedRuns.filter(r => r.pace_min_per_km > 0).reduce((min, r) => 
    (r.pace_min_per_km || Infinity) < (min?.pace_min_per_km || Infinity) ? r : min, null);

  const formatDuration = (seconds) => {
    if (!seconds) return '0 ชม.';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours} ชม. ${mins} นาที`;
    return `${mins} นาที`;
  };

  const formatPace = (pace) => {
    if (!pace || pace === 0) return '--:--';
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate share text for Facebook
  const generateShareText = () => {
    const text = `🏃‍♂️ สถิติการวิ่งของฉัน

📍 ระยะทางรวม: ${stats.totalDistance.toFixed(1)} กม.
⏱️ เวลารวม: ${formatDuration(stats.totalTime)}
🔥 แคลอรี่ที่เผาผลาญ: ${stats.totalCalories.toLocaleString()} kcal
🏅 จำนวนครั้งที่วิ่ง: ${stats.totalRuns} ครั้ง
${longestRun ? `\n🏆 ระยะทางไกลที่สุด: ${longestRun.distance_km?.toFixed(2)} กม.` : ''}
${fastestPace && fastestPace.pace_min_per_km > 0 ? `⚡ เพซเร็วที่สุด: ${formatPace(fastestPace.pace_min_per_km)} /กม.` : ''}

#Running #RunningStats #HealthyLifestyle`;
    return text;
  };

  const handleShareToFacebook = () => {
    const text = encodeURIComponent(generateShareText());
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?quote=${text}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    setShareDialogOpen(false);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateShareText());
    setCopied(true);
    toast.success('คัดลอกข้อความแล้ว!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen text-white pb-24" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Header */}
      <div className="px-6 pt-6 flex items-center justify-between">
        <button 
          onClick={() => navigate(createPageUrl('Home'))}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-medium">โปรไฟล์</h1>
        <button 
          onClick={handleLogout}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-red-400"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pt-8 pb-6 text-center"
      >
        <ProfileAvatar 
          user={user} 
          size="lg" 
          editable 
          onImageUpdate={() => refetchUser()}
          className="mx-auto mb-4"
        />
        <h2 className="text-2xl font-light neon-text">{user?.full_name || 'Runner'}</h2>
        <p className="text-gray-500 text-sm mt-1">{user?.email}</p>
        
        {/* Bio */}
        <div className="mt-3">
          {editBioOpen ? (
            <div className="space-y-2">
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="เขียนเกี่ยวกับตัวคุณ..."
                className="bg-white/5 border-emerald-500/30 text-white placeholder:text-gray-500 text-sm"
                rows={2}
              />
              <div className="flex justify-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => setEditBioOpen(false)} className="text-gray-400">
                  ยกเลิก
                </Button>
                <Button size="sm" onClick={handleSaveBio} className="bg-emerald-600 hover:bg-emerald-700">
                  บันทึก
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setEditBioOpen(true)}
              className="text-sm text-gray-400 hover:text-emerald-400 transition-colors flex items-center justify-center gap-1 mx-auto"
            >
              {user?.bio || 'เพิ่มคำอธิบาย'}
              <Edit3 className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Follow Stats */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="text-center">
            <p className="text-lg font-medium text-white">{followers.length}</p>
            <p className="text-xs text-gray-500">ผู้ติดตาม</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-white">{follows.length}</p>
            <p className="text-xs text-gray-500">กำลังติดตาม</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-emerald-400">{completedChallenges.length}</p>
            <p className="text-xs text-gray-500">Challenge</p>
          </div>
        </div>
        
        {/* Share Button */}
        <Button 
          onClick={() => setShareDialogOpen(true)}
          className="mt-6 bg-emerald-600 hover:bg-emerald-700 neon-glow"
        >
          <Share2 className="w-4 h-4 mr-2" />
          แชร์สถิติการวิ่ง
        </Button>
      </motion.div>

      {/* Quick Stats */}
      <div className="px-6 mb-6">
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-3xl p-6 neon-border">
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <MapPin className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <p className="text-3xl font-light text-white">{stats.totalDistance.toFixed(1)}</p>
              <p className="text-xs text-gray-400 mt-1">กิโลเมตร</p>
            </div>
            <div className="text-center">
              <Calendar className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <p className="text-3xl font-light text-white">{stats.totalRuns}</p>
              <p className="text-xs text-gray-400 mt-1">ครั้งที่วิ่ง</p>
            </div>
            <div className="text-center">
              <Flame className="w-6 h-6 text-orange-400 mx-auto mb-2" />
              <p className="text-3xl font-light text-white">{(stats.totalCalories / 1000).toFixed(1)}k</p>
              <p className="text-xs text-gray-400 mt-1">แคลอรี่</p>
            </div>
            <div className="text-center">
              <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-3xl font-light text-white">{Math.floor(stats.totalTime / 3600)}</p>
              <p className="text-xs text-gray-400 mt-1">ชั่วโมง</p>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Bests */}
      <PersonalBestsSection runs={runs} />

      {/* Quick Actions */}
      <div className="px-6 mb-6 space-y-3">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <button
            onClick={() => setShowSkins(true)}
            className="w-full p-4 bg-gradient-to-r from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-2xl hover:bg-purple-500/30 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Customize</p>
                  <p className="text-xs text-gray-400">Routes, Coins, Badges & Themes</p>
                </div>
              </div>
              <span className="text-xl">🎨</span>
            </div>
          </button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <button
            onClick={() => navigate(createPageUrl('HealthConnect'))}
            className="w-full p-4 bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-2xl hover:bg-emerald-500/30 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/30 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-white font-medium">Health Connect</p>
                  <p className="text-xs text-gray-400">
                    {user?.health_platform_connected && user.health_platform_connected !== 'none' 
                      ? `Connected: ${user.health_platform_connected}` 
                      : 'Connect health platforms'}
                  </p>
                </div>
              </div>
              {user?.health_sync_enabled && (
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </div>
          </button>
        </motion.div>
      </div>

      {/* Achievement Badges */}
      <AchievementBadgesSection stats={stats} />

      {/* Running History */}
      <RunningHistorySection runs={runs} />

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">แชร์สถิติการวิ่ง</DialogTitle>
          </DialogHeader>
          
          {/* Preview Card */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 rounded-2xl p-5 my-4">
            <div className="text-center mb-4">
              <span className="text-4xl">🏃‍♂️</span>
              <h3 className="text-lg font-medium mt-2">สถิติการวิ่งของฉัน</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span className="text-gray-400">ระยะทาง:</span>
                <span className="text-white">{stats.totalDistance.toFixed(1)} กม.</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-gray-400">เวลา:</span>
                <span className="text-white">{Math.floor(stats.totalTime / 3600)} ชม.</span>
              </div>
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-gray-400">แคลอรี่:</span>
                <span className="text-white">{stats.totalCalories.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span className="text-gray-400">วิ่ง:</span>
                <span className="text-white">{stats.totalRuns} ครั้ง</span>
              </div>
            </div>
          </div>

          {/* Share Options */}
          <div className="space-y-3">
            <Button 
              onClick={handleShareToFacebook}
              className="w-full bg-[#1877F2] hover:bg-[#166FE5] h-12"
            >
              <Facebook className="w-5 h-5 mr-2" />
              แชร์ไปยัง Facebook
            </Button>
            
            <Button 
              onClick={handleCopyText}
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10 h-12"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 mr-2 text-emerald-400" />
                  คัดลอกแล้ว!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 mr-2" />
                  คัดลอกข้อความ
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Skins Dialog */}
      <Dialog open={showSkins} onOpenChange={setShowSkins}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-400" />
              Customize Your Look
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="route" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white/5">
              <TabsTrigger value="route">Routes</TabsTrigger>
              <TabsTrigger value="coin">Coins</TabsTrigger>
              <TabsTrigger value="badge">Badges</TabsTrigger>
              <TabsTrigger value="theme">Themes</TabsTrigger>
            </TabsList>
            <TabsContent value="route" className="mt-4">
              <SkinsShop user={user} skinType="route" />
            </TabsContent>
            <TabsContent value="coin" className="mt-4">
              <SkinsShop user={user} skinType="coin" />
            </TabsContent>
            <TabsContent value="badge" className="mt-4">
              <SkinsShop user={user} skinType="badge" />
            </TabsContent>
            <TabsContent value="theme" className="mt-4">
              <SkinsShop user={user} skinType="theme" />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}