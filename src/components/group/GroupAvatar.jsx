import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getGroupAvatar } from '@/components/group/groupHelpers';

const sizeMap = {
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-16 h-16',
};

const variantMap = {
  default: 'ring-2 ring-white/15 border border-white/10',
  my: 'ring-2 ring-purple-500/25 border border-purple-400/15',
  discover: 'ring-2 ring-emerald-500/25 border border-emerald-400/15',
};

export default function GroupAvatar({ group, size = 'md', variant = 'default', fallbackEmoji = '✨' }) {
  const src = getGroupAvatar(group);
  const sizeClass = sizeMap[size] ?? sizeMap.md;
  const variantClass = variantMap[variant] ?? variantMap.default;

  return (
    <Avatar className={`${sizeClass} ${variantClass}`}>
      {src ? (
        <AvatarImage src={src} className="object-cover object-center" />
      ) : null}
      <AvatarFallback className="bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] text-white flex items-center justify-center">
        {fallbackEmoji}
      </AvatarFallback>
    </Avatar>
  );
}