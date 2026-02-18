import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Footprints } from 'lucide-react';

export default function History() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-white flex flex-col" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Header */}
      <div className="px-6 pt-6 flex items-center justify-between">
        <button
          onClick={() => navigate(createPageUrl('Home'))}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-medium">Run History</h1>
        <div className="w-10" />
      </div>

      {/* Fresh Start Empty State */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-6">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle, rgba(191,255,0,0.15) 0%, rgba(138,43,226,0.10) 100%)',
            border: '2px solid rgba(191,255,0,0.25)',
            boxShadow: '0 0 40px rgba(191,255,0,0.15)',
          }}
        >
          <Footprints className="w-10 h-10" style={{ color: '#BFFF00' }} />
        </div>

        <div>
          <h2 className="text-3xl font-black mb-2" style={{ color: '#BFFF00' }}>Fresh Start</h2>
          <p className="text-base" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Your new running journey begins today.
          </p>
        </div>

        <button
          onClick={() => navigate(createPageUrl('ActiveRun'))}
          className="px-10 py-4 rounded-full font-bold text-base"
          style={{
            background: 'linear-gradient(135deg, #BFFF00 0%, #8FD400 100%)',
            color: '#0A0A0A',
            boxShadow: '0 0 30px rgba(191,255,0,0.4)',
          }}
        >
          Start Run
        </button>
      </div>
    </div>
  );
}