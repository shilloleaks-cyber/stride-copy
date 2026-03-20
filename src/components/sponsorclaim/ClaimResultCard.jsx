import React from 'react';
import { CheckCircle2, AlertCircle, XCircle, Clock, Shirt, Hash, Calendar, Tag, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

function InfoRow({ icon: Icon, label, value, accent }) {
  return (
    <div className="flex items-center gap-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <Icon className="w-4 h-4" style={{ color: accent || 'rgba(255,255,255,0.4)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</p>
        <p className="font-bold text-sm truncate" style={{ color: accent || 'white' }}>{value || '—'}</p>
      </div>
    </div>
  );
}

export default function ClaimResultCard({ reg, event, category, reward, claimLog, onClaim, isClaiming }) {
  // Derive claim state
  const notCheckedIn = !reg.checked_in;
  const alreadyClaimed = !!claimLog;
  const eligible = reg.status === 'confirmed' && reg.checked_in && !alreadyClaimed;

  return (
    <div className="rounded-2xl overflow-hidden" style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: eligible ? '0 0 30px rgba(191,255,0,0.06)' : 'none',
    }}>
      {/* Runner header */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <p className="text-xl font-black text-white">{reg.first_name} {reg.last_name}</p>
        <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{reg.user_email}</p>
      </div>

      {/* Details */}
      <div className="px-5 py-1">
        {event && <InfoRow icon={Calendar} label="Event" value={event.title} />}
        {category && <InfoRow icon={Tag} label="Category" value={category.name} />}
        <InfoRow icon={Hash} label="Bib Number" value={reg.bib_number || 'Pending'} accent={reg.bib_number ? '#BFFF00' : undefined} />
        {reg.shirt_size && <InfoRow icon={Shirt} label="Shirt Size" value={reg.shirt_size} />}
        {reward && <InfoRow icon={Tag} label="Reward" value={reward.reward_name} accent="#BFFF00" />}
      </div>

      {/* Status banner */}
      <div className="mx-5 mb-4 mt-2 rounded-2xl px-4 py-3 flex items-center gap-3" style={
        alreadyClaimed
          ? { background: 'rgba(255,200,80,0.08)', border: '1px solid rgba(255,200,80,0.25)' }
          : notCheckedIn
            ? { background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)' }
            : { background: 'rgba(0,210,110,0.08)', border: '1px solid rgba(0,210,110,0.25)' }
      }>
        {alreadyClaimed ? (
          <>
            <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'rgba(255,200,80,1)' }} />
            <div>
              <p className="text-sm font-bold text-white">Already Claimed</p>
              {claimLog?.claimed_at && (
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {format(new Date(claimLog.claimed_at), 'h:mm a · MMM d, yyyy')}
                </p>
              )}
            </div>
          </>
        ) : notCheckedIn ? (
          <>
            <XCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'rgba(255,80,80,1)' }} />
            <div>
              <p className="text-sm font-bold text-white">Not Eligible</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>User has not checked in yet</p>
            </div>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: 'rgb(0,210,110)' }} />
            <div>
              <p className="text-sm font-bold text-white">Checked-In · Ready to Claim</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Claim Status: Not Claimed</p>
            </div>
          </>
        )}
      </div>

      {/* Claim button */}
      {eligible && (
        <div className="px-5 pb-5">
          <button
            onClick={onClaim}
            disabled={isClaiming}
            className="w-full py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all active:scale-[0.97]"
            style={{ background: 'rgb(0,210,110)', color: '#0A0A0A', boxShadow: '0 0 30px rgba(0,210,110,0.3)' }}
          >
            {isClaiming
              ? <><Loader2 className="w-6 h-6 animate-spin" /> Claiming...</>
              : <><CheckCircle2 className="w-6 h-6" /> CLAIM REWARD</>
            }
          </button>
        </div>
      )}
    </div>
  );
}