import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GroupAvatar from '@/components/group/GroupAvatar';
import { getGroupCategoryLabel, getGroupPrivacy, getGroupMemberCount } from '@/components/group/groupHelpers';

const CATEGORY_EMOJI = {
  marathon_training: '🏃‍♂️',
  local_club: '📍',
  beginners: '🌱',
  advanced: '⚡',
  trail_running: '⛰️',
  social: '🎉',
  other: '✨',
};

export default function GroupCard({ group, variant = 'my', onClick, onJoin, isJoining = false }) {
  const privacy = getGroupPrivacy(group);
  const categoryLabel = getGroupCategoryLabel(group);
  const memberCount = getGroupMemberCount(group);
  const fallbackEmoji = CATEGORY_EMOJI[group?.category] || '✨';

  if (variant === 'my') {
    return (
      <motion.button
        onClick={onClick}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 rounded-2xl p-4 flex items-center gap-4"
      >
        <GroupAvatar group={group} size="lg" variant="my" fallbackEmoji={fallbackEmoji} />
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-white">{group.name}</p>
            {privacy === 'private' && <Lock className="w-3 h-3 text-gray-500" />}
          </div>
          <p className="text-xs text-gray-500 line-clamp-1">{group.description || 'No description'}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-gray-600">{memberCount} members</span>
            <span className="text-xs text-purple-400">{categoryLabel}</span>
          </div>
        </div>
      </motion.button>
    );
  }

  // variant === 'discover'
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4"
    >
      <GroupAvatar group={group} size="lg" variant="discover" fallbackEmoji={fallbackEmoji} />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium text-white">{group.name}</p>
          {privacy === 'public'
            ? <Globe className="w-3 h-3 text-gray-500" />
            : <Lock className="w-3 h-3 text-gray-500" />
          }
        </div>
        <p className="text-xs text-gray-500 line-clamp-1 mb-1">{group.description || 'No description'}</p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-600">{memberCount} members</span>
          <span className="text-xs text-emerald-400">{categoryLabel}</span>
        </div>
      </div>
      <Button
        onClick={onJoin}
        disabled={isJoining}
        size="sm"
        style={{ backgroundColor: '#BFFF00', color: '#0A0A0A' }}
      >
        Join
      </Button>
    </motion.div>
  );
}