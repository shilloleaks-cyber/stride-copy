import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trophy, Medal, FileText } from 'lucide-react';

function formatTime(seconds) {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatPace(paceMinPerKm) {
  if (!paceMinPerKm) return '—';
  const m = Math.floor(paceMinPerKm);
  const s = Math.round((paceMinPerKm - m) * 60);
  return `${m}:${String(s).padStart(2, '0')}/km`;
}

export default function PostEventResult({ registrationId, userEmail, event }) {
  const { data: results = [] } = useQuery({
    queryKey: ['event-result', registrationId],
    queryFn: () => base44.entities.EventResult.filter({ registration_id: registrationId, user_email: userEmail }),
    enabled: !!registrationId && !!userEmail,
  });

  const result = results[0];

  // Only show if event has passed
  const eventPassed = event?.event_date && new Date(event.event_date) < new Date();
  if (!eventPassed) return null;

  if (!result) {
    // Event has passed but no result yet
    return (
      <div className="mx-5 mb-4 px-4 py-3 rounded-2xl flex items-center gap-3" style={{ background: 'rgba(138,43,226,0.07)', border: '1px solid rgba(138,43,226,0.2)' }}>
        <Trophy className="w-5 h-5 flex-shrink-0" style={{ color: 'rgba(138,43,226,0.6)' }} />
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Official results will be posted here after the event.</p>
      </div>
    );
  }

  return (
    <div className="mx-5 mb-4 rounded-2xl overflow-hidden" style={{ background: 'rgba(138,43,226,0.1)', border: '1px solid rgba(138,43,226,0.25)' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <Trophy className="w-5 h-5" style={{ color: '#BFFF00' }} />
        <p className="text-sm font-black text-white">Finisher Results</p>
        {result.status === 'dnf' && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,80,80,0.2)', color: 'rgba(255,100,100,1)' }}>DNF</span>}
        {result.status === 'dns' && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,150,80,0.2)', color: 'rgba(255,160,80,1)' }}>DNS</span>}
      </div>

      {result.status === 'finished' && (
        <div className="px-4 pb-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(0,0,0,0.3)' }}>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Finish Time</p>
            <p className="text-xl font-black" style={{ color: '#BFFF00' }}>{formatTime(result.finish_time_seconds)}</p>
          </div>
          <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(0,0,0,0.3)' }}>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Avg Pace</p>
            <p className="text-xl font-black text-white">{formatPace(result.pace_min_per_km)}</p>
          </div>
          {result.overall_rank && (
            <div className="rounded-xl px-3 py-2 flex items-center gap-2" style={{ background: 'rgba(0,0,0,0.3)' }}>
              <Medal className="w-4 h-4" style={{ color: 'rgba(255,200,80,1)' }} />
              <div>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Overall</p>
                <p className="text-lg font-black text-white">#{result.overall_rank}</p>
              </div>
            </div>
          )}
          {result.category_rank && (
            <div className="rounded-xl px-3 py-2 flex items-center gap-2" style={{ background: 'rgba(0,0,0,0.3)' }}>
              <Medal className="w-4 h-4" style={{ color: 'rgba(191,255,0,0.7)' }} />
              <div>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Category</p>
                <p className="text-lg font-black text-white">#{result.category_rank}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* E-Certificate link */}
      {result.certificate_url && (
        <div className="px-4 pb-4">
          <a
            href={result.certificate_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'rgba(191,255,0,0.12)', color: '#BFFF00', border: '1px solid rgba(191,255,0,0.2)' }}
          >
            <FileText className="w-4 h-4" /> Download E-Certificate
          </a>
        </div>
      )}
    </div>
  );
}