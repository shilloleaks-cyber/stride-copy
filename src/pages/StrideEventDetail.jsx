import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, MapPin, Users, Loader2, CheckCircle2, ChevronRight, Settings } from 'lucide-react';
import { format } from 'date-fns';
import RegistrationForm from '@/components/stride/RegistrationForm';
import CommunityRSVP from '@/components/stride/CommunityRSVP';
import EventShareButton from '@/components/stride/EventShareButton';
import EventInviteSheet from '@/components/stride/EventInviteSheet';

const CAT_COLORS = ['#BFFF00', '#8A2BE2', 'rgb(0,200,180)', 'rgb(255,180,0)', 'rgb(255,80,130)'];

export default function StrideEventDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = new URLSearchParams(window.location.search);
  const eventId = params.get('id');

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

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
      return r[0] || null;
    },
    enabled: !!eventId && !!user?.email,
  });

  const handleRegisterSuccess = () => {
    setShowForm(false);
    queryClient.invalidateQueries({ queryKey: ['my-reg', eventId, user?.email] });
    queryClient.invalidateQueries({ queryKey: ['my-stride-regs', user?.email] });
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
        </div>

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

        {/* Official: Categories */}
        {!isCommunityEvent && categories.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Categories</p>
            <div className="space-y-3">
              {categories.map((cat, idx) => {
                const color = cat.color || CAT_COLORS[idx % CAT_COLORS.length];
                const isFull = cat.max_slots > 0 && cat.registered_count >= cat.max_slots;
                const isSelected = selectedCategory?.id === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => !alreadyRegistered && isOpen && !isFull && setSelectedCategory(isSelected ? null : cat)}
                    disabled={alreadyRegistered || !isOpen || isFull}
                    className="w-full text-left rounded-2xl p-4 transition-all"
                    style={{
                      background: isSelected ? `${color}15` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isSelected ? color + '50' : 'rgba(255,255,255,0.08)'}`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm" style={{ background: color + '20', color }}>
                          {cat.distance_km ? `${cat.distance_km}K` : cat.name.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-white">{cat.name}</p>
                          {cat.distance_km && <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{cat.distance_km} km</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-base" style={{ color }}>{cat.price === 0 ? 'Free' : `฿${cat.price}`}</p>
                        {cat.max_slots > 0 && (
                          <p className="text-xs mt-0.5" style={{ color: isFull ? 'rgba(255,80,80,0.8)' : 'rgba(255,255,255,0.35)' }}>
                            {isFull ? 'Full' : `${cat.registered_count}/${cat.max_slots} slots`}
                          </p>
                        )}
                      </div>
                    </div>
                    {cat.description && <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{cat.description}</p>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Official: Already registered info */}
        {!isCommunityEvent && alreadyRegistered && (
          <div className="rounded-2xl p-4" style={{ background: 'rgba(191,255,0,0.06)', border: '1px solid rgba(191,255,0,0.2)' }}>
            <p className="text-sm font-bold text-white mb-1">You are registered!</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Bib: <span className="font-black" style={{ color: '#BFFF00' }}>{myReg.bib_number || 'Pending'}</span>
              {' · '}Status: <span className="capitalize">{myReg.status}</span>
            </p>
            <button
              onClick={() => navigate('/StrideMyEvents')}
              className="mt-3 text-xs font-bold flex items-center gap-1"
              style={{ color: '#BFFF00' }}
            >
              View my registration <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Official: Bottom CTA — only shown when categories exist */}
      {!isCommunityEvent && !alreadyRegistered && isOpen && categories.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 px-6 pb-2">
          <button
            onClick={() => selectedCategory && setShowForm(true)}
            disabled={!selectedCategory}
            className="w-full py-4 rounded-2xl font-bold text-base transition-all"
            style={selectedCategory
              ? { background: '#BFFF00', color: '#0A0A0A' }
              : { background: 'rgba(191,255,0,0.15)', color: 'rgba(191,255,0,0.4)' }
            }
          >
            {selectedCategory ? `Register for ${selectedCategory.name}` : 'Select a Category'}
          </button>
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