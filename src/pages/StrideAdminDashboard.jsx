import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Users, CheckCircle2, Clock, XCircle, ScanLine, Search, Filter, ChevronDown, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import PaymentReviewPanel from '@/components/stride/PaymentReviewPanel';

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
            { key: 'payments', label: 'Payments', icon: CreditCard,
              badge: allPayments.filter(p => p.status === 'pending').length },
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

      {/* Registrations Tab */}
      {activeTab === 'registrations' && <div className="px-6 pt-4 space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Total', value: stats.total, color: 'rgba(255,255,255,0.7)' },
            { label: 'Pending', value: stats.pending, color: 'rgba(255,200,80,1)' },
            { label: 'Confirmed', value: stats.confirmed, color: 'rgb(0,210,110)' },
            { label: 'Checked In', value: stats.checkedIn, color: '#BFFF00' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Count */}
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Showing {filtered.length} registrations</p>

        {isLoading && <div className="text-center py-10" style={{ color: 'rgba(255,255,255,0.35)' }}>Loading...</div>}

        {filtered.map(reg => {
          const ev = eventMap[reg.event_id];
          const cat = catMap[reg.category_id];
          const cfg = STATUS_CFG[reg.status] || STATUS_CFG.pending;

          return (
            <div key={reg.id} className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
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
                <span>Shirt: <strong className="text-white">{reg.shirt_size || '—'}</strong></span>
                {reg.checked_in && <span className="font-bold" style={{ color: 'rgb(0,210,110)' }}>✓ Checked In</span>}
                <span className="ml-auto">{format(new Date(reg.created_date), 'MMM d')}</span>
              </div>

              {reg.status === 'pending' && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => approveMutation.mutate({ id: reg.id, bibNumber: generateBib(reg) })}
                    disabled={approveMutation.isPending}
                    className="flex-1 py-2 rounded-xl text-xs font-bold"
                    style={{ background: 'rgba(0,210,110,0.15)', color: 'rgb(0,210,110)', border: '1px solid rgba(0,210,110,0.25)' }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => rejectMutation.mutate(reg.id)}
                    disabled={rejectMutation.isPending}
                    className="flex-1 py-2 rounded-xl text-xs font-bold"
                    style={{ background: 'rgba(255,80,80,0.1)', color: 'rgba(255,100,100,1)', border: '1px solid rgba(255,80,80,0.2)' }}
                  >
                    ✗ Reject
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>}
    </div>
  );
}