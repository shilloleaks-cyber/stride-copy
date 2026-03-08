import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { startOfWeek, startOfMonth, isAfter } from 'date-fns';

const PERIODS = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'all', label: 'All' },
];

export default function RankTab({ groupId, currentUserEmail }) {
  const [period, setPeriod] = useState('week');

  const { data: members = [] } = useQuery({
    queryKey: ['groupMembers', groupId],
    queryFn: () => base44.entities.GroupMember.filter({ group_id: groupId, status: 'active' }),
    enabled: !!groupId,
  });

  const memberEmails = members.map(m => m.user_email);

  const { data: allRuns = [], isLoading } = useQuery({
    queryKey: ['groupRuns', groupId],
    queryFn: async () => {
      if (!memberEmails.length) return [];
      const runs = await base44.entities.Runs.filter({ status: 'completed' }, '-start_time', 500);
      return runs.filter(r => memberEmails.includes(r.user));
    },
    enabled: memberEmails.length > 0,
  });

  const filteredRuns = useMemo(() => {
    const now = new Date();
    let cutoff = null;
    if (period === 'week') cutoff = startOfWeek(now, { weekStartsOn: 1 });
    else if (period === 'month') cutoff = startOfMonth(now);
    if (!cutoff) return allRuns;
    return allRuns.filter(r => r.start_time && isAfter(new Date(r.start_time), cutoff));
  }, [allRuns, period]);

  const leaderboard = useMemo(() => {
    const map = {};
    for (const m of members) {
      map[m.user_email] = { email: m.user_email, name: m.user_name || m.user_email, image: m.user_image, distance: 0, runs: 0 };
    }
    for (const r of filteredRuns) {
      if (map[r.user]) {
        map[r.user].distance += r.distance_km || 0;
        map[r.user].runs += 1;
      }
    }
    return Object.values(map).sort((a, b) => b.distance - a.distance);
  }, [members, filteredRuns]);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div>
      {/* Period Switch */}
      <div className="groupTabs" style={{ margin: '0 0 16px 0' }}>
        {PERIODS.map(p => (
          <button
            key={p.key}
            type="button"
            className={`groupTab ${period === p.key ? 'active' : ''}`}
            onClick={() => setPeriod(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#BFFF00', borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <>
          {/* Top 3 */}
          {leaderboard.length > 0 && (
            <div className="flex items-end justify-center gap-3 mb-6 pt-2">
              {[leaderboard[1], leaderboard[0], leaderboard[2]].map((entry, visualIdx) => {
                if (!entry) return <div key={visualIdx} className="w-24" />;
                const rank = leaderboard.indexOf(entry);
                const isCenter = visualIdx === 1;
                return (
                  <motion.div
                    key={entry.email}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: visualIdx * 0.1 }}
                    className="flex flex-col items-center"
                    style={{ width: isCenter ? 96 : 80 }}
                  >
                    <div className="text-xl mb-1">{medals[rank] || ''}</div>
                    <div
                      className="rounded-full flex items-center justify-center font-bold text-white mb-1 overflow-hidden"
                      style={{
                        width: isCenter ? 56 : 44,
                        height: isCenter ? 56 : 44,
                        background: 'linear-gradient(135deg, #8A2BE2, #BFFF00)',
                        fontSize: isCenter ? 20 : 16,
                        boxShadow: isCenter ? '0 0 20px rgba(191,255,0,0.4)' : 'none',
                      }}
                    >
                      {entry.image ? (
                        <img src={entry.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (entry.name?.[0] || '?').toUpperCase()
                      )}
                    </div>
                    <p className="text-white text-xs font-bold text-center leading-tight" style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.name?.split(' ')[0]}
                    </p>
                    <p style={{ color: '#BFFF00', fontSize: 13, fontWeight: 800 }}>{entry.distance.toFixed(1)} km</p>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>{entry.runs} runs</p>
                    {isCenter && (
                      <div style={{ height: 32, width: '100%', background: 'rgba(191,255,0,0.12)', borderRadius: '8px 8px 0 0', marginTop: 4 }} />
                    )}
                    {!isCenter && (
                      <div style={{ height: 20, width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: '8px 8px 0 0', marginTop: 4 }} />
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Full List */}
          <div className="space-y-2">
            {leaderboard.map((entry, idx) => {
              const isMe = entry.email === currentUserEmail;
              return (
                <motion.div
                  key={entry.email}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{
                    background: isMe ? 'rgba(191,255,0,0.08)' : 'rgba(255,255,255,0.04)',
                    border: isMe ? '1px solid rgba(191,255,0,0.25)' : '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <span className="text-sm font-bold" style={{ width: 20, color: idx < 3 ? '#BFFF00' : 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                    {idx < 3 ? medals[idx] : `${idx + 1}`}
                  </span>
                  <div
                    className="rounded-full flex items-center justify-center font-bold text-white overflow-hidden flex-shrink-0"
                    style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #8A2BE2, #5B1FA0)', fontSize: 14 }}
                  >
                    {entry.image ? (
                      <img src={entry.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (entry.name?.[0] || '?').toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{entry.name} {isMe && <span style={{ color: '#BFFF00', fontSize: 11 }}>(you)</span>}</p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{entry.runs} runs</p>
                  </div>
                  <p style={{ color: '#BFFF00', fontWeight: 800, fontSize: 15 }}>{entry.distance.toFixed(1)} <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>km</span></p>
                </motion.div>
              );
            })}
            {leaderboard.length === 0 && (
              <div className="text-center py-12 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-4xl mb-3">🏃</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>No runs recorded yet</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}