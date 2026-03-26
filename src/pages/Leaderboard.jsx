import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, MapPin, Activity, Coins, Crown, Medal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import FriendRequestButton from '@/components/social/FriendRequestButton';

export default function Leaderboard() {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState('distance');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['allUsersLeaderboard'],
    queryFn: () => base44.entities.User.list(),
  });

  const sortedUsers = [...users].sort((a, b) => {
    switch (sortBy) {
      case 'distance': return (b.total_distance_km || 0) - (a.total_distance_km || 0);
      case 'runs': return (b.total_runs || 0) - (a.total_runs || 0);
      case 'tokens': return (b.token_balance || 0) - (a.token_balance || 0);
      default: return 0;
    }
  });

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getValue = (user) => {
    switch (sortBy) {
      case 'distance': return `${(user.total_distance_km || 0).toFixed(1)} กม.`;
      case 'runs': return `${user.total_runs || 0} ครั้ง`;
      case 'tokens': return `${Math.floor(user.token_balance || 0)} BX`;
      default: return '';
    }
  };

  const getRankStyle = (rank) => {
    if (rank === 1) return {
      border: '1px solid rgba(212,175,55,0.40)',
      boxShadow: '0 0 22px rgba(212,175,55,0.12), inset 0 0 0 0 transparent',
      background: 'rgba(212,175,55,0.055)',
    };
    if (rank === 2) return {
      border: '1px solid rgba(180,180,195,0.18)',
      boxShadow: 'none',
      background: 'rgba(255,255,255,0.025)',
    };
    if (rank === 3) return {
      border: '1px solid rgba(175,105,40,0.22)',
      boxShadow: 'none',
      background: 'rgba(175,105,40,0.03)',
    };
    return {
      border: '1px solid rgba(255,255,255,0.06)',
      boxShadow: 'none',
      background: 'rgba(255,255,255,0.025)',
    };
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown style={{ width: 17, height: 17, color: 'rgba(212,175,55,0.95)' }} />;
    if (rank === 2) return <Medal style={{ width: 15, height: 15, color: 'rgba(170,170,180,0.70)' }} />;
    if (rank === 3) return <Medal style={{ width: 14, height: 14, color: 'rgba(175,105,40,0.75)' }} />;
    return <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.28)' }}>{rank}</span>;
  };

  const getRankValueColor = (rank) => {
    if (rank === 1) return 'rgba(212,175,55,0.95)';
    if (rank === 2) return 'rgba(190,190,200,0.75)';
    if (rank === 3) return 'rgba(185,120,55,0.80)';
    return 'rgba(191,255,0,0.85)';
  };

  const currentUserRank = sortedUsers.findIndex(u => u.email === currentUser?.email) + 1;

  const tabs = [
    { key: 'distance', label: 'ระยะทาง', icon: MapPin },
    { key: 'runs', label: 'ครั้งวิ่ง', icon: Activity },
    { key: 'tokens', label: 'โทเค็น', icon: Coins },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', color: '#fff', paddingBottom: 96 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 0' }}>
        <button
          onClick={() => navigate(createPageUrl('Home'))}
          style={{
            width: 40, height: 40, borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.10)',
            background: 'rgba(255,255,255,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'rgba(255,255,255,0.8)',
          }}
        >
          <ArrowLeft style={{ width: 18, height: 18 }} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>อันดับ</span>
        <div style={{ width: 40 }} />
      </div>

      {/* Your Rank Card */}
      {currentUserRank > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ margin: '20px 20px 0' }}
        >
          <div style={{
            borderRadius: 18,
            border: '1px solid rgba(255,255,255,0.09)',
            background: 'rgba(255,255,255,0.03)',
            boxShadow: 'none',
            padding: '16px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 13,
                border: '1px solid rgba(191,255,0,0.18)',
                background: 'rgba(191,255,0,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Trophy style={{ width: 18, height: 18, color: 'rgba(191,255,0,0.8)' }} />
              </div>
              <div>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                  อันดับของคุณ
                </p>
                <p style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: '2px 0 0', lineHeight: 1 }}>
                  #{currentUserRank}
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: 'rgba(191,255,0,0.85)', margin: 0 }}>
                {getValue(currentUser || {})}
              </p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', margin: '3px 0 0' }}>
                {sortBy === 'distance' ? 'ระยะทางรวม' : sortBy === 'runs' ? 'จำนวนวิ่ง' : 'เหรียญ BX'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filter Tabs */}
      <div style={{ margin: '16px 20px 0' }}>
        <div style={{
          display: 'flex', gap: 4, padding: 4,
          borderRadius: 12,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {tabs.map(({ key, label, icon: Icon }) => {
            const active = sortBy === key;
            return (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                style={{
                  flex: 1, padding: '6px 0', borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  fontSize: 11, fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  ...(active ? {
                    background: 'rgba(191,255,0,0.10)',
                    border: '1px solid rgba(191,255,0,0.28)',
                    color: '#BFFF00',
                  } : {
                    background: 'transparent',
                    border: '1px solid transparent',
                    color: 'rgba(255,255,255,0.35)',
                  }),
                }}
              >
                <Icon style={{ width: 11, height: 11 }} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Leaderboard List */}
      <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} style={{ height: 76, borderRadius: 16, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))
        ) : sortedUsers.length > 0 ? (
          sortedUsers.map((user, index) => {
            const rank = index + 1;
            const isCurrentUser = user.email === currentUser?.email;
            const rankStyle = getRankStyle(rank);

            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                style={{
                  borderRadius: 16,
                  padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  ...rankStyle,
                  ...(isCurrentUser ? {
                    border: '1px solid rgba(191,255,0,0.30)',
                    boxShadow: '0 0 20px rgba(191,255,0,0.08)',
                    background: 'rgba(191,255,0,0.04)',
                  } : {}),
                }}
              >
                {/* Rank */}
                <div style={{ width: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {getRankIcon(rank)}
                </div>

                {/* Avatar */}
                <Avatar style={{
                  width: 44, height: 44, flexShrink: 0,
                  ...(rank <= 3 ? {
                    outline: `2px solid ${rank === 1 ? 'rgba(212,175,55,0.5)' : rank === 2 ? 'rgba(180,180,190,0.4)' : 'rgba(180,100,30,0.45)'}`,
                    outlineOffset: 2,
                  } : {}),
                }}>
                  {user.profile_image ? (
                    <AvatarImage src={user.profile_image} alt={user.full_name} className="object-cover" />
                  ) : null}
                  <AvatarFallback style={{
                    background: 'rgba(255,255,255,0.07)',
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: 13, fontWeight: 700,
                  }}>
                    {getInitials(user.full_name)}
                  </AvatarFallback>
                </Avatar>

                {/* Name & sub-stats */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.full_name || 'Runner'}
                    {isCurrentUser && <span style={{ fontSize: 10, color: '#BFFF00', marginLeft: 6, fontWeight: 700 }}>YOU</span>}
                  </p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '3px 0 0' }}>
                    {(user.total_distance_km || 0).toFixed(1)} กม. · {user.total_runs || 0} ครั้ง
                  </p>
                </div>

                {/* Value + action */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: getRankValueColor(rank), margin: 0 }}>
                    {getValue(user)}
                  </p>
                  {!isCurrentUser && (
                    <FriendRequestButton targetUser={user} currentUser={currentUser} />
                  )}
                </div>
              </motion.div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Trophy style={{ width: 40, height: 40, color: 'rgba(255,255,255,0.15)', margin: '0 auto 12px' }} />
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>ยังไม่มีข้อมูล</p>
          </div>
        )}
      </div>
    </div>
  );
}