import React from 'react';
import { X } from 'lucide-react';
import PostComposer from '@/components/post/PostComposer';

export default function CreatePostModal({ open, onClose, onSubmit, user }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 flex items-end justify-center z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-2xl overflow-y-auto"
        style={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none', maxHeight: '90dvh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle + Title */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div className="w-8 h-1 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: 36 }} />
          <h2 className="text-sm font-semibold text-white">สร้างโพสต์ใหม่</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="px-4 pb-6">
          <PostComposer
            mode="feed"
            user={user}
            onSubmit={onSubmit}
            onSuccess={onClose}
          />
        </div>
      </div>
    </div>
  );
}