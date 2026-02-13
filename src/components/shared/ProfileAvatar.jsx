import React, { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Camera, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ProfileAvatar({ 
  user, 
  size = 'lg', 
  editable = false, 
  onImageUpdate,
  className = "" 
}) {
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.auth.updateMe({ profile_image: file_url });
    if (onImageUpdate) onImageUpdate(file_url);
    setIsUploading(false);
  };

  return (
    <div className={`relative ${className}`}>
      <Avatar className={`${sizeClasses[size]}`} style={{ background: '#050508', boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}>
        {user?.profile_image ? (
          <AvatarImage src={user.profile_image} alt={user.full_name} className="object-cover" />
        ) : null}
        <AvatarFallback className="text-xl font-medium text-white" style={{ background: '#050508' }}>
          {getInitials(user?.full_name)}
        </AvatarFallback>
      </Avatar>

      {editable && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg neon-glow"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
          </motion.button>
        </>
      )}
    </div>
  );
}