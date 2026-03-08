import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';
import GroupsPanel from '@/components/group/GroupsPanel';

export default function Groups() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-white pb-24" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Header */}
      <div className="sticky top-0 z-50 px-6 pt-6 pb-4 border-b backdrop-blur-lg" style={{ backgroundColor: 'rgba(10, 10, 10, 0.95)', borderColor: 'rgba(138, 43, 226, 0.3)' }}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(createPageUrl('Feed'))}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-medium">Groups</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="px-6 mt-6">
        <GroupsPanel showHeader={false} showCreateButton={true} />
      </div>
    </div>
  );
}