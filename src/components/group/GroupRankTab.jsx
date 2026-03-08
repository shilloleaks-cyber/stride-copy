import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { subDays, subMonths, startOfDay } from 'date-fns';

const PERIODS = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'all', label: 'All' },
];

function getPeriodStart(period) {
  const now = new Date();
  if (period === 'week') return startOfDay(subDays(now, 7));
  if (period === 'month') return startOfDay(subMonths(now, 1));
  return null;
}

function getInitials(name) {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function RankIcon({ index }) {
  if (index === 0) return <Trophy className="w-5 h-5 text-yellow-400" />;
  if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
  if (index === 2) return <Award className="w-5 h-5 text-amber-600" />;
  return <span className="text-gray-500 font-medium text-sm">#{index + 1}</span>;
}

function TopThree({ members }) {
  if (members.length === 0) return null;

  const order = members.length >= 3
    ? [members[1], members[0], members[2]]
    : members.length === 2
    ? [members[1], members[0]]
    : [members[0]];

  const heights = members.length >= 3
    ? ['h-20', 'h-28', 'h-16']
    : members.length === 2
    ? ['h-20', 'h-28']
    : ['h-28'];

  const rankIndexes = members.length >= 3 ? [1, 0, 2] : members.length === 2 ? [1, 0] : [0];

  return (
    <div className="flex items-end justify-center gap-3 mb-6 pt-2">
      {order.map((member, i) => {
        const isFirst = rankIndexes[i] === 0;
        return (
          <div key={member.user_email} className="flex flex-col items-center gap-1">
            <div className="relative">
              <Avatar className={`${isFirst ? 'w-16 h-16' : 'w-12 h-12'} border-2 ${isFirst ? 'border-yellow-400' : rankIndexes[i] === 1 ? 'border-gray-400' : 'border-amber-600'}`}>
                <AvatarImage src={member.profile_image} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-700 text-white text-sm font-bold">
                  {getInitials(member.user_name)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -top-2 -right-1 text-base">
                {rankIndexes[i] === 0 ? '🥇' : rankIndexes[i] === 1 ? '🥈' : '🥉'}
              </div>
            </div>
            <p className="text-white text-xs font-semibold text-center max-w-[72px] truncate">{member.user_name}</p>
            <p style={{ color: '#BFFF00' }} className="text-xs font-bold">{member.totalDistance.toFixed(1)} km</p>
            <div
              className={`w-16 ${heights[i]} rounded-t-lg flex items-center justify-center`}
              style={{
                background: rankIndexes[i] === 0
                  ? 'linear-gradient(180deg, rgba(234,179,8,0.3) 0%, rgba(234,179,8,0.1) 100%)'
                  : rankIndexes[i] === 1
                  ? 'linear-gradient(180deg, rgba(156,163,175,0.3) 0%, rgba(156,163,175,0.1) 100%)'
                  : 'linear-gradient(180deg, rgba(217,119,6,0.3) 0%, rgba(217,119,6,0.1) 100%)',
                border: `1px solid ${rankIndexes[i] === 0 ? 'rgba(234,179,8,0.3)' : rankIndexes[i] === 1 ? 'rgba(156,163,175,0.3)' : 'rgba(217,119,6,0.3)'}`,
              }}
            >
              <span className="text-xl font-black text-white/20">{rankIndexes[i] + 1}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function GroupRankTab({ groupId }) {
  const [period, setPeriod] = useState('week');

  const { data: members = [] } = useQuery({
    queryKey: ['groupMembers', groupId],
    queryFn: () => base44.entities.GroupMember.filter({ group_id: groupId, status: 'active' }),
    enabled: !!groupId,
  });

  const { data: runs = [], isLoading } = useQuery({
    queryKey: ['allMemberRuns', groupId],
    queryFn: () => base44.entities.Runs.filter({ status: 'completed' }, '-start_time', 1000),
    enabled: members.length > 0,
  });

  const memberEmails = useMemo(() => new Set(members.map(m => m.user_email)), [members]);

  const ranked = useMemo(() => {
    const periodStart = getPeriodStart(period);

    const filtered = runs.filter(r => {
      if (!memberEmails.has(r.user)) return false;
      if (periodStart && r.start_time) {
        return new Date(r.start_time) >= periodStart;
      }
      return true;
    });

    const statsMap = {};
    for (const member of members) {
      statsMap[member.user_email] = {
        user_email: member.user_email,
        user_name: member.user_name,
        profile_image: member.profile_image || null,
        totalDistance: 0,
        runCount: 0,
      };
    }
    for (const r of filtered) {
      if (statsMap[r.user]) {
        statsMap[r.user].totalDistance += r.distance_km || 0;
        statsMap[r.user].runCount += 1;
      }
    }

    return Object.values(statsMap).sort((a, b) => b.totalDistance - a.totalDistance);
  }, [runs, members, memberEmails, period]);

  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  return (
    <div>
      {/* Period Switch */}
      <div className="flex gap-2 mb-5 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
            style={period === p.key
              ? { background: '#BFFF00', color: '#0A0A0A' }
              : { color: 'rgba(255,255,255,0.6)' }
            }
          >
            {p.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500 text-sm">Loading...</div>
      ) : ranked.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">No runs recorded yet</div>
      ) : (
        <>
          {/* Top 3 Podium */}
          <TopThree members={top3} />

          {/* Full List */}
          <div className="space-y-2">
            {ranked.map((member, index) => (
              <motion.div
                key={member.user_email}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{
                  background: index < 3
                    ? 'rgba(191,255,0,0.06)'
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${index < 3 ? 'rgba(191,255,0,0.15)' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                <div className="w-8 flex justify-center">
                  <RankIcon index={index} />
                </div>
                <Avatar className="w-9 h-9">
                  <AvatarImage src={member.profile_image} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-700 text-white text-xs font-bold">
                    {getInitials(member.user_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{member.user_name}</p>
                  <p className="text-xs text-gray-500">{member.runCount} run{member.runCount !== 1 ? 's' : ''}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm" style={{ color: '#BFFF00' }}>{member.totalDistance.toFixed(1)}</p>
                  <p className="text-xs text-gray-500">km</p>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}