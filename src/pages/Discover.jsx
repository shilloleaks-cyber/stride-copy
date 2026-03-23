import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Users } from 'lucide-react';
import UserCard from '@/components/feed/UserCard';

const TABS = [
  { value: 'suggested', label: 'แนะนำ' },
  { value: 'following', label: 'ติดตาม' },
  { value: 'followers', label: 'ผู้ติดตาม' },
];

export default function Discover() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('suggested');

  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: allUsers = [] } = useQuery({ queryKey: ['allUsers'], queryFn: () => base44.entities.User.list() });
  const { data: follows = [] } = useQuery({
    queryKey: ['follows', currentUser?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: currentUser?.email }),
    enabled: !!currentUser?.email,
  });
  const { data: followers = [] } = useQuery({
    queryKey: ['followers', currentUser?.email],
    queryFn: () => base44.entities.Follow.filter({ following_email: currentUser?.email }),
    enabled: !!currentUser?.email,
  });
  const { data: allRuns = [] } = useQuery({
    queryKey: ['allRuns'],
    queryFn: () => base44.entities.Run.filter({ status: 'completed' }),
  });

  const followingEmails = follows.map(f => f.following_email);
  const followerEmails = followers.map(f => f.follower_email);
  const otherUsers = allUsers.filter(u => u.email !== currentUser?.email);
  const suggestedUsers = otherUsers.filter(u => !followingEmails.includes(u.email));
  const followingUsers = otherUsers.filter(u => followingEmails.includes(u.email));
  const followerUsers = otherUsers.filter(u => followerEmails.includes(u.email));
  const searchResults = searchQuery.trim()
    ? otherUsers.filter(u => u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const getUserStats = (email) => {
    const userRuns = allRuns.filter(r => r.created_by === email);
    return {
      totalDistance: userRuns.reduce((sum, r) => sum + (r.distance_km || 0), 0),
      totalRuns: userRuns.length,
    };
  };

  const followMutation = useMutation({
    mutationFn: async (targetEmail) => base44.entities.Follow.create({ follower_email: currentUser?.email, following_email: targetEmail }),
    onSuccess: () => queryClient.invalidateQueries(['follows']),
  });
  const unfollowMutation = useMutation({
    mutationFn: async (targetEmail) => {
      const follow = follows.find(f => f.following_email === targetEmail);
      if (follow) await base44.entities.Follow.delete(follow.id);
    },
    onSuccess: () => queryClient.invalidateQueries(['follows']),
  });

  const tabUsers = { suggested: suggestedUsers, following: followingUsers, followers: followerUsers };
  const currentList = searchQuery.trim() ? searchResults : (tabUsers[activeTab] || []);

  const EmptyState = ({ msg, sub }) => (
    <div style={{ textAlign: 'center', padding: '56px 20px' }}>
      <Users style={{ width: 44, height: 44, color: 'rgba(255,255,255,0.15)', margin: '0 auto 14px' }} />
      <p style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{msg}</p>
      {sub && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>{sub}</p>}
    </div>
  );

  return (
    <div className="min-h-screen text-white pb-28" style={{ backgroundColor: '#0F0F0F' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-lg border-b" style={{ backgroundColor: 'rgba(15,15,15,0.97)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div style={{ padding: '52px 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <button
              onClick={() => navigate(createPageUrl('Feed'))}
              style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ArrowLeft style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.7)' }} />
            </button>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0 }}>ค้นหานักวิ่ง</h1>
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'rgba(255,255,255,0.3)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ค้นหาด้วยชื่อหรืออีเมล..."
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12, padding: '11px 14px 11px 36px',
                color: '#fff', fontSize: 14, outline: 'none',
              }}
            />
          </div>

          {/* Tabs (hidden while searching) */}
          {!searchQuery.trim() && (
            <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
              {TABS.map(tab => {
                const isActive = activeTab === tab.value;
                const count = tabUsers[tab.value]?.length;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    style={{
                      flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 12, fontWeight: 700,
                      transition: 'all 0.15s',
                      ...(isActive
                        ? { background: '#BFFF00', color: '#0A0A0A', border: '1.5px solid #BFFF00' }
                        : { background: '#1A1A1A', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)' }
                      ),
                    }}
                  >
                    {tab.label}{tab.value !== 'suggested' ? ` (${count})` : ''}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* User List */}
      <div style={{ padding: '16px 20px' }}>
        {searchQuery.trim() && (
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
            ผลการค้นหา ({searchResults.length})
          </p>
        )}

        {currentList.length > 0 ? (
          <AnimatePresence>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {currentList.map((user, index) => (
                <motion.div key={user.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
                  <UserCard
                    user={user}
                    isFollowing={followingEmails.includes(user.email)}
                    onFollow={(e) => followMutation.mutate(e)}
                    onUnfollow={(e) => unfollowMutation.mutate(e)}
                    stats={getUserStats(user.email)}
                  />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        ) : (
          <>
            {searchQuery.trim()
              ? <EmptyState msg="ไม่พบผู้ใช้" />
              : activeTab === 'suggested'
                ? <EmptyState msg="คุณติดตามทุกคนแล้ว!" />
                : activeTab === 'following'
                  ? <EmptyState msg="ยังไม่ได้ติดตามใคร" sub="ค้นหานักวิ่งเพื่อติดตาม" />
                  : <EmptyState msg="ยังไม่มีผู้ติดตาม" sub="แชร์กิจกรรมวิ่งเพื่อให้คนอื่นรู้จักคุณ" />
            }
          </>
        )}
      </div>
    </div>
  );
}