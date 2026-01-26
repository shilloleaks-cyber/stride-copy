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
      className="bg-white/5 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between hover:border-emerald-500/40 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Avatar className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 neon-border">
          {user.profile_image ? (
            <AvatarImage src={user.profile_image} alt={user.full_name} className="object-cover" />
          ) : null}
          <AvatarFallback className="text-sm bg-gradient-to-br from-emerald-400 to-emerald-600 text-white">
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
                <MapPin className="w-3 h-3 text-emerald-400" />
                {stats.totalDistance?.toFixed(1) || 0} กม.
              </span>
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-blue-400" />
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
        <Button 
          onClick={() => onUnfollow(user.email)}
          variant="outline" 
          size="sm"
          className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
        >
          <UserMinus className="w-4 h-4 mr-1" />
          เลิกติดตาม
        </Button>
      ) : (
        <Button 
          onClick={() => onFollow(user.email)}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 neon-glow"
        >
          <UserPlus className="w-4 h-4 mr-1" />
          ติดตาม
        </Button>
      )}
    </motion.div>
  );
}