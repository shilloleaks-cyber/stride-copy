import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Gift, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function ClaimHistory() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['reward-claim-logs-recent'],
    // BUG FIX: sort by created_date (built-in) since claimed_at is a custom field
    // the SDK's list() sort param only works on built-in fields reliably
    queryFn: () => base44.entities.RewardClaimLog.list('-created_date', 50),
    refetchInterval: 15000, // auto-refresh every 15s on event day
  });

  if (isLoading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#BFFF00' }} />
    </div>
  );

  if (logs.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Gift className="w-12 h-12 mb-4" style={{ color: 'rgba(255,255,255,0.1)' }} />
      <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.3)' }}>No claims yet</p>
      <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Claims will appear here in real-time</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-widest px-1 mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
        Recent Claims ({logs.length})
      </p>
      {logs.map((log) => (
        <div
          key={log.id}
          className="rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,210,110,0.1)' }}>
            <Gift className="w-5 h-5" style={{ color: 'rgb(0,210,110)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-white truncate">
              {log.first_name} {log.last_name}
              {log.bib_number && <span className="ml-2 font-normal text-xs" style={{ color: '#BFFF00' }}>#{log.bib_number}</span>}
            </p>
            <p className="text-xs truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{log.reward_name}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {log.claimed_at ? format(new Date(log.claimed_at), 'h:mm a') : ''}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}