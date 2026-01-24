import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, UserMinus, MapPin } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
      className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <Avatar className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600">
          <AvatarFallback className="text-sm bg-gradient-to-br from-purple-400 to-purple-600 text-white">
            {getInitials(user.full_name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-white">{user.full_name}</p>
          {stats && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="w-3 h-3" />
              <span>{stats.totalDistance?.toFixed(1) || 0} กม.</span>
            </div>
          )}
        </div>
      </div>
      
      {isFollowing ? (
        <Button 
          onClick={() => onUnfollow(user.email)}
          variant="outline" 
          size="sm"
          className="border-white/20 text-gray-400 hover:bg-white/10 hover:text-white"
        >
          <UserMinus className="w-4 h-4 mr-1" />
          เลิกติดตาม
        </Button>
      ) : (
        <Button 
          onClick={() => onFollow(user.email)}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <UserPlus className="w-4 h-4 mr-1" />
          ติดตาม
        </Button>
      )}
    </motion.div>
  );
}