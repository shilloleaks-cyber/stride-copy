import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, UserMinus, MapPin, Activity, Coins } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export default function UserCard({ user, isFollowing, onFollow, onUnfollow, stats }) {
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl p-4 flex items-center justify-between transition-colors"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(191,255,0,0.15)' }}
    >
      <div className="flex items-center gap-3">
        <Avatar className="w-12 h-12">
          {user.profile_image ? (
            <AvatarImage src={user.profile_image} alt={user.full_name} className="object-cover" />
          ) : null}
          <AvatarFallback className="text-sm font-bold" style={{ background: 'rgba(138,43,226,0.3)', color: '#BFFF00' }}>
            {getInitials(user.full_name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-white">{user.full_name || 'Runner'}</p>
          {user.bio && (
            <p className="text-xs text-gray-500 line-clamp-1 max-w-[150px]">{user.bio}</p>
          )}
          {stats && (
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" style={{ color: '#BFFF00' }} />
                {stats.totalDistance?.toFixed(1) || 0} กม.
              </span>
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.4)' }} />
                {stats.totalRuns || 0} ครั้ง
              </span>
              {user.token_balance > 0 && (
                <span className="flex items-center gap-1">
                  <Coins className="w-3 h-3 text-yellow-400" />
                  {user.token_balance?.toFixed(0) || 0}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      
      {isFollowing ? (
        <button
          onClick={() => onUnfollow(user.email)}
          style={{
            padding: '6px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            background: 'rgba(191,255,0,0.08)', border: '1px solid rgba(191,255,0,0.25)',
            color: '#BFFF00', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <UserMinus className="w-4 h-4" />
          เลิกติดตาม
        </button>
      ) : (
        <button
          onClick={() => onFollow(user.email)}
          style={{
            padding: '6px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            background: '#BFFF00', border: 'none',
            color: '#0A0A0A', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <UserPlus className="w-4 h-4" />
          ติดตาม
        </button>
      )}
    </motion.div>
  );
}