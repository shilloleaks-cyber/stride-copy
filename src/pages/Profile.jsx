import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  ArrowLeft, Share2, User, MapPin, Clock, Flame, Heart, 
  Award, Calendar, TrendingUp, Facebook, Copy, Check,
  Settings, LogOut, Trophy, Target, Users, Edit3, Palette, Wallet, Trash2
} from 'lucide-react';
import UserCard from '@/components/feed/UserCard';
import { useMutation } from '@tanstack/react-query';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import SkinsShop from '@/components/skins/SkinsShop';
import AchievementBadgesSection from '@/components/profile/AchievementBadgesSection';
import SettingsSheet from '@/components/profile/SettingsSheet';
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
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [activeFollowTab, setActiveFollowTab] = useState('following');
  const [followSheetOpen, setFollowSheetOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

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

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const followingEmails = follows.map(f => f.following_email);
  const followerEmails = followers.map(f => f.follower_email);

  const followingUsers = allUsers.filter(u => followingEmails.includes(u.email));
  const followerUsers = allUsers.filter(u => followerEmails.includes(u.email));

  const getUserStats = () => ({ totalDistance: 0, totalRuns: 0 });

  const followMutation = useMutation({
    mutationFn: async (targetEmail) => {
      await base44.entities.Follow.create({
        follower_email: user?.email,
        following_email: targetEmail,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['follows']);
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async (targetEmail) => {
      const follow = follows.find(f => f.following_email === targetEmail);
      if (follow) {
        await base44.entities.Follow.delete(follow.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['follows']);
    },
  });

  const handleFollow = (email) => {
    followMutation.mutate(email);
  };

  const handleUnfollow = (email) => {
    unfollowMutation.mutate(email);
  };

  const { data: myParticipations = [] } = useQuery({
    queryKey: ['myParticipations', user?.email],
    queryFn: () => base44.entities.ChallengeParticipant.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const completedChallenges = myParticipations.filter(p => p.is_completed);

  // Fetch achievements from entity with auto-seed
  const { data: rawAchievements = [], refetch: refetchAchievements } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => base44.entities.Achievement.list('display_order', 100),
  });

  // Auto-seed achievements if empty or incomplete
  React.useEffect(() => {
    const seedIfNeeded = async () => {
      if (rawAchievements.length !== 8 && user) {
        try {
          await base44.functions.invoke('seedAchievements', {});
          await refetchAchievements();
        } catch (error) {
          console.log('Could not seed achievements:', error);
        }
      }
    };
    seedIfNeeded();
  }, [rawAchievements.length, user]);

  // Sort achievements by display_order (fixed order)
  const achievements = React.useMemo(() => {
    return [...rawAchievements].sort((a, b) => 
      (a.display_order || 0) - (b.display_order || 0)
    );
  }, [rawAchievements]);

  React.useEffect(() => {
    if (user?.bio) setBio(user.bio);
  }, [user?.bio]);

  const handleSaveBio = async () => {
    await base44.auth.updateMe({ bio });
    refetchUser();
    setEditBioOpen(false);
    toast.success('บันทึกสำเร็จ!');
  };

  // Stats derived from user object only (no runs queries)
  const stats = {
    totalDistance: 0,
    totalTime: 0,
    totalCalories: 0,
    totalRuns: 0,
    avgPace: 0,
  };
  const runs = [];
  const completedRuns = [];
  const longestRun = null;
  const fastestPace = null;

  const formatDuration = (seconds) => {
    if (!seconds) return '0 ชม.';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours} ชม. ${mins} นาที`;
    return `${mins} นาที`;
  };

  const formatPace = (pace) => {
    const numericPace = Number(pace);
    if (!Number.isFinite(numericPace) || numericPace <= 0) return '--:--';

    const totalSeconds = Math.round(numericPace * 60);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

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

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    await base44.auth.updateMe({ status: 'deleted', deleted_at: new Date().toISOString() });
    base44.auth.logout();
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const currentStreak = 0;
  const currentCoins = user?.coin_balance ?? 0;
  const currentLevel = Math.floor(currentCoins / 100) + 1;
  const progress = currentCoins % 100;
  const levelProgressPercent = Math.round((progress / 100) * 100);

  const lastRunCoins = 0;

  // Fetch user achievements to track unlocked status
  const { data: userAchievements = [] } = useQuery({
    queryKey: ['userAchievements', user?.email],
    queryFn: () => base44.entities.UserAchievement.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  // Map achievements with unlock status
  const achievementsWithStatus = achievements.map(achievement => {
    let unlocked = false;
    
    // Check unlock based on requirement
    if (achievement.requirement_type === 'total_runs') {
      unlocked = stats.totalRuns >= achievement.requirement_value;
    } else if (achievement.requirement_type === 'total_distance') {
      // Handle both distance and calorie requirements
      if (achievement.title === 'Calorie Burner' || achievement.title === 'Inferno') {
        unlocked = stats.totalCalories >= achievement.requirement_value;
      } else {
        unlocked = stats.totalDistance >= achievement.requirement_value;
      }
    }
    
    // Check if already claimed from UserAchievement
    const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id);
    
    return {
      ...achievement,
      unlocked,
      emoji: achievement.badge_emoji,
      name: achievement.title,
      rewardCoins: achievement.reward_coins,
      userAchievement,
    };
  });
  
  const unlockedAchievements = achievementsWithStatus.filter(a => a.unlocked);

  return (
    <div className="profileRoot">
      <style>{profileStyles}</style>

      {/* Sticky page header */}
      <div className="profilePageHeader">
        <span className="profilePageTitle">Profile</span>
        <button
          onClick={() => setSettingsOpen(true)}
          className="profileSettingsBtn"
          aria-label="Settings"
        >
          <Settings style={{ width: 18, height: 18 }} />
        </button>
      </div>

      {/* ── HERO SECTION ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="heroSection"
      >
        <div className="heroAvatarWrap">
          <ProfileAvatar
            user={user}
            size="lg2"
            editable
            onImageUpdate={() => refetchUser()}
          />
        </div>

        <h2 className="heroName">{user?.display_name || user?.full_name || 'Runner'}</h2>

        <div className="heroFollowRow">
          <button onClick={() => { setActiveFollowTab('following'); setFollowSheetOpen(true); }} className="heroPill">
            <span className="heroPillVal">{followingUsers.length}</span>
            <span className="heroPillLbl">Following</span>
          </button>
          <div className="heroPillDivider" />
          <button onClick={() => { setActiveFollowTab('followers'); setFollowSheetOpen(true); }} className="heroPill">
            <span className="heroPillVal">{followerUsers.length}</span>
            <span className="heroPillLbl">Followers</span>
          </button>
        </div>

        {/* Level card — matches Home levelCard */}
        <div className="heroLevelCard">
          <div className="heroLevelTop">
            <div className="heroLevelIcon">⚡</div>
            <div>
              <div className="heroLevelLabel">LEVEL</div>
              <div className="heroLevelValue">{currentLevel}</div>
            </div>
          </div>
          <div className="heroProgressWrap">
            <div className="heroProgressFill" style={{ width: `${levelProgressPercent}%` }} />
          </div>
          <div className="heroProgressNote">{progress.toFixed(0)} / 100 coins to Level {currentLevel + 1}</div>
        </div>
      </motion.div>

      {/* ── SECTION: PERFORMANCE ── */}
      <div className="section">
        <div className="sectionLabel">PERFORMANCE</div>
        <div className="grid2">
          <div className="statCard activeGlow">
            <div className="statTop"><div className="statLabel">DISTANCE</div><div className="statBadge">📍</div></div>
            <div className="statValue">{stats.totalDistance.toFixed(1)}<span className="unit"> km</span></div>
          </div>
          <div className="statCard">
            <div className="statTop"><div className="statLabel">RUNS</div><div className="statBadge">🏃</div></div>
            <div className="statValue">{stats.totalRuns}<span className="unit"> runs</span></div>
          </div>
          <div className="statCard">
            <div className="statTop"><div className="statLabel">AVG PACE</div><div className="statBadge">⚡</div></div>
            <div className="statValue">{formatPace(stats.avgPace)}<span className="unit"> /km</span></div>
          </div>
          <div className="statCard activeGlow">
            <div className="statTop"><div className="statLabel">STREAK</div><div className="statBadge">🔥</div></div>
            <div className="statValue">{currentStreak}<span className="unit"> days</span></div>
          </div>
        </div>

        {/* Performance summary sub-card */}
        <div className="perfSummaryCard">
          <div className="perfRow">
            <div className="perfItem">
              <div className="perfLabel">TOTAL TIME</div>
              <div className="perfValue">{Math.floor(stats.totalTime / 3600)}<span className="perfUnit"> hrs</span></div>
            </div>
            <div className="perfDivider" />
            <div className="perfItem">
              <div className="perfLabel">CALORIES</div>
              <div className="perfValue">{(stats.totalCalories / 1000).toFixed(1)}<span className="perfUnit">k kcal</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION: GAME ── */}
      <div className="section">
        <div className="sectionLabel">GAME</div>
        <div className="coinCard">
          <div className="coinLabelRow">
            <span className="coinEmoji">🪙</span>
            <span className="coinTitle">COIN BALANCE</span>
          </div>
          <div className="coinBalance">{Math.floor(currentCoins)}</div>
          <div className="coinSub">Run → Earn → Redeem</div>
        </div>
      </div>

      {/* ── SECTION: ACHIEVEMENTS ── */}
      <div className="section">
        <div className="achievementsHeaderRow">
          <div className="sectionLabel" style={{ margin: 0 }}>ACHIEVEMENTS</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="achCount">{unlockedAchievements.length}/8</span>
            <button onClick={() => setIsAchievementsOpen(true)} className="achDetailsBtn">Details</button>
          </div>
        </div>

        <div className="achievementsGrid">
          {achievementsWithStatus.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: achievement.unlocked ? 1 : 0.9, opacity: achievement.unlocked ? 1 : 0.38 }}
              transition={{ delay: index * 0.04 }}
              className={`achBadge ${achievement.unlocked ? 'achUnlocked' : 'achLocked'}`}
            >
              {!achievement.unlocked && <div className="achLockLayer"><span style={{ fontSize: 18 }}>🔒</span></div>}
              <span className="achEmoji">{achievement.emoji}</span>
              <p className="achName">{achievement.name}</p>
            </motion.div>
          ))}
        </div>
      </div>



      {/* Edit Bio Dialog */}
      <Dialog open={editBioOpen} onOpenChange={setEditBioOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">แก้ไขโปรไฟล์</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="เขียนเกี่ยวกับตัวคุณ..."
              className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditBioOpen(false)} className="text-gray-400">
                ยกเลิก
              </Button>
              <Button onClick={handleSaveBio} className="bg-[#B6FF00] hover:bg-[#9FE000] text-black">
                บันทึก
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                <MapPin className="w-4 h-4" style={{ color: '#BFFF00' }} />
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
                  <Check className="w-5 h-5 mr-2" style={{ color: '#BFFF00' }} />
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

      {/* Achievements Details Bottom Sheet */}
      {isAchievementsOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="achievementsModalOverlay"
          onClick={() => setIsAchievementsOpen(false)}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="achievementsModalSheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="achievementsModalHeader">
              <div>
                <h3 className="achievementsModalTitle">All Achievement Badges</h3>
                <p className="achievementsModalSubtitle">
                  Unlocked: {unlockedAchievements.length} / 8
                </p>
              </div>
              <button 
                onClick={() => setIsAchievementsOpen(false)} 
                className="achievementsModalClose"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="achievementsModalList">
              {achievementsWithStatus.map((achievement) => (
                <div
                  key={achievement.id}
                  className="achievementModalItem"
                  style={{ opacity: achievement.unlocked ? 1 : 0.5 }}
                >
                  <div className="achievementModalIcon" style={{
                    background: achievement.unlocked 
                      ? 'linear-gradient(135deg, rgba(138, 43, 226, 0.3), rgba(191, 255, 0, 0.2))'
                      : 'rgba(255, 255, 255, 0.05)',
                    border: achievement.unlocked 
                      ? '2px solid rgba(191, 255, 0, 0.4)'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                  }}>
                    {achievement.unlocked ? achievement.emoji : '🔒'}
                  </div>
                  <div className="achievementModalContent">
                    <div className="achievementModalName">{achievement.name}</div>
                    <div className="achievementModalReward">
                      🪙 {achievement.rewardCoins} coins
                    </div>
                    <div className="achievementModalStatus">
                      {achievement.unlocked ? (
                        <span className="achievementModalUnlocked">✓ Unlocked</span>
                      ) : (
                        <span className="achievementModalLocked">🔒 Locked</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Settings Sheet */}
      {settingsOpen && (
        <SettingsSheet
          user={user}
          onClose={() => setSettingsOpen(false)}
          onLogout={() => { setSettingsOpen(false); handleLogout(); }}
          onDeleteRequest={() => { setSettingsOpen(false); setDeleteConfirmOpen(true); }}
        />
      )}

      {/* Delete Account Confirm */}
      {deleteConfirmOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
        }}>
          <div style={{
            background: '#111', borderRadius: '20px', padding: '28px 24px',
            border: '1px solid rgba(255,60,60,0.3)', maxWidth: '360px', width: '100%',
          }}>
            <p style={{ fontSize: '20px', fontWeight: '800', color: '#fff', marginBottom: '10px' }}>Delete Account?</p>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', marginBottom: '24px', lineHeight: 1.6 }}>
              This action cannot be undone. Your profile and data will be permanently removed.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                style={{
                  flex: 1, padding: '13px', borderRadius: '12px', fontSize: '14px', fontWeight: '700',
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                style={{
                  flex: 1, padding: '13px', borderRadius: '12px', fontSize: '14px', fontWeight: '700',
                  background: 'rgba(255,60,60,0.85)', border: 'none', color: '#fff', cursor: 'pointer',
                  opacity: isDeletingAccount ? 0.6 : 1,
                }}
              >
                {isDeletingAccount ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Follow Sheet Modal */}
      {followSheetOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="achievementsModalOverlay"
          onClick={() => setFollowSheetOpen(false)}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="achievementsModalSheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="achievementsModalHeader">
              <div>
                <h3 className="achievementsModalTitle">
                  {activeFollowTab === 'following' ? 'กำลังติดตาม' : 'ผู้ติดตาม'}
                </h3>
                <p className="achievementsModalSubtitle">
                  {activeFollowTab === 'following' 
                    ? `${followingUsers.length} คน`
                    : `${followerUsers.length} คน`
                  }
                </p>
              </div>
              <button 
                onClick={() => setFollowSheetOpen(false)} 
                className="achievementsModalClose"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="followModalList">
              {activeFollowTab === 'following' && (
                <>
                  {followingUsers.length > 0 ? (
                    followingUsers.map((u) => (
                      <UserCard
                        key={u.id}
                        user={u}
                        isFollowing={true}
                        onFollow={handleFollow}
                        onUnfollow={handleUnfollow}
                        stats={getUserStats(u.email)}
                      />
                    ))
                  ) : (
                    <div className="emptyFollowState">
                      <Users className="emptyIcon" />
                      <p className="emptyTitle">ยังไม่ได้ติดตามใคร</p>
                    </div>
                  )}
                </>
              )}

              {activeFollowTab === 'followers' && (
                <>
                  {followerUsers.length > 0 ? (
                    followerUsers.map((u) => (
                      <UserCard
                        key={u.id}
                        user={u}
                        isFollowing={followingEmails.includes(u.email)}
                        onFollow={handleFollow}
                        onUnfollow={handleUnfollow}
                        stats={getUserStats(u.email)}
                      />
                    ))
                  ) : (
                    <div className="emptyFollowState">
                      <Users className="emptyIcon" />
                      <p className="emptyTitle">ยังไม่มีผู้ติดตาม</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

const profileStyles = `
  /* ── Same token set as Home ── */
  :root {
    --bg: #0A0A0A;
    --lime: #BFFF00;
    --purple: #8A2BE2;
    --text: rgba(255,255,255,.92);
    --muted: rgba(255,255,255,.60);
    --muted2: rgba(255,255,255,.40);
    --line: rgba(255,255,255,.10);
    --card: rgba(255,255,255,.05);
    --r: 22px;
    --shadow: 0 14px 40px rgba(0,0,0,.55);
  }

  .profileRoot {
    min-height: 100vh;
    background:
      radial-gradient(1200px 600px at 50% -10%, rgba(138,43,226,.15), transparent 55%),
      radial-gradient(900px 500px at 15% 10%, rgba(191,255,0,.07), transparent 60%),
      var(--bg);
    color: var(--text);
    padding: 0 0 110px;
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
  }

  /* ── Hero Section ── */
  .heroSection {
    text-align: center;
    padding: 16px 16px 12px;
  }
  .heroAvatarWrap {
    display: inline-block;
    margin-bottom: 10px;
    padding: 2px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(138,43,226,0.35), rgba(191,255,0,0.25));
    box-shadow: 0 0 18px rgba(138,43,226,0.25);
  }
  .heroName {
    font-size: 24px;
    font-weight: 900;
    color: var(--text);
    margin: 0 0 10px;
  }
  .heroFollowRow {
    display: inline-flex;
    align-items: center;
    gap: 0;
    margin-bottom: 14px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 999px;
    padding: 0 2px;
  }
  .heroPill {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 7px 16px;
    cursor: pointer;
    background: transparent;
    border: none;
    color: var(--text);
  }
  .heroPillVal {
    font-size: 14px;
    font-weight: 700;
    color: var(--muted);
    line-height: 1;
  }
  .heroPillLbl {
    font-size: 9px;
    color: var(--muted2);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-top: 2px;
  }
  .heroPillDivider {
    width: 1px;
    height: 22px;
    background: rgba(255,255,255,0.07);
  }

  /* Hero Level Card — mirrors Home .levelCard */
  .heroLevelCard {
    background: radial-gradient(120% 140% at 10% 10%, rgba(138,43,226,0.35) 0%, rgba(10,10,10,0.85) 58%, rgba(10,10,10,1) 100%);
    border: 1px solid rgba(138,43,226,0.22);
    border-radius: 18px;
    padding: 16px 18px;
    margin: 0 16px;
    box-shadow: var(--shadow);
    text-align: left;
  }
  .heroLevelTop {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }
  .heroLevelIcon {
    width: 44px; height: 44px; border-radius: 16px;
    background: rgba(138,43,226,0.25);
    border: 1px solid var(--line);
    display: grid; place-items: center;
    font-size: 18px;
    box-shadow: 0 0 0 1px rgba(191,255,0,0.10) inset;
  }
  .heroLevelLabel {
    font-size: 12px;
    letter-spacing: .12em;
    color: var(--muted2);
    margin-bottom: 2px;
  }
  .heroLevelValue {
    font-size: 34px;
    font-weight: 900;
    color: var(--text);
    line-height: 1;
  }
  .heroProgressWrap {
    height: 10px;
    border-radius: 999px;
    background: var(--line);
    overflow: hidden;
    margin-bottom: 8px;
  }
  .heroProgressFill {
    height: 100%;
    background: var(--lime);
    box-shadow: 0 0 18px rgba(191,255,0,0.35);
    border-radius: 999px;
    transition: width 0.4s ease;
  }
  .heroProgressNote {
    font-size: 12px;
    color: var(--muted);
  }

  /* ── Section ── mirrors Home .section */
  .section {
    padding: 16px 16px 0;
  }
  .sectionLabel {
    letter-spacing: .18em;
    font-size: 12px;
    color: var(--muted2);
    margin: 0 2px 10px;
  }
  .grid2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 12px;
  }

  /* Stat cards — identical to Home */
  .statCard {
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 18px;
    padding: 14px;
    text-align: left;
    box-shadow: 0 10px 26px rgba(0,0,0,.45);
  }
  .activeGlow {
    box-shadow: 0 18px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(191,255,0,0.12) inset;
  }
  .statTop {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .statLabel {
    font-size: 12px;
    letter-spacing: .12em;
    color: var(--muted2);
  }
  .statBadge {
    width: 34px; height: 34px; border-radius: 12px;
    background: rgba(10,10,10,0.25);
    border: 1px solid var(--line);
    display: grid; place-items: center;
  }
  .statValue {
    font-size: 30px;
    font-weight: 900;
    color: var(--lime);
    margin-top: 8px;
    line-height: 1;
    text-shadow: 0 0 18px rgba(191,255,0,0.3);
  }
  .unit {
    font-size: 13px;
    font-weight: 700;
    color: var(--muted);
  }

  /* Performance summary sub-card */
  .perfSummaryCard {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(191,255,0,0.10);
    border-radius: 18px;
    padding: 20px 24px;
    margin-bottom: 4px;
    box-shadow: 0 0 0 1px rgba(191,255,0,0.06) inset, 0 14px 36px rgba(0,0,0,.55);
  }
  .perfRow {
    display: flex;
    align-items: center;
    gap: 0;
  }
  .perfItem {
    flex: 1;
    text-align: center;
  }
  .perfLabel {
    font-size: 11px;
    letter-spacing: .10em;
    color: var(--muted2);
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .perfValue {
    font-size: 32px;
    font-weight: 900;
    color: var(--lime);
    text-shadow: 0 0 20px rgba(191,255,0,0.35);
    line-height: 1;
  }
  .perfUnit {
    font-size: 13px;
    font-weight: 700;
    color: var(--muted);
    margin-left: 3px;
  }
  .perfDivider {
    width: 1px;
    height: 48px;
    background: rgba(255,255,255,0.08);
  }

  /* Coin card */
  .coinCard {
    background: radial-gradient(120% 140% at 10% 10%, rgba(191,255,0,0.10) 0%, rgba(10,10,10,0.90) 55%);
    border: 1px solid rgba(191,255,0,0.12);
    border-radius: 18px;
    padding: 22px 20px;
    text-align: center;
    box-shadow: 0 0 0 1px rgba(191,255,0,0.06) inset, 0 14px 36px rgba(0,0,0,.5);
    margin-bottom: 4px;
  }
  .coinLabelRow {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    margin-bottom: 10px;
  }
  .coinEmoji { font-size: 16px; }
  .coinTitle {
    font-size: 11px;
    letter-spacing: .14em;
    color: var(--muted2);
    font-weight: 700;
    text-transform: uppercase;
  }
  .coinBalance {
    font-size: 48px;
    font-weight: 900;
    color: var(--lime);
    line-height: 1;
    text-shadow: 0 0 28px rgba(191,255,0,0.40);
    margin-bottom: 6px;
  }
  .coinSub {
    font-size: 12px;
    color: var(--muted);
  }

  /* Achievements section */
  .achievementsHeaderRow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .achCount {
    font-size: 12px;
    font-weight: 700;
    color: var(--lime);
    padding: 3px 10px;
    border-radius: 999px;
    background: rgba(191,255,0,0.10);
    border: 1px solid rgba(191,255,0,0.2);
  }
  .achDetailsBtn {
    padding: 5px 13px;
    border-radius: 999px;
    background: rgba(191,255,0,0.08);
    border: 1px solid rgba(191,255,0,0.22);
    color: var(--lime);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    margin-left: 6px;
  }
  .achievementsGrid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 4px;
  }
  .achBadge {
    aspect-ratio: 1;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 10px 6px;
    position: relative;
    overflow: hidden;
    border: 1px solid;
    cursor: pointer;
    transition: all 0.2s;
  }
  .achUnlocked {
    background: radial-gradient(circle at top, rgba(138,43,226,0.22), rgba(10,10,10,0.6));
    border-color: rgba(191,255,0,0.3);
    box-shadow: 0 0 16px rgba(138,43,226,0.2), 0 0 0 1px rgba(191,255,0,0.10) inset;
  }
  .achLocked {
    background: rgba(255,255,255,0.03);
    border-color: rgba(255,255,255,0.08);
  }
  .achLockLayer {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.55);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .achEmoji {
    font-size: 26px;
    margin-bottom: 5px;
  }
  .achUnlocked .achEmoji {
    filter: drop-shadow(0 0 6px rgba(191,255,0,0.25));
  }
  .achName {
    font-size: 9px;
    text-align: center;
    line-height: 1.3;
    color: var(--muted);
    margin: 0;
  }
  .achUnlocked .achName {
    color: rgba(255,255,255,0.8);
  }

  /* Achievements Modal */
  .achievementsModalOverlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.65);
    z-index: 99999;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }

  .achievementsModalSheet {
    width: 100%;
    max-width: 600px;
    max-height: 85dvh;
    background: linear-gradient(180deg, #0b0b10 0%, #0a0a0a 100%);
    border-top-left-radius: 24px;
    border-top-right-radius: 24px;
    border-top: 2px solid rgba(138, 43, 226, 0.5);
    border-left: 2px solid rgba(138, 43, 226, 0.3);
    border-right: 2px solid rgba(191, 255, 0, 0.3);
    border-bottom: none;
    box-shadow: 0 -8px 60px rgba(138, 43, 226, 0.4), 0 -4px 30px rgba(191, 255, 0, 0.2);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 24px;
    padding-bottom: calc(90px + env(safe-area-inset-bottom));
  }

  .profilePageHeader {
    position: sticky;
    top: 0;
    z-index: 500;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: calc(env(safe-area-inset-top) + 10px) 18px 10px;
    background: rgba(10,10,10,0.88);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--line);
  }
  .profilePageTitle {
    font-size: 17px;
    font-weight: 800;
    color: var(--text);
    letter-spacing: 0.04em;
  }
  .profileSettingsBtn {
    width: 42px; height: 42px;
    border-radius: 14px;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--line);
    color: var(--muted);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    flex-shrink: 0;
  }
  .profileSettingsBtn:active {
    background: rgba(255,255,255,0.10);
    transform: scale(0.94);
  }

  .achievementsModalHeader {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .achievementsModalTitle {
    font-size: 20px;
    font-weight: 800;
    color: #FFFFFF;
    margin: 0 0 6px;
  }

  .achievementsModalSubtitle {
    font-size: 13px;
    color: #BFFF00;
    font-weight: 600;
    margin: 0 0 4px;
  }

  .achievementsModalCoins {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    margin: 0 0 6px;
  }

  .achievementsModalNote {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.4);
    font-style: italic;
    margin: 0;
  }

  .achievementsModalClose {
    width: 36px;
    height: 36px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .achievementsModalClose:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.25);
  }

  .achievementsModalList {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .achievementModalItem {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px;
    border-radius: 16px;
    background: radial-gradient(circle at top left, rgba(138, 43, 226, 0.15), rgba(10, 10, 10, 0.8));
    border: 1px solid;
    border-image: linear-gradient(135deg, rgba(138, 43, 226, 0.4), rgba(191, 255, 0, 0.25)) 1;
    box-shadow: 0 0 20px rgba(138, 43, 226, 0.2);
    transition: all 0.2s;
  }
  
  .achievementModalItem:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 30px rgba(138, 43, 226, 0.35), 0 0 15px rgba(191, 255, 0, 0.2);
  }

  .achievementModalIcon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    flex-shrink: 0;
    box-shadow: 0 0 20px rgba(138, 43, 226, 0.4), 0 0 10px rgba(191, 255, 0, 0.25);
  }

  .achievementModalContent {
    flex: 1;
  }

  .achievementModalName {
    font-size: 15px;
    font-weight: 700;
    color: #FFFFFF;
    margin-bottom: 4px;
  }

  .achievementModalReward {
    font-size: 13px;
    font-weight: 700;
    color: #BFFF00;
    text-shadow: 0 0 10px rgba(191, 255, 0, 0.4);
    margin-bottom: 4px;
  }

  .achievementModalStatus {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
  }

  .achievementModalUnlocked {
    color: #BFFF00;
    font-weight: 600;
  }

  .achievementModalLocked {
    color: rgba(255, 255, 255, 0.4);
  }

  .achievementModalClaimed {
    color: rgba(255, 255, 255, 0.4);
  }

  /* Personal Bests Section */
  .personalBestsSection {
    margin-bottom: 28px;
  }

  /* Follow Pills Row */
  .followPillsRow {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-bottom: 16px;
  }

  .followPill {
    padding: 6px 16px;
    border-radius: 999px;
    background: linear-gradient(135deg, rgba(123,77,255,0.22), rgba(123,77,255,0.04));
    border: 1px solid rgba(123,77,255,0.45);
    color: rgba(255,255,255,0.95);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 0 22px rgba(123,77,255,0.22);
  }

  .followPill:hover {
    box-shadow: 0 0 28px rgba(123,77,255,0.28);
  }

  .followPill:active {
    transform: scale(0.96);
    box-shadow: 0 0 28px rgba(123,77,255,0.28);
  }

  /* Follow Modal List */
  .followModalList {
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 60vh;
    overflow-y: auto;
  }

  .emptyFollowState {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
  }

  .emptyFollowState .emptyIcon {
    width: 48px;
    height: 48px;
    color: rgba(255,255,255,0.2);
    margin-bottom: 16px;
  }

  .emptyFollowState .emptyTitle {
    font-size: 16px;
    font-weight: 600;
    color: rgba(255,255,255,0.6);
  }

  @media (max-width: 420px) {
    .heroName { font-size: 22px; }
    .statValue { font-size: 26px; }
    .perfValue { font-size: 26px; }
    .coinBalance { font-size: 40px; }
    .heroLevelValue { font-size: 28px; }
    .achBadge { border-radius: 12px; }
    .achEmoji { font-size: 22px; }
  }
`;