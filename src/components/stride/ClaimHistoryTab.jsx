import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function ClaimHistoryTab({ staffEmail, sponsorId }) {
  const { data: claims = [], isLoading } = useQuery({
    queryKey: ['reward-claim-log', staffEmail],
    queryFn: () => base44.entities.RewardClaimLog.filter(
      sponsorId ? { sponsor_id: sponsorId } : { claimed_by_staff: staffEmail },
      '-claimed_at',
      10
    ),
    refetchInterval: 10000,
  });

  if (isLoading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#BFFF00' }} />
    </div>
  );

  if (!claims.length) return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <Clock className="w-10 h-10 mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
      <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>No claims yet</p>
      <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Recent claims will appear here</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {claims.map(claim => (
        <div
          key={claim.id}
          className="rounded-2xl p-4 flex items-center gap-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm"
            style={{ background: 'rgba(191,255,0,0.1)', color: '#BFFF00' }}
          >
            {(claim.bib_number || '?').slice(0, 3)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm truncate">{claim.first_name} {claim.last_name}</p>
            <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>{claim.reward_label}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs font-semibold" style={{ color: '#BFFF00' }}>#{claim.bib_number || '—'}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {claim.claimed_at ? format(new Date(claim.claimed_at), 'h:mm a') : '—'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}