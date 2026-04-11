import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import PremiumTicketCard from '@/components/stride/PremiumTicketCard';
import TicketDetail from '@/components/stride/TicketDetail';

const FILTERS = ['All', 'Official', 'Group'];

export default function StrideMyEvents() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('All');
  const [index, setIndex] = useState(0);
  const [selectedReg, setSelectedReg] = useState(null);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: regs = [], isLoading } = useQuery({
    queryKey: ['my-stride-regs', user?.email],
    queryFn: () => base44.entities.EventRegistration.filter({ user_email: user.email }, '-created_date', 100),
    enabled: !!user?.email,
  });

  const officialRegs = regs.filter(r => r.category_id !== 'rsvp' && r.status !== 'cancelled');
  const groupRegs = regs.filter(r => r.category_id === 'rsvp' && r.status !== 'cancelled');

  const filteredRegs = filter === 'Official'
    ? officialRegs
    : filter === 'Group'
      ? groupRegs
      : [...officialRegs, ...groupRegs];

  const eventIds = [...new Set(regs.map(r => r.event_id))];
  const categoryIds = [...new Set(officialRegs.map(r => r.category_id).filter(Boolean))];

  const { data: events = [] } = useQuery({
    queryKey: ['stride-events-my', eventIds.join(',')],
    queryFn: () => base44.entities.StrideEvent.list('-event_date', 100),
    enabled: eventIds.length > 0,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['stride-cats-my', categoryIds.join(',')],
    queryFn: () => base44.entities.EventCategory.list('-created_date', 200),
    enabled: categoryIds.length > 0,
  });

  const eventMap = Object.fromEntries(events.map(e => [e.id, e]));
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));

  // Reset index when filter changes or regs change
  useEffect(() => { setIndex(0); }, [filter, filteredRegs.length]);

  // Open from URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const regId = params.get('reg_id');
    if (regId && regs.length > 0) {
      const found = regs.find(r => r.id === regId);
      if (found) setSelectedReg(found);
    }
  }, [regs]);

  const total = filteredRegs.length;
  const current = filteredRegs[index] || null;

  const prev = () => setIndex(i => Math.max(0, i - 1));
  const next = () => setIndex(i => Math.min(total - 1, i + 1));

  const isEmpty = !isLoading && total === 0;

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#080808', position: 'relative', overflow: 'hidden' }}>
      {/* Background ambient glow */}
      <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(138,43,226,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '15%', right: '-10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(191,255,0,0.04) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>

        {/* ── Header ── */}
        <div style={{ padding: 'env(safe-area-inset-top, 0px) 22px 0', paddingTop: 'max(env(safe-area-inset-top, 0px), 40px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <button
              onClick={() => navigate(-1)}
              style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            >
              <ArrowLeft style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.7)' }} />
            </button>
            <div>
              <p style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 2px' }}>
                BoomX
              </p>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1 }}>My Tickets</h1>
            </div>
          </div>

          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: '0 0 20px', fontWeight: 500 }}>
            Tap card to open details
          </p>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '7px 18px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.15s',
                  ...(filter === f
                    ? { background: '#fff', color: '#0A0A0A', border: '1px solid transparent' }
                    : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }
                  ),
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* ── Main carousel area ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 22px' }}>

          {isLoading && (
            <Loader2 style={{ width: 28, height: 28, color: '#BFFF00', animation: 'spin 1s linear infinite' }} />
          )}

          {isEmpty && !isLoading && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <p style={{ fontSize: 40, margin: '0 0 12px' }}>🎟</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.6)', margin: '0 0 6px' }}>No tickets yet</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.28)', margin: '0 0 20px' }}>
                {filter !== 'All' ? `No ${filter.toLowerCase()} tickets found` : 'Register for an event to get started'}
              </p>
              <button
                onClick={() => navigate('/StrideEvents')}
                style={{ padding: '10px 24px', borderRadius: 12, background: 'rgba(191,255,0,0.1)', border: '1px solid rgba(191,255,0,0.25)', color: '#BFFF00', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Browse Events →
              </button>
            </div>
          )}

          {current && (
            <button
              onClick={() => setSelectedReg(current)}
              style={{ width: '100%', maxWidth: 360, textAlign: 'left', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
            >
              <PremiumTicketCard
                reg={current}
                event={eventMap[current.event_id]}
                category={catMap[current.category_id]}
              />
            </button>
          )}
        </div>

        {/* ── Navigation row ── */}
        {total > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, paddingBottom: 'calc(90px + env(safe-area-inset-bottom, 0px))', paddingTop: 24 }}>
            <button
              onClick={prev}
              disabled={index === 0}
              style={{
                width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: index === 0 ? 'not-allowed' : 'pointer',
                background: index === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.08)',
                border: index === 0 ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(255,255,255,0.12)',
                opacity: index === 0 ? 0.3 : 1,
              }}
            >
              <ChevronLeft style={{ width: 20, height: 20, color: 'rgba(255,255,255,0.8)' }} />
            </button>

            <p style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.45)', margin: 0, minWidth: 40, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
              {index + 1}/{total}
            </p>

            <button
              onClick={next}
              disabled={index === total - 1}
              style={{
                width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: index === total - 1 ? 'not-allowed' : 'pointer',
                background: index === total - 1 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.08)',
                border: index === total - 1 ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(255,255,255,0.12)',
                opacity: index === total - 1 ? 0.3 : 1,
              }}
            >
              <ChevronRight style={{ width: 20, height: 20, color: 'rgba(255,255,255,0.8)' }} />
            </button>
          </div>
        )}
      </div>

      {/* ── Ticket detail sheet ── */}
      {selectedReg && (
        <TicketDetail
          reg={selectedReg}
          event={eventMap[selectedReg.event_id]}
          category={catMap[selectedReg.category_id]}
          onClose={() => setSelectedReg(null)}
          onRemoved={() => {
            setSelectedReg(null);
            queryClient.invalidateQueries({ queryKey: ['my-stride-regs', user?.email] });
          }}
        />
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}