import React, { useState } from 'react';
import PaymentUpload from '@/components/stride/PaymentUpload';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, MapPin, Users, Loader2, CheckCircle2, ChevronRight, Settings } from 'lucide-react';
import { format } from 'date-fns';
import RegistrationForm from '@/components/stride/RegistrationForm';
import CommunityRSVP from '@/components/stride/CommunityRSVP';
import EventShareButton from '@/components/stride/EventShareButton';
import EventInviteSheet from '@/components/stride/EventInviteSheet';
import { useAuthGate } from '@/hooks/useAuthGate';
import LoginGateModal from '@/components/auth/LoginGateModal';

const CAT_COLORS = ['#BFFF00', '#8A2BE2', 'rgb(0,200,180)', 'rgb(255,180,0)', 'rgb(255,80,130)'];

export default function StrideEventDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = new URLSearchParams(window.location.search);
  const eventId = params.get('id');

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [paymentReg, setPaymentReg] = useState(null); // set when paid reg just created

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const { showGate, setShowGate, requireAuth } = useAuthGate(user);

  const { data: event, isLoading } = useQuery({
    queryKey: ['stride-event', eventId],
    queryFn: async () => {
      const r = await base44.entities.StrideEvent.filter({ id: eventId });
      return r[0] || null;
    },
    enabled: !!eventId,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['event-categories', eventId],
    queryFn: () => base44.entities.EventCategory.filter({ event_id: eventId, is_active: true }),
    enabled: !!eventId,
  });

  const { data: myReg } = useQuery({
    queryKey: ['my-reg', eventId, user?.email],
    queryFn: async () => {
      const r = await base44.entities.EventRegistration.filter({ event_id: eventId, user_email: user.email });
      // Only count active registrations (ignore cancelled/rejected)
      const active = r.filter(reg => reg.status !== 'cancelled' && reg.status !== 'rejected');
      return active[0] || null;
    },
    enabled: !!eventId && !!user?.email,
  });

  const handleRegisterSuccess = (reg) => {
    setShowForm(false);
    queryClient.invalidateQueries({ queryKey: ['my-reg', eventId, user?.email] });
    queryClient.invalidateQueries({ queryKey: ['my-stride-regs', user?.email] });
    // If paid, immediately open payment flow
    if (selectedCategory?.price > 0 && reg) {
      setPaymentReg(reg);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A0A0A' }}>
      <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#BFFF00' }} />
    </div>
  );
  if (!event) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white" style={{ backgroundColor: '#0A0A0A' }}>
      <p>Event not found</p>
      <button onClick={() => navigate('/StrideEvents')} className="mt-3 text-sm" style={{ color: '#BFFF00' }}>Back</button>
    </div>
  );

  const isOpen = event.status === 'open';
  const alreadyRegistered = !!myReg;
  const isCommunityEvent = event.event_type === 'community';

  return (
    <div className="min-h-screen text-white pb-32" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Banner */}
      <div className="relative" style={{ height: 200 }}>
        {event.banner_image
          ? <img src={event.banner_image} alt={event.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, rgba(191,255,0,0.15), rgba(138,43,226,0.2))' }} />
        }
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(10,10,10,0.9))' }} />
        <button onClick={() => navigate(-1)} className="absolute top-10 left-4 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        {/* Share + Invite actions */}
        {user && (
          <div className="absolute top-10 right-4 flex items-center gap-2">
            <EventShareButton event={event} user={user} />
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{
                background: '#BFFF00',
                border: 'none',
                borderRadius: 14,
                padding: '10px 16px',
                color: '#0A0A0A',
                fontSize: 13,
                fontWeight: 700,
                minHeight: 44,
              }}
            >
              <Users style={{ width: 15, height: 15 }} /> Invite
            </button>
          </div>
        )}
      </div>

      <div className="px-6 pt-4 space-y-6">
        {/* Title + status */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full capitalize" style={{
              background: isOpen ? 'rgba(0,210,110,0.15)' : 'rgba(255,255,255,0.06)',
              color: isOpen ? 'rgb(0,210,110)' : 'rgba(255,255,255,0.4)',
              border: `1px solid ${isOpen ? 'rgba(0,210,110,0.3)' : 'rgba(255,255,255,0.1)'}`
            }}>
              {event.status}
            </span>
            {alreadyRegistered && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: 'rgba(191,255,0,0.12)', color: '#BFFF00', border: '1px solid rgba(191,255,0,0.25)' }}>
                <CheckCircle2 className="w-3 h-3" /> Registered
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white">{event.title}</h1>
          {event.organizer_name && <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>by {event.organizer_name}</p>}
        </div>

        {/* Meta */}
        <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 flex-shrink-0" style={{ color: '#BFFF00' }} />
            <div>
              <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Race Day</p>
              <p className="text-white font-semibold">{event.event_date ? format(new Date(event.event_date), 'EEEE, MMMM d, yyyy') : '—'}{event.start_time ? ` · ${event.start_time}` : ''}</p>
            </div>
          </div>
          {event.location_name && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 flex-shrink-0" style={{ color: '#8A2BE2' }} />
              <div>
                <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Location</p>
                <p className="text-white font-semibold">{event.location_name}</p>
                {event.location_address && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{event.location_address}</p>}
              </div>
            </div>
          )}
          {event.registration_close && (
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }} />
              <div>
                <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Registration Closes</p>
                <p className="text-white font-semibold">{event.registration_close ? format(new Date(event.registration_close), 'MMM d, yyyy') : '—'}</p>
              </div>
            </div>
          )}
          {/* Total registered — from backend-synced counter */}
          {event.event_type !== 'community' && (event.total_registered > 0 || event.max_participants > 0) && (
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 flex-shrink-0" style={{ color: 'rgba(191,255,0,0.6)' }} />
              <div>
                <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Registered</p>
                <p className="text-white font-semibold">
                  {event.total_registered || 0} registered
                  {event.max_participants > 0 && ` · ${Math.max(0, event.max_participants - (event.total_registered || 0))} spots left`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* User-facing: published but no categories yet */}
        {!isCommunityEvent && !alreadyRegistered && isOpen && categories.length === 0 && user?.role !== 'admin' && (
          <div style={{
            padding: '14px 16px', borderRadius: 16,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>🏷️</span>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.6 }}>
              Registration will open after race categories are added.
            </p>
          </div>
        )}

        {/* Admin: no-categories nudge */}
        {user?.role === 'admin' && !isCommunityEvent && categories.length === 0 && (
          <button
            onClick={() => navigate(`/ManageCategories?event_id=${event.id}`)}
            style={{
              width: '100%', textAlign: 'left',
              padding: '14px 16px', borderRadius: 16,
              background: 'rgba(255,180,0,0.05)',
              border: '1px solid rgba(255,180,0,0.22)',
              display: 'flex', alignItems: 'center', gap: 12,
              cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Settings style={{ width: 16, height: 16, color: 'rgba(255,180,0,0.85)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,180,0,0.9)', margin: 0 }}>
                Add Race Categories
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '3px 0 0' }}>
                Registration is hidden until at least one category is configured
              </p>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, color: 'rgba(255,180,0,0.85)',
              background: 'rgba(255,180,0,0.1)', border: '1px solid rgba(255,180,0,0.25)',
              borderRadius: 8, padding: '4px 9px', flexShrink: 0,
            }}>
              Manage →
            </span>
          </button>
        )}

        {/* Description */}
        {event.description && (
          <div>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>About</p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{event.description}</p>
          </div>
        )}

        {/* Community RSVP flow */}
        {isCommunityEvent && user && (
          <CommunityRSVP event={event} user={user} myReg={myReg} />
        )}
        {isCommunityEvent && !user && (
          <button
            onClick={() => setShowGate(true)}
            style={{
              width: '100%', padding: '15px 0', borderRadius: 16,
              background: '#BFFF00', color: '#0A0A0A',
              fontSize: 15, fontWeight: 900, border: 'none', cursor: 'pointer',
            }}
          >
            Join Event
          </button>
        )}

        {/* Official: Categories */}
        {!isCommunityEvent && categories.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Categories</p>
            <div className="space-y-3">
              {categories.map((cat, idx) => {
                const color = cat.color || CAT_COLORS[idx % CAT_COLORS.length];
                const registered = cat.registered_count || 0;
                const hasLimit = cat.max_slots > 0;
                const isFull = hasLimit && registered >= cat.max_slots;
                const nearlyFull = hasLimit && !isFull && (registered / cat.max_slots) >= 0.8;
                const spotsLeft = hasLimit ? Math.max(0, cat.max_slots - registered) : null;
                const isSelected = selectedCategory?.id === cat.id;

                // Slot availability label
                let slotLabel = null;
                let slotColor = 'rgba(255,255,255,0.35)';
                if (isFull) {
                  slotLabel = 'Full';
                  slotColor = 'rgba(255,80,80,0.85)';
                } else if (hasLimit) {
                  slotLabel = `${registered} / ${cat.max_slots}`;
                  slotColor = nearlyFull ? 'rgba(255,180,0,0.9)' : 'rgba(255,255,255,0.4)';
                } else {
                  slotLabel = registered > 0 ? `${registered} joined` : null;
                  slotColor = 'rgba(255,255,255,0.35)';
                }

                return (
                  <button
                    key={cat.id}
                    onClick={() => !alreadyRegistered && isOpen && !isFull && setSelectedCategory(isSelected ? null : cat)}
                    disabled={alreadyRegistered || !isOpen || isFull}
                    className="w-full text-left rounded-2xl p-4 transition-all"
                    style={{
                      background: isFull ? 'rgba(255,255,255,0.02)' : isSelected ? `${color}15` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isFull ? 'rgba(255,80,80,0.15)' : isSelected ? color + '50' : 'rgba(255,255,255,0.08)'}`,
                      opacity: isFull ? 0.7 : 1,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm" style={{ background: isFull ? 'rgba(255,255,255,0.05)' : color + '20', color: isFull ? 'rgba(255,255,255,0.3)' : color }}>
                          {cat.distance_km ? `${cat.distance_km}K` : cat.name.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold" style={{ color: isFull ? 'rgba(255,255,255,0.5)' : '#fff' }}>{cat.name}</p>
                          {cat.distance_km && <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{cat.distance_km} km</p>}
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        {isFull ? (
                          <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,80,80,0.12)', color: 'rgba(255,100,100,1)', border: '1px solid rgba(255,80,80,0.25)' }}>
                            Full
                          </span>
                        ) : (
                          <p className="font-black text-base" style={{ color }}>{cat.price === 0 ? 'Free' : `฿${cat.price}`}</p>
                        )}
                        {slotLabel && (
                          <p className="text-xs" style={{ color: slotColor }}>{slotLabel}</p>
                        )}
                        {!isFull && hasLimit && spotsLeft <= 10 && spotsLeft > 0 && (
                          <p className="text-xs font-bold" style={{ color: 'rgba(255,180,0,0.9)' }}>{spotsLeft} left!</p>
                        )}
                      </div>
                    </div>
                    {cat.description && <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{cat.description}</p>}
                    {/* Progress bar for limited slots */}
                    {hasLimit && (
                      <div style={{ marginTop: 10, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(100, (registered / cat.max_slots) * 100)}%`,
                          borderRadius: 99,
                          background: isFull ? 'rgba(255,80,80,0.7)' : nearlyFull ? 'rgba(255,180,0,0.8)' : color,
                          transition: 'width 0.4s ease',
                        }} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Official: Already registered — status card */}
        {!isCommunityEvent && alreadyRegistered && myReg && (() => {
          const checkedIn = myReg.checked_in;
          const confirmed = myReg.status === 'confirmed';
          const paid = myReg.payment_status === 'paid' || myReg.payment_status === 'not_required';

          let label, accent, bg, border;
          if (checkedIn) {
            label = '✓ Checked In'; accent = '#BFFF00';
            bg = 'rgba(191,255,0,0.08)'; border = 'rgba(191,255,0,0.3)';
          } else if (confirmed && paid) {
            label = '✓ Confirmed'; accent = '#BFFF00';
            bg = 'rgba(191,255,0,0.06)'; border = 'rgba(191,255,0,0.22)';
          } else if (confirmed && !paid) {
            label = '⏳ Awaiting Payment'; accent = 'rgb(255,180,0)';
            bg = 'rgba(255,180,0,0.06)'; border = 'rgba(255,180,0,0.25)';
          } else {
            label = '📋 Registration Submitted'; accent = 'rgba(255,255,255,0.6)';
            bg = 'rgba(255,255,255,0.04)'; border = 'rgba(255,255,255,0.1)';
          }

          return (
            <div style={{ padding: '14px 16px', borderRadius: 16, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: accent, margin: 0 }}>{label}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>
                  {myReg.bib_number ? `Bib #${myReg.bib_number}` : 'Bib pending'}
                  {myReg.category_id && categories.find(c => c.id === myReg.category_id)
                    ? ` · ${categories.find(c => c.id === myReg.category_id).name}`
                    : ''}
                </p>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Official: Bottom CTA */}
      {!isCommunityEvent && (
        <div className="fixed bottom-20 left-0 right-0 px-6 pb-2">
          {alreadyRegistered && myReg ? (
            <button
              onClick={() => navigate(`/StrideMyEvents?reg_id=${myReg.id}`)}
              className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              style={{ background: 'rgba(191,255,0,0.12)', border: '1px solid rgba(191,255,0,0.35)', color: '#BFFF00' }}
            >
              View My Ticket <ChevronRight className="w-5 h-5" />
            </button>
          ) : isOpen && categories.length > 0 ? (
            <button
              onClick={() => selectedCategory && requireAuth(() => setShowForm(true))}
              disabled={!selectedCategory}
              className="w-full py-4 rounded-2xl font-bold text-base transition-all"
              style={selectedCategory
                ? { background: '#BFFF00', color: '#0A0A0A' }
                : { background: 'rgba(191,255,0,0.15)', color: 'rgba(191,255,0,0.4)' }
              }
            >
              {selectedCategory ? `Register for ${selectedCategory.name}` : 'Select a Category'}
            </button>
          ) : null}
        </div>
      )}

      {/* Official: Registration Form Sheet */}
      {!isCommunityEvent && showForm && selectedCategory && (
        <RegistrationForm
          event={event}
          category={selectedCategory}
          user={user}
          onClose={() => setShowForm(false)}
          onSuccess={handleRegisterSuccess}
        />
      )}

      <LoginGateModal open={showGate} onClose={() => setShowGate(false)} />

      {/* Payment Modal — opens immediately after paid registration */}
      {paymentReg && selectedCategory && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
          <div className="flex-1" onClick={() => setPaymentReg(null)} />
          <div
            className="rounded-t-3xl overflow-hidden flex flex-col"
            style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90dvh' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div>
                <p className="font-bold text-white text-base">Complete Payment</p>
                <p className="text-xs mt-0.5 font-semibold" style={{ color: '#BFFF00' }}>
                  {selectedCategory.name} · ฿{selectedCategory.price}
                </p>
              </div>
              <button
                onClick={() => setPaymentReg(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                <ChevronRight className="w-4 h-4 text-white rotate-90" />
              </button>
            </div>

            {/* Step indicator */}
            <div className="px-6 pt-4 pb-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black" style={{ background: '#BFFF00', color: '#0A0A0A' }}>✓</div>
                  <span className="text-xs font-bold" style={{ color: '#BFFF00' }}>Registered</span>
                </div>
                <div className="flex-1 h-px" style={{ background: '#BFFF00', opacity: 0.4 }} />
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black" style={{ background: '#BFFF00', color: '#0A0A0A' }}>2</div>
                  <span className="text-xs font-bold" style={{ color: '#BFFF00' }}>Payment</span>
                </div>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}>3</div>
                  <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>Review</span>
                </div>
              </div>
            </div>

            {/* Payment Upload content */}
            <div className="flex-1 overflow-y-auto px-6 py-4" style={{ WebkitOverflowScrolling: 'touch' }}>
              <PaymentUpload
                registration={paymentReg}
                category={selectedCategory}
              />
            </div>

            {/* Done button */}
            <div className="px-6 pb-8 pt-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <button
                onClick={() => {
                  setPaymentReg(null);
                  navigate(`/StrideMyEvents?reg_id=${paymentReg.id}`);
                }}
                className="w-full py-3 rounded-2xl font-bold text-sm"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)' }}
              >
                I'll pay later · View My Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Sheet */}
      {showInvite && user && (
        <EventInviteSheet
          event={event}
          user={user}
          onClose={() => setShowInvite(false)}
        />
      )}
    </div>
  );
}