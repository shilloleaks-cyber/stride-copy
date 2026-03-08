import React from 'react';
import { X } from 'lucide-react';
import PostComposer from '@/components/post/PostComposer';

export default function CreatePostModal({ open, onClose, onSubmit, user }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-2xl"
        style={{
          backgroundColor: '#0A0A0A',
          border: '1px solid rgba(255,255,255,0.08)',
          borderBottom: 'none',
          maxHeight: '90dvh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle + Title */}
        <div
          className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0 relative"
          style={{
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            className="absolute left-1/2 -translate-x-1/2 top-2 h-1 rounded-full"
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              width: 36,
            }}
          />
          <h2 className="text-sm font-semibold text-white">สร้างโพสต์ใหม่</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Scroll area */}
        <div
          className="flex-1 overflow-y-auto px-4 pt-3"
          style={{
            minHeight: 0,
            paddingBottom: 'calc(96px + env(safe-area-inset-bottom))',
          }}
        >
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