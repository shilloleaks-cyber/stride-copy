import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Hash, Shirt, Calendar, Tag, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

function InfoRow({ icon: Icon, label, value, accent }) {
  return (
    <div className="flex items-center gap-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <Icon className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</p>
        <p className="font-bold text-sm truncate" style={accent ? { color: accent } : { color: '#fff' }}>{value || '—'}</p>
      </div>
    </div>
  );
}

export default function ClaimResultCard({ reg, event, category, coupon, existingClaim, onClaim, isClaiming }) {
  const name = `${reg.first_name} ${reg.last_name}`;
  const notCheckedIn = !reg.checked_in;
  const notConfirmed = reg.status !== 'confirmed';
  const alreadyClaimed = !!existingClaim;
  const eligible = !notCheckedIn && !notConfirmed && !alreadyClaimed;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
      {/* Runner header */}
      <div className="px-5 py-4" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-xl font-black text-white">{name}</p>
        <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{reg.user_email}</p>
      </div>

      {/* Details */}
      <div className="px-5 py-1">
        {event && <InfoRow icon={Calendar} label="Event" value={event.title} />}
        {category && <InfoRow icon={Tag} label="Category" value={category.name} />}
        <InfoRow icon={Hash} label="Bib Number" value={reg.bib_number || 'Pending'} accent={reg.bib_number ? '#BFFF00' : undefined} />
        <InfoRow icon={Shirt} label="Shirt Size" value={reg.shirt_size} />
        {coupon && <InfoRow icon={Tag} label="Reward" value={coupon.title} accent="#BFFF00" />}
      </div>

      {/* Status block */}
      <div className="px-5 pb-5 pt-3 space-y-4">
        {/* Not confirmed */}
        {notConfirmed && (
          <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: 'rgba(255,200,80,0.08)', border: '1px solid rgba(255,200,80,0.2)' }}>
            <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: 'rgba(255,200,80,1)' }} />
            <div>
              <p className="text-sm font-bold text-white">Registration Not Confirmed</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Status: <span className="capitalize">{reg.status}</span></p>
            </div>
          </div>
        )}

        {/* Not checked in */}
        {!notConfirmed && notCheckedIn && (
          <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)' }}>
            <XCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'rgba(255,100,100,1)' }} />
            <div>
              <p className="text-sm font-bold text-white">Not Eligible</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>User has not checked in yet</p>
            </div>
          </div>
        )}

        {/* Already claimed */}
        {alreadyClaimed && (
          <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: 'rgba(255,200,80,0.08)', border: '1px solid rgba(255,200,80,0.2)' }}>
            <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: 'rgba(255,200,80,1)' }} />
            <div>
              <p className="text-sm font-bold text-white">Already Claimed</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {existingClaim.claimed_at ? format(new Date(existingClaim.claimed_at), 'h:mm a · MMM d') : ''}
              </p>
            </div>
          </div>
        )}

        {/* Eligible */}
        {eligible && (
          <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: 'rgba(0,210,110,0.08)', border: '1px solid rgba(0,210,110,0.2)' }}>
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: 'rgb(0,210,110)' }} />
            <div>
              <p className="text-sm font-bold text-white">Checked-in ✓</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Claim Status: Not Claimed</p>
            </div>
          </div>
        )}

        {/* Claim button */}
        <button
          onClick={onClaim}
          disabled={!eligible || isClaiming}
          className="w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.97]"
          style={eligible
            ? { background: '#BFFF00', color: '#0A0A0A' }
            : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.2)', cursor: 'not-allowed' }
          }
        >
          {isClaiming ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : 'CLAIM REWARD'}
        </button>
      </div>
    </div>
  );
}