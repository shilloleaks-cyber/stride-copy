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
import UserCard from '@/components/feed/UserCard';
import { useMutation } from '@tanstack/react-query';
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
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);

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

  const { data: runs = [] } = useQuery({
    queryKey: ['runs'],
    queryFn: () => base44.entities.Run.list('-start_time', 500),
  });

  const completedRuns = runs.filter(r => r.status === 'completed');

  const validPaceRuns = completedRuns.filter((r) => {
    const pace = Number(r?.pace_min_per_km);
    return Number.isFinite(pace) && pace > 0;
  });

  // Stats
  const stats = {
    totalDistance: completedRuns.reduce((sum, r) => sum + (r.distance_km || 0), 0),
    totalTime: completedRuns.reduce((sum, r) => sum + (r.duration_seconds || 0), 0),
    totalCalories: completedRuns.reduce((sum, r) => sum + (r.calories_burned || 0), 0),
    totalRuns: completedRuns.length,
    avgPace: validPaceRuns.length > 0
      ? validPaceRuns.reduce((sum, r) => sum + Number(r.pace_min_per_km), 0) / validPaceRuns.length
      : 0,
  };

  // Personal bests
  const longestRun = completedRuns.reduce((max, r) => (r.distance_km || 0) > (max?.distance_km || 0) ? r : max, null);
  const fastestPace = validPaceRuns.reduce((min, r) =>
    Number(r.pace_min_per_km) < Number(min?.pace_min_per_km ?? Infinity) ? r : min, null);

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

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Calculate streak
  const calculateStreak = () => {
    if (completedRuns.length === 0) return 0;
    const sortedRuns = [...completedRuns].sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
    const uniqueDays = new Set();
    sortedRuns.forEach(run => {
      const date = new Date(run.start_time);
      date.setHours(0, 0, 0, 0);
      uniqueDays.add(date.getTime());
    });
    const sortedDays = Array.from(uniqueDays).sort((a, b) => b - a);
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oneDayMs = 24 * 60 * 60 * 1000;
    for (let i = 0; i < sortedDays.length; i++) {
      const currentDay = sortedDays[i];
      const expectedDay = today.getTime() - (i * oneDayMs);
      if (Math.abs(currentDay - expectedDay) < oneDayMs / 2) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const currentStreak = calculateStreak();
  const currentCoins = user?.coin_balance ?? 0;
  const currentLevel = Math.floor(currentCoins / 100) + 1;
  const progress = currentCoins % 100;
  const levelProgressPercent = Math.round((progress / 100) * 100);

  // Recent run coins earned
  const lastRun = completedRuns[0];
  const lastRunCoins = lastRun ? Math.floor(lastRun.distance_km || 0) : 0;

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

      {/* Identity + Level Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="identityHeader"
      >
        <div className="avatarContainer">
          <div className="avatarGlow">
            <ProfileAvatar 
              user={user} 
              size="lg" 
              editable 
              onImageUpdate={() => refetchUser()}
            />
          </div>
        </div>

        <h2 className="userNameLarge">{user?.full_name || 'Runner'}</h2>
        
        <div className="levelBadge">
          <Trophy className="w-3.5 h-3.5" />
          <span>Lv.{currentLevel} Runner</span>
        </div>

        <div className="levelProgressSection">
          <div className="levelProgressBar">
            <div className="levelProgressFill" style={{ width: `${levelProgressPercent}%` }} />
          </div>
          <p className="levelProgressText">{levelProgressPercent}%</p>
        </div>
      </motion.div>

      {/* Quick Stats Mini Cards */}
      <div className="quickStatsRow">
        <div className="quickStatCard">
          <MapPin className="w-5 h-5 quickIcon" />
          <div className="quickValue">{stats.totalDistance.toFixed(1)}</div>
          <div className="quickLabel">KM</div>
        </div>
        <div className="quickStatCard">
          <Calendar className="w-5 h-5 quickIcon" />
          <div className="quickValue">{stats.totalRuns}</div>
          <div className="quickLabel">Runs</div>
        </div>
        <div className="quickStatCard">
          <TrendingUp className="w-5 h-5 quickIcon" />
          <div className="quickValue">{formatPace(stats.avgPace)}</div>
          <div className="quickLabel">Pace</div>
        </div>
        <div className="quickStatCard">
          <Flame className="w-5 h-5 quickIcon" />
          <div className="quickValue">{currentStreak}</div>
          <div className="quickLabel">Streak</div>
        </div>
      </div>

      {/* Performance Summary Big Card */}
      <div className="performanceCard">
        <div className="perfGrid">
          <div className="perfItem">
            <div className="perfLabel">TOTAL DISTANCE</div>
            <div className="perfValue">{stats.totalDistance.toFixed(1)} km</div>
          </div>
          <div className="perfItem">
            <div className="perfLabel">TOTAL TIME</div>
            <div className="perfValue">{Math.floor(stats.totalTime / 3600)} hrs</div>
          </div>
          <div className="perfItem">
            <div className="perfLabel">TOTAL CALORIES</div>
            <div className="perfValue">{(stats.totalCalories / 1000).toFixed(1)}k kcal</div>
          </div>
          <div className="perfItem">
            <div className="perfLabel">AVG PACE</div>
            <div className="perfValue">{formatPace(stats.avgPace)}</div>
          </div>
        </div>
      </div>

      {/* Coin + Economy Card */}
      <div className="coinWalletCard">
        <div className="coinHeader">
          <span className="coinEmoji">🪙</span>
          <span className="coinTitle">COIN WALLET</span>
        </div>
        <div className="coinBalance">{currentCoins.toFixed(2)}</div>
        <div className="coinBalanceLabel">Balance</div>
        {lastRunCoins > 0 && (
          <div className="coinLastRun">+{lastRunCoins.toFixed(2)} from last run</div>
        )}
      </div>

      {/* Achievements */}
      <div className="achievementsSection">
        <div className="achievementsHeader">
          <div className="achievementsHeaderLeft">
            <Trophy className="achievementsIcon" />
            <span className="achievementsTitle">Achievement Badges</span>
          </div>
          <span className="achievementsCount">{unlockedAchievements.length}/8</span>
          <button 
            onClick={() => setIsAchievementsOpen(true)}
            className="achievementsDetailsBtn"
          >
            Details
          </button>
        </div>
        
        <div className="achievementsDivider" />
        
        <div className="achievementsGrid">
          {achievementsWithStatus.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: achievement.unlocked ? 1 : 0.9, 
                opacity: achievement.unlocked ? 1 : 0.4 
              }}
              transition={{ delay: index * 0.05 }}
              whileHover={achievement.unlocked ? { scale: 1.08 } : { scale: 0.92 }}
              className={`achievementBadge ${achievement.unlocked ? 'unlocked' : 'locked'}`}
            >
              {!achievement.unlocked && (
                <div className="achievementLockOverlay">
                  <span className="text-2xl">🔒</span>
                </div>
              )}
              <span className="achievementEmoji">{achievement.emoji}</span>
              <p className="achievementName">{achievement.name}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Personal Bests */}
      <div className="personalBestsSection">
        <PersonalBestsSection runs={runs} />
      </div>

      {/* Running History */}
      <RunningHistorySection runs={runs} />

      {/* Following / Followers Section */}
      <div className="followSection">
        <div className="followTabsWrapper">
          <button
            onClick={() => setActiveFollowTab('following')}
            className={`followTab ${activeFollowTab === 'following' ? 'active' : ''}`}
          >
            กำลังติดตาม ({followingUsers.length})
          </button>
          <button
            onClick={() => setActiveFollowTab('followers')}
            className={`followTab ${activeFollowTab === 'followers' ? 'active' : ''}`}
          >
            ผู้ติดตาม ({followerUsers.length})
          </button>
        </div>

        <div className="followListArea">
          {activeFollowTab === 'following' && (
            <>
              {followingUsers.length > 0 ? (
                <div className="followList">
                  {followingUsers.map((u) => (
                    <UserCard
                      key={u.id}
                      user={u}
                      isFollowing={true}
                      onFollow={handleFollow}
                      onUnfollow={handleUnfollow}
                      stats={getUserStats(u.email)}
                    />
                  ))}
                </div>
              ) : (
                <div className="emptyFollowState">
                  <Users className="emptyIcon" />
                  <p className="emptyTitle">คุณยังไม่ได้ติดตามใคร</p>
                  <p className="emptySubtext">ค้นหานักวิ่งเพื่อเริ่มติดตาม</p>
                </div>
              )}
            </>
          )}

          {activeFollowTab === 'followers' && (
            <>
              {followerUsers.length > 0 ? (
                <div className="followList">
                  {followerUsers.map((u) => (
                    <UserCard
                      key={u.id}
                      user={u}
                      isFollowing={followingEmails.includes(u.email)}
                      onFollow={handleFollow}
                      onUnfollow={handleUnfollow}
                      stats={getUserStats(u.email)}
                    />
                  ))}
                </div>
              ) : (
                <div className="emptyFollowState">
                  <Users className="emptyIcon" />
                  <p className="emptyTitle">ยังไม่มีผู้ติดตาม</p>
                  <p className="emptySubtext">ค้นหานักวิ่งเพื่อเริ่มติดตาม</p>
                </div>
              )}
            </>
          )}
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
    </div>
  );
}

const profileStyles = `
  .profileRoot {
    min-height: 100vh;
    background: radial-gradient(900px 500px at 50% 0%, rgba(123,77,255,0.05), transparent 60%),
                #050508;
    color: rgba(255,255,255,0.95);
    padding: 28px 0 100px;
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
  }

  /* Identity + Level Header */
  .identityHeader {
    text-align: center;
    padding: 0 24px 32px;
  }

  .avatarContainer {
    margin-bottom: 16px;
  }

  .avatarGlow {
    display: inline-block;
    position: relative;
    padding: 6px;
    border-radius: 50%;
    background: #050508;
    border: 1px solid rgba(255,255,255,0.06);
    box-shadow: 0 4px 12px rgba(0,0,0,0.25);
  }

  @keyframes avatarRingPulse {
    0%, 100% { box-shadow: 0 0 12px rgba(182,255,0,0.15), 0 0 0 1px rgba(0,0,0,0.6) inset; }
    50% { box-shadow: 0 0 16px rgba(182,255,0,0.25), 0 0 0 1px rgba(0,0,0,0.5) inset; }
  }

  .userNameLarge {
    font-size: 28px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 12px;
  }

  .levelBadge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 18px;
    border-radius: 999px;
    background: rgba(10,10,10,0.6);
    border: 1px solid #B6FF00;
    color: #B6FF00;
    font-size: 13px;
    font-weight: 700;
    box-shadow: 0 0 20px rgba(182,255,0,0.25);
    margin-bottom: 20px;
  }

  .levelProgressSection {
    max-width: 280px;
    margin: 0 auto;
  }

  .levelProgressBar {
    height: 10px;
    border-radius: 999px;
    background: rgba(60,60,60,0.6);
    overflow: hidden;
    margin-bottom: 8px;
  }

  .levelProgressFill {
    height: 100%;
    background: #B6FF00;
    border-radius: 999px;
    box-shadow: 0 0 16px rgba(182,255,0,0.6);
    transition: width 0.4s ease;
  }

  .levelProgressText {
    font-size: 13px;
    font-weight: 700;
    color: rgba(255,255,255,0.6);
    text-align: center;
    margin: 0;
  }

  /* Quick Stats Mini Cards */
  .quickStatsRow {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    padding: 0 20px 28px;
  }

  .quickStatCard {
    background: rgba(20,20,20,0.5);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    padding: 14px 8px;
    text-align: center;
  }

  .quickIcon {
    color: #B6FF00;
    margin: 0 auto 8px;
  }

  .quickValue {
    font-size: 20px;
    font-weight: 900;
    color: #B6FF00;
    margin-bottom: 4px;
  }

  .quickLabel {
    font-size: 10px;
    color: rgba(255,255,255,0.5);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Performance Summary Big Card */
  .performanceCard {
    margin: 0 20px 28px;
    padding: 24px 20px;
    background: rgba(20,20,20,0.5);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    box-shadow: 0 0 16px rgba(182,255,0,0.08);
  }

  .perfGrid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  .perfItem {
    text-align: center;
  }

  .perfLabel {
    font-size: 10px;
    color: rgba(255,255,255,0.45);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 8px;
    font-weight: 600;
  }

  .perfValue {
    font-size: 26px;
    font-weight: 900;
    color: #B6FF00;
  }

  /* Coin Wallet Card */
  .coinWalletCard {
    margin: 0 20px 28px;
    padding: 24px;
    background: rgba(20,20,20,0.5);
    border: 1px solid rgba(182,255,0,0.2);
    border-radius: 20px;
    box-shadow: 0 0 20px rgba(182,255,0,0.15);
    text-align: center;
  }

  .coinHeader {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 16px;
  }

  .coinEmoji {
    font-size: 20px;
  }

  .coinTitle {
    font-size: 11px;
    color: rgba(255,255,255,0.5);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 700;
  }

  .coinBalance {
    font-size: 48px;
    font-weight: 900;
    color: #B6FF00;
    text-shadow: 0 0 24px rgba(182,255,0,0.5);
    margin-bottom: 4px;
  }

  .coinBalanceLabel {
    font-size: 13px;
    color: rgba(255,255,255,0.5);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 12px;
  }

  .coinLastRun {
    font-size: 13px;
    color: rgba(255,255,255,0.6);
    padding: 8px 16px;
    background: rgba(182,255,0,0.08);
    border-radius: 999px;
    display: inline-block;
  }

  /* Achievements Section */
  .achievementsSection {
    margin-bottom: 28px;
    padding: 0 20px;
  }

  .achievementsHeader {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
  }

  .achievementsHeaderLeft {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
  }

  .achievementsIcon {
    width: 18px;
    height: 18px;
    color: #BFFF00;
    filter: drop-shadow(0 0 6px rgba(191, 255, 0, 0.5));
  }

  .achievementsTitle {
    font-size: 15px;
    color: #FFFFFF;
    font-weight: 700;
  }

  .achievementsCount {
    font-size: 14px;
    font-weight: 700;
    color: #BFFF00;
    padding: 4px 12px;
    border-radius: 999px;
    background: rgba(191, 255, 0, 0.12);
    border: 1px solid rgba(191, 255, 0, 0.2);
  }

  .achievementsDetailsBtn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 999px;
    background: rgba(191, 255, 0, 0.12);
    border: 1px solid rgba(191, 255, 0, 0.3);
    color: #BFFF00;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 0 10px rgba(191, 255, 0, 0.2);
  }

  .achievementsDetailsBtn:hover {
    background: rgba(191, 255, 0, 0.18);
    box-shadow: 0 0 15px rgba(191, 255, 0, 0.3);
    transform: translateY(-1px);
  }

  .achievementsDivider {
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(138, 43, 226, 0.4) 20%,
      rgba(191, 255, 0, 0.3) 50%,
      rgba(138, 43, 226, 0.4) 80%,
      transparent
    );
    margin-bottom: 16px;
  }

  .achievementsGrid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }

  .achievementBadge {
    aspect-ratio: 1;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 12px 8px;
    position: relative;
    overflow: hidden;
    border: 2px solid;
    cursor: pointer;
    transition: all 0.2s;
  }

  .achievementBadge.unlocked {
    background: radial-gradient(circle at top, rgba(138, 43, 226, 0.25), rgba(10, 10, 10, 0.4));
    border-color: rgba(191, 255, 0, 0.4);
    box-shadow: 0 0 20px rgba(138, 43, 226, 0.3), 0 0 0 1px rgba(191, 255, 0, 0.15) inset;
  }

  .achievementBadge.locked {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .achievementLockOverlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .achievementEmoji {
    font-size: 28px;
    margin-bottom: 6px;
    filter: drop-shadow(0 0 6px rgba(191, 255, 0, 0.3));
  }

  .achievementBadge.locked .achievementEmoji {
    filter: none;
  }

  .achievementName {
    font-size: 10px;
    text-align: center;
    line-height: 1.3;
    color: rgba(255, 255, 255, 0.8);
    margin: 0;
  }

  .achievementBadge.locked .achievementName {
    color: rgba(255, 255, 255, 0.4);
  }

  /* Achievements Modal */
  .achievementsModalOverlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 9999;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }

  .achievementsModalSheet {
    width: 100%;
    max-width: 600px;
    max-height: 85vh;
    background: linear-gradient(180deg, #0b0b10 0%, #0a0a0a 100%);
    border-top-left-radius: 24px;
    border-top-right-radius: 24px;
    border: 2px solid;
    border-image: linear-gradient(135deg, rgba(138, 43, 226, 0.6) 0%, rgba(191, 255, 0, 0.4) 100%) 1;
    border-bottom: none;
    box-shadow: 0 0 60px rgba(138, 43, 226, 0.5), 0 0 40px rgba(191, 255, 0, 0.3);
    overflow-y: auto;
    padding: 24px;
    padding-bottom: calc(24px + env(safe-area-inset-bottom));
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

  @media (max-width: 420px) {
    .quickStatsRow { gap: 8px; padding: 0 16px 24px; }
    .quickStatCard { padding: 12px 6px; }
    .quickValue { font-size: 18px; }
    .perfValue { font-size: 24px; }
    .coinBalance { font-size: 42px; }
  }
`;