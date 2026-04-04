import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Users, CheckCircle2, Clock, XCircle, ScanLine, Search, Filter, ChevronDown, CreditCard, Tag } from 'lucide-react';
import { format } from 'date-fns';
import PaymentReviewPanel from '@/components/stride/PaymentReviewPanel';
import EventPaymentSetup from '@/components/stride/EventPaymentSetup';
import RegistrationDetailSheet from '@/components/stride/RegistrationDetailSheet';

const STATUS_CFG = {
  pending:   { label: 'Pending',   color: 'rgba(255,200,80,1)',  bg: 'rgba(255,200,80,0.1)' },
  confirmed: { label: 'Confirmed', color: 'rgb(0,210,110)',      bg: 'rgba(0,200,100,0.1)' },
  cancelled: { label: 'Cancelled', color: 'rgba(255,80,80,0.8)', bg: 'rgba(255,80,80,0.08)' },
  rejected:  { label: 'Rejected',  color: 'rgba(255,80,80,0.8)', bg: 'rgba(255,80,80,0.08)' },
};

export default function StrideAdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('registrations');
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [detailReg, setDetailReg] = useState(null);
  const [activeQuickFilter, setActiveQuickFilter] = useState('all');
  const [expandedPaymentSetup, setExpandedPaymentSetup] = useState(null);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: events = [] } = useQuery({
    queryKey: ['stride-events-admin'],
    queryFn: () => base44.entities.StrideEvent.list('-event_date', 50),
    enabled: user?.role === 'admin',
  });

  const { data: allCategories = [] } = useQuery({
    queryKey: ['all-cats-admin'],
    queryFn: () => base44.entities.EventCategory.list('-created_date', 200),
    enabled: user?.role === 'admin',
  });

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ['all-regs-admin'],
    queryFn: () => base44.entities.EventRegistration.list('-created_date', 500),
    enabled: user?.role === 'admin',
  });

  const { data: allPayments = [], isLoading: loadingPayments } = useQuery({
    queryKey: ['all-payments-admin'],
    queryFn: () => base44.entities.EventPayment.list('-created_date', 500),
    enabled: user?.role === 'admin',
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, bibNumber }) => base44.entities.EventRegistration.update(id, { status: 'confirmed', bib_number: bibNumber, payment_status: 'paid' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-regs-admin'] });
      queryClient.invalidateQueries({ queryKey: ['all-cats-admin'] });
      queryClient.invalidateQueries({ queryKey: ['stride-events-admin'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => base44.entities.EventRegistration.update(id, { status: 'rejected' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-regs-admin'] }),
  });

  if (user && user.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white" style={{ backgroundColor: '#0A0A0A' }}>
        <p className="text-4xl mb-4">🚫</p>
        <p className="text-xl font-bold mb-2">Admin Only</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-sm" style={{ color: '#BFFF00' }}>Go Back</button>
      </div>
    );
  }

  const eventMap = Object.fromEntries(events.map(e => [e.id, e]));
  const catMap = Object.fromEntries(allCategories.map(c => [c.id, c]));

  const categoriesForEvent = selectedEvent === 'all'
    ? allCategories
    : allCategories.filter(c => c.event_id === selectedEvent);

  const filtered = registrations.filter(r => {
    if (selectedEvent !== 'all' && r.event_id !== selectedEvent) return false;
    if (selectedCategory !== 'all' && r.category_id !== selectedCategory) return false;
    if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!`${r.first_name} ${r.last_name} ${r.user_email} ${r.bib_number}`.toLowerCase().includes(q)) return false;
    }
    if (activeQuickFilter === 'pending'    && r.status !== 'pending')   return false;
    if (activeQuickFilter === 'confirmed'  && r.status !== 'confirmed') return false;
    if (activeQuickFilter === 'checked_in' && !r.checked_in)            return false;
    return true;
  });

  const stats = {
    total: registrations.length,
    pending: registrations.filter(r => r.status === 'pending').length,
    confirmed: registrations.filter(r => r.status === 'confirmed').length,
    checkedIn: registrations.filter(r => r.checked_in).length,
  };

  const generateBib = (reg) => {
    const cat = catMap[reg.category_id];
    const prefix = cat?.bib_prefix || 'R';
    const start = cat?.bib_start || 1;
    // Collect all bib numbers already assigned in this category to guarantee uniqueness
    const usedBibs = new Set(
      registrations
        .filter(r => r.category_id === reg.category_id && r.bib_number)
        .map(r => r.bib_number)
    );
    let candidate = start;
    let bib;
    do {
      bib = `${prefix}${String(candidate).padStart(3, '0')}`;
      candidate++;
    } while (usedBibs.has(bib));
    return bib;
  };

  return (
    <div className="min-h-screen text-white pb-28" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Header */}
      <div className="sticky top-0 z-50 px-6 pt-10 pb-4" style={{ backgroundColor: 'rgba(10,10,10,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Admin</p>
            <h1 className="text-xl font-bold">Event Registrations</h1>
          </div>
          <button
            onClick={() => navigate('/StrideCheckin')}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(191,255,0,0.1)', color: '#BFFF00', border: '1px solid rgba(191,255,0,0.2)' }}
          >
            <ScanLine className="w-3.5 h-3.5" /> Check-In
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, bib..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-3">
          {[
            { key: 'registrations', label: 'Registrations', icon: Users },
            { key: 'payments', label: 'Payments', icon: CreditCard, badge: allPayments.filter(p => p.status === 'pending').length },
            { key: 'categories', label: 'Categories', icon: Tag },
          ].map(({ key, label, icon: Icon, badge }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
              style={activeTab === key
                ? { background: '#BFFF00', color: '#0A0A0A' }
                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.1)' }
              }
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {badge > 0 && (
                <span className="w-4 h-4 rounded-full text-xs flex items-center justify-center font-black"
                  style={activeTab === key ? { background: '#0A0A0A', color: '#BFFF00' } : { background: 'rgba(255,200,80,0.3)', color: 'rgba(255,200,80,1)' }}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filter toggle — registrations tab only */}
        {activeTab === 'registrations' && (
          <>
            <button
              onClick={() => setShowFilters(f => !f)}
              className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <Filter className="w-3.5 h-3.5" /> Filters
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            {showFilters && (
              <div className="mt-3 space-y-2">
                <select
                  value={selectedEvent} onChange={e => { setSelectedEvent(e.target.value); setSelectedCategory('all'); }}
                  className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <option value="all">All Events</option>
                  {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
                <div className="flex gap-2">
                  <select
                    value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <option value="all">All Categories</option>
                    {categoriesForEvent.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <select
                    value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="rejected">Rejected</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="px-6 pt-4 space-y-3">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Select an event to manage its race categories and payment settings
          </p>
          {events.filter(e => e.event_type === 'official').sort((a, b) => {
            if (a.status === 'draft' && b.status !== 'draft') return -1;
            if (a.status !== 'draft' && b.status === 'draft') return 1;
            return 0;
          }).map(ev => {
            const evCats = allCategories.filter(c => c.event_id === ev.id && c.is_active !== false);
            const totalReg = ev.total_registered || 0;
            return (
              <div key={ev.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button
                onClick={() => navigate(`/ManageCategories?event_id=${ev.id}`)}
                className="w-full text-left rounded-2xl p-4"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}
              >
                <div className="flex items-start gap-3">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-white text-sm truncate">{ev.title}</p>
                      {ev.status === 'draft' && (
                        <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 5, background: 'rgba(255,180,0,0.12)', color: 'rgba(255,180,0,0.9)', border: '1px solid rgba(255,180,0,0.25)', flexShrink: 0 }}>DRAFT</span>
                      )}
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {evCats.length === 0
                        ? '⚠️ No categories — registration hidden'
                        : `${evCats.length} ${evCats.length === 1 ? 'category' : 'categories'}`}
                    </p>
                    {/* Per-category occupancy pills */}
                    {evCats.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                        {evCats.map(cat => {
                          const reg = cat.registered_count || 0;
                          const hasLimit = cat.max_slots > 0;
                          const full = hasLimit && reg >= cat.max_slots;
                          const nearly = hasLimit && !full && (reg / cat.max_slots) >= 0.8;
                          let bg = 'rgba(191,255,0,0.08)', color = '#BFFF00', border = 'rgba(191,255,0,0.2)';
                          if (full) { bg = 'rgba(255,80,80,0.1)'; color = 'rgba(255,100,100,1)'; border = 'rgba(255,80,80,0.25)'; }
                          else if (nearly) { bg = 'rgba(255,180,0,0.1)'; color = 'rgba(255,180,0,0.9)'; border = 'rgba(255,180,0,0.25)'; }
                          return (
                            <span key={cat.id} style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: bg, color, border: `1px solid ${border}` }}>
                              {cat.name}: {hasLimit ? `${reg}/${cat.max_slots}` : `${reg} / ∞`}
                              {full ? ' · FULL' : ''}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '5px 11px', borderRadius: 9,
                      ...(evCats.length === 0
                        ? { background: 'rgba(255,180,0,0.1)', border: '1px solid rgba(255,180,0,0.25)', color: 'rgba(255,180,0,0.9)' }
                        : { background: 'rgba(191,255,0,0.08)', border: '1px solid rgba(191,255,0,0.2)', color: '#BFFF00' }
                      ),
                    }}>
                      {evCats.length === 0 ? 'Add →' : 'Manage →'}
                    </span>
                    {totalReg > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{totalReg} total</span>
                    )}
                  </div>
                </div>
              </button>
              {/* Payment Setup inline */}
              <button
                onClick={() => setExpandedPaymentSetup(expandedPaymentSetup === ev.id ? null : ev.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: 12, marginTop: -6, cursor: 'pointer',
                  background: expandedPaymentSetup === ev.id ? 'rgba(191,255,0,0.06)' : 'rgba(255,255,255,0.02)',
                  border: expandedPaymentSetup === ev.id ? '1px solid rgba(191,255,0,0.2)' : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: expandedPaymentSetup === ev.id ? '#BFFF00' : 'rgba(255,255,255,0.35)' }}>
                  💳 Payment Setup
                </span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
                  {expandedPaymentSetup === ev.id ? '▲ Hide' : '▼ Configure'}
                </span>
              </button>
              {expandedPaymentSetup === ev.id && (
                <div style={{ padding: '14px 16px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <EventPaymentSetup eventId={ev.id} />
                </div>
              )}
              </div>
            );
          })}
          {events.filter(e => e.event_type === 'official').length === 0 && (
            <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)' }}>
              <p className="text-2xl mb-2">🏁</p>
              <p className="text-sm text-white font-semibold">No official events yet</p>
            </div>
          )}
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="px-6 pt-4 space-y-4">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {allPayments.filter(p => p.status === 'pending').length} pending · {allPayments.length} total
          </p>
          {loadingPayments && <div className="text-center py-10" style={{ color: 'rgba(255,255,255,0.35)' }}>Loading...</div>}
          {!loadingPayments && allPayments.length === 0 && (
            <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)' }}>
              <p className="text-2xl mb-2">💳</p>
              <p className="text-sm text-white font-semibold">No payments yet</p>
            </div>
          )}
          {/* Pending first, then rest */}
          {[...allPayments].sort((a, b) => {
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (a.status !== 'pending' && b.status === 'pending') return 1;
            return 0;
          }).map(payment => {
            const reg = registrations.find(r => r.id === payment.registration_id);
            if (!reg) return null;
            return (
              <PaymentReviewPanel
                key={payment.id}
                payment={payment}
                reg={reg}
                catMap={catMap}
                registrations={registrations}
                user={user}
                onDone={() => {}}
              />
            );
          })}
        </div>
      )}

      {/* Registration Detail Sheet */}
      {detailReg && (
        <RegistrationDetailSheet
          reg={detailReg}
          eventMap={eventMap}
          catMap={catMap}
          registrations={registrations}
          onClose={() => setDetailReg(null)}
          onUpdated={() => setDetailReg(null)}
        />
      )}

      {/* Registrations Tab */}
      {activeTab === 'registrations' && <div className="px-6 pt-5 space-y-5">
        {/* Stats row — clickable quick filters */}
        {(() => {
          const cards = [
            {
              key: 'all',
              label: 'Total',
              value: stats.total,
              // inactive: neutral white tint
              inactiveNum:    'rgba(255,255,255,0.55)',
              inactiveLabel:  'rgba(255,255,255,0.28)',
              inactiveBg:     'rgba(255,255,255,0.04)',
              inactiveBorder: 'rgba(255,255,255,0.08)',
              // active: soft lime
              activeNum:    '#BFFF00',
              activeLabel:  'rgba(191,255,0,0.7)',
              activeBg:     'rgba(191,255,0,0.10)',
              activeBorder: 'rgba(191,255,0,0.55)',
              activeGlow:   '0 0 16px rgba(191,255,0,0.18)',
            },
            {
              key: 'pending',
              label: 'Pending',
              value: stats.pending,
              inactiveNum:    'rgba(255,200,80,0.65)',
              inactiveLabel:  'rgba(255,200,80,0.3)',
              inactiveBg:     'rgba(255,200,80,0.03)',
              inactiveBorder: 'rgba(255,200,80,0.12)',
              activeNum:    'rgba(255,200,80,1)',
              activeLabel:  'rgba(255,200,80,0.75)',
              activeBg:     'rgba(255,200,80,0.12)',
              activeBorder: 'rgba(255,200,80,0.6)',
              activeGlow:   '0 0 16px rgba(255,200,80,0.20)',
            },
            {
              key: 'confirmed',
              label: 'Confirmed',
              value: stats.confirmed,
              inactiveNum:    'rgba(0,210,110,0.65)',
              inactiveLabel:  'rgba(0,210,110,0.3)',
              inactiveBg:     'rgba(0,210,110,0.03)',
              inactiveBorder: 'rgba(0,210,110,0.12)',
              activeNum:    'rgb(0,220,115)',
              activeLabel:  'rgba(0,210,110,0.75)',
              activeBg:     'rgba(0,210,110,0.12)',
              activeBorder: 'rgba(0,210,110,0.55)',
              activeGlow:   '0 0 16px rgba(0,210,110,0.20)',
            },
            {
              key: 'checked_in',
              label: 'Checked In',
              value: stats.checkedIn,
              inactiveNum:    'rgba(100,220,255,0.6)',
              inactiveLabel:  'rgba(100,220,255,0.28)',
              inactiveBg:     'rgba(100,220,255,0.03)',
              inactiveBorder: 'rgba(100,220,255,0.10)',
              activeNum:    'rgb(100,220,255)',
              activeLabel:  'rgba(100,220,255,0.75)',
              activeBg:     'rgba(100,220,255,0.11)',
              activeBorder: 'rgba(100,220,255,0.55)',
              activeGlow:   '0 0 16px rgba(100,220,255,0.20)',
            },
          ];
          return (
            <div className="grid grid-cols-4 gap-2">
              {cards.map(c => {
                const isActive = activeQuickFilter === c.key;
                return (
                  <button
                    key={c.key}
                    onClick={() => setActiveQuickFilter(prev => prev === c.key ? 'all' : c.key)}
                    className="rounded-xl text-center transition-all active:scale-[0.97]"
                    style={{
                      padding: '10px 4px 9px',
                      background:   isActive ? c.activeBg     : c.inactiveBg,
                      border:       `1px solid ${isActive ? c.activeBorder : c.inactiveBorder}`,
                      boxShadow:    isActive ? c.activeGlow   : 'none',
                      transform:    isActive ? 'translateY(-2px)' : 'none',
                    }}
                  >
                    <p className="font-black leading-none" style={{ fontSize: 20, color: isActive ? c.activeNum : c.inactiveNum }}>{c.value}</p>
                    <p style={{ fontSize: 10, marginTop: 4, fontWeight: 700, letterSpacing: '0.03em', color: isActive ? c.activeLabel : c.inactiveLabel }}>{c.label}</p>
                  </button>
                );
              })}
            </div>
          );
        })()}

        {/* Count */}
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)', marginTop: -4 }}>
          {activeQuickFilter === 'all'        && `Showing ${filtered.length} registrations`}
          {activeQuickFilter === 'pending'    && `Showing ${filtered.length} pending registration${filtered.length !== 1 ? 's' : ''}`}
          {activeQuickFilter === 'confirmed'  && `Showing ${filtered.length} confirmed registration${filtered.length !== 1 ? 's' : ''}`}
          {activeQuickFilter === 'checked_in' && `Showing ${filtered.length} checked-in registration${filtered.length !== 1 ? 's' : ''}`}
        </p>

        {isLoading && <div className="text-center py-10" style={{ color: 'rgba(255,255,255,0.35)' }}>Loading...</div>}

        {filtered.map(reg => {
          const ev = eventMap[reg.event_id];
          const cat = catMap[reg.category_id];
          const cfg = STATUS_CFG[reg.status] || STATUS_CFG.pending;

          return (
            <button
              key={reg.id}
              onClick={() => setDetailReg(reg)}
              className="w-full text-left rounded-2xl p-4 space-y-3 transition-all active:scale-[0.99]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white">{reg.first_name} {reg.last_name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{reg.user_email}</p>
                  {ev && <p className="text-xs mt-1 font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>{ev.title}</p>}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                    {cfg.label}
                  </span>
                  {cat && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(191,255,0,0.1)', color: '#BFFF00' }}>{cat.name}</span>}
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                <span>Bib: <strong className="text-white">{reg.bib_number || '—'}</strong></span>
                {reg.checked_in && <span className="font-bold" style={{ color: 'rgb(0,210,110)' }}>✓ Checked In</span>}
                <span className="ml-auto">{format(new Date(reg.created_date), 'MMM d')}</span>
              </div>
            </button>
          );
        })}
      </div>}
    </div>
  );
}