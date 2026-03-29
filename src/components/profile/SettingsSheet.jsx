import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Trash2, X, User, Mail, Shield, ChevronRight, Loader2, CheckCircle2, Globe, Pencil, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useLanguage, LANGUAGES } from '@/lib/LanguageContext';
import { differenceInDays } from 'date-fns';

// Detect if user just returned from a successful login
// The platform redirects back to the same URL after login
function useJustLoggedIn(user) {
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  useEffect(() => {
    if (!user) return;
    const key = '__stride_login_pending__';
    if (sessionStorage.getItem(key)) {
      sessionStorage.removeItem(key);
      setJustLoggedIn(true);
      toast.success(`Welcome back, ${user.full_name || 'Runner'}! 👋`, {
        description: user.email,
        duration: 3500,
      });
      // auto-clear after brief display
      const t = setTimeout(() => setJustLoggedIn(false), 4000);
      return () => clearTimeout(t);
    }
  }, [user?.email]);

  return justLoggedIn;
}

// Redirecting overlay
function RedirectingOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'absolute', inset: 0, borderRadius: 'inherit',
        background: 'rgba(10,10,10,0.93)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 14,
        backdropFilter: 'blur(6px)',
        zIndex: 10,
      }}
    >
      <div style={{
        width: 56, height: 56, borderRadius: 18,
        background: 'linear-gradient(135deg, rgba(138,43,226,0.3), rgba(191,255,0,0.2))',
        border: '1px solid rgba(191,255,0,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 30px rgba(191,255,0,0.1)',
      }}>
        <Loader2 style={{ width: 26, height: 26, color: '#BFFF00', animation: 'spin 1s linear infinite' }} />
      </div>
      <p style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: 0 }}>
        Opening sign-in…
      </p>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0, textAlign: 'center', maxWidth: 200 }}>
        Choose Google, Facebook, Apple or email on the next screen
      </p>
    </motion.div>
  );
}

export default function SettingsSheet({ user, onClose, onLogout, onDeleteRequest }) {
  const isAuthenticated = !!user;
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { language, setLanguage } = useLanguage();
  const [weightInput, setWeightInput] = useState(user?.weight_kg != null ? String(user.weight_kg) : '');
  const [weightSaving, setWeightSaving] = useState(false);

  // Personal info (optional)
  const [personalInfo, setPersonalInfo] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    birth_date: user?.birth_date || '',
    gender: user?.gender || '',
    nationality: user?.nationality || '',
  });
  const [personalSaving, setPersonalSaving] = useState(false);

  const handlePersonalSave = async () => {
    setPersonalSaving(true);
    await base44.auth.updateMe({
      first_name: personalInfo.first_name.trim() || null,
      last_name: personalInfo.last_name.trim() || null,
      phone: personalInfo.phone.trim() || null,
      birth_date: personalInfo.birth_date || null,
      gender: personalInfo.gender || null,
      nationality: personalInfo.nationality.trim() || null,
    });
    setPersonalSaving(false);
    toast.success('Personal info saved ✓');
  };

  // Display name editing
  const [nameInput, setNameInput] = useState(user?.display_name || user?.full_name || '');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameEditOpen, setNameEditOpen] = useState(false);

  useJustLoggedIn(user);

  // Cooldown helpers
  const getCooldownDaysLeft = () => {
    if (!user?.display_name_updated_at) return 0;
    const daysSince = differenceInDays(new Date(), new Date(user.display_name_updated_at));
    const remaining = 30 - daysSince;
    return remaining > 0 ? remaining : 0;
  };
  const cooldownDaysLeft = getCooldownDaysLeft();
  const canChangeName = cooldownDaysLeft === 0;

  const handleNameSave = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) { toast.error('กรุณาใส่ชื่อ'); return; }
    if (trimmed.length < 2 || trimmed.length > 30) { toast.error('ชื่อต้องมี 2–30 ตัวอักษร'); return; }
    setNameSaving(true);
    await base44.auth.updateMe({
      display_name: trimmed,
      display_name_updated_at: new Date().toISOString(),
    });
    setNameSaving(false);
    setNameEditOpen(false);
    toast.success('เปลี่ยนชื่อสำเร็จ ✓');
  };

  const handleWeightSave = async () => {
    const val = weightInput.trim() === '' ? null : parseFloat(weightInput);
    if (weightInput.trim() !== '') {
      if (isNaN(val) || val < 20 || val > 300) {
        toast.error('Enter a weight between 20 and 300 kg');
        return;
      }
    }
    setWeightSaving(true);
    await base44.auth.updateMe({ weight_kg: val });
    setWeightSaving(false);
    toast.success('Weight saved ✓');
  };

  const handleSignIn = () => {
    // Mark that we're mid-login so we can show success on return
    sessionStorage.setItem('__stride_login_pending__', '1');
    setIsRedirecting(true);
    setTimeout(() => {
      base44.auth.redirectToLogin(window.location.href);
    }, 450);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.65)',
        zIndex: 99999,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        style={{
          width: '100%', maxWidth: 600,
          maxHeight: '85dvh',
          background: 'linear-gradient(180deg, #0f0f14 0%, #0a0a0a 100%)',
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          borderTop: '1.5px solid rgba(138,43,226,0.45)',
          borderLeft: '1.5px solid rgba(138,43,226,0.2)',
          borderRight: '1.5px solid rgba(191,255,0,0.2)',
          boxShadow: '0 -8px 60px rgba(138,43,226,0.35), 0 -4px 30px rgba(191,255,0,0.15)',
          overflowY: isRedirecting ? 'hidden' : 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 'calc(90px + env(safe-area-inset-bottom))',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence>
          {isRedirecting && <RedirectingOverlay />}
        </AnimatePresence>

        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 4px' }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>Account</h3>
          <button
            onClick={onClose}
            disabled={isRedirecting}
            style={{
              width: 36, height: 36, borderRadius: 12,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {isAuthenticated ? (
            <>
              {/* Account card */}
              <div style={{
                padding: '18px 16px', borderRadius: 18,
                background: 'rgba(191,255,0,0.04)',
                border: '1px solid rgba(191,255,0,0.12)',
                display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4,
              }}>
                <div style={{
                  width: 50, height: 50, borderRadius: 14, flexShrink: 0,
                  background: 'linear-gradient(135deg, rgba(138,43,226,0.5), rgba(191,255,0,0.35))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 900, color: '#fff',
                  boxShadow: '0 0 16px rgba(138,43,226,0.3)',
                }}>
                  {user?.full_name ? user.full_name[0].toUpperCase() : <User style={{ width: 22, height: 22 }} />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>
                    {user?.full_name || 'Runner'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Mail style={{ width: 11, height: 11, flexShrink: 0, color: 'rgba(255,255,255,0.3)' }} />
                    <span style={{
                      fontSize: 12, color: 'rgba(255,255,255,0.45)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {user?.email || '—'}
                    </span>
                  </div>
                </div>

                {/* Signed-in pill */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 99, flexShrink: 0,
                  background: 'rgba(191,255,0,0.1)', border: '1px solid rgba(191,255,0,0.3)',
                  boxShadow: '0 0 10px rgba(191,255,0,0.15)',
                }}>
                  <CheckCircle2 style={{ width: 12, height: 12, color: '#BFFF00' }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#BFFF00', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Signed In
                  </span>
                </div>
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '2px 0' }} />

              {/* Display Name */}
              <div style={{
                padding: '16px 18px', borderRadius: 16,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: nameEditOpen ? 14 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <User style={{ width: 15, height: 15, color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Display Name</p>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)', margin: '3px 0 0' }}>
                        {user?.display_name || user?.full_name || 'Runner'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (!canChangeName) return;
                      setNameInput(user?.display_name || user?.full_name || '');
                      setNameEditOpen(v => !v);
                    }}
                    disabled={!canChangeName}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '5px 11px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                      flexShrink: 0, cursor: canChangeName ? 'pointer' : 'not-allowed',
                      transition: 'all 0.15s ease',
                      ...(canChangeName ? {
                        background: 'rgba(191,255,0,0.08)', border: '1px solid rgba(191,255,0,0.25)',
                        color: '#BFFF00',
                      } : {
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)',
                        color: 'rgba(255,255,255,0.25)',
                      }),
                    }}
                  >
                    <Pencil style={{ width: 11, height: 11 }} />
                    แก้ไข
                  </button>
                </div>

                {!canChangeName && (
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', margin: '10px 0 0', lineHeight: 1.6, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Clock style={{ width: 11, height: 11, flexShrink: 0, opacity: 0.5 }} />
                    คุณสามารถเปลี่ยนชื่อได้อีกครั้งใน {cooldownDaysLeft} วัน
                  </p>
                )}

                <AnimatePresence>
                  {nameEditOpen && canChangeName && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                        <input
                          type="text"
                          maxLength={30}
                          placeholder="ชื่อใหม่ (2–30 ตัวอักษร)"
                          value={nameInput}
                          onChange={e => setNameInput(e.target.value)}
                          style={{
                            flex: 1, padding: '10px 14px', borderRadius: 12,
                            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                            color: '#fff', fontSize: 14, fontWeight: 500, outline: 'none',
                          }}
                        />
                        {(() => {
                          const trimmed = nameInput.trim();
                          const currentName = user?.display_name || user?.full_name || '';
                          const isDisabled = nameSaving || !trimmed || trimmed === currentName;
                          return (
                            <button
                              onClick={handleNameSave}
                              disabled={isDisabled}
                              style={{
                                padding: '10px 16px', borderRadius: 12, fontWeight: 700, fontSize: 13,
                                flexShrink: 0, cursor: isDisabled ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s ease',
                                ...(isDisabled ? {
                                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)',
                                  color: 'rgba(255,255,255,0.25)',
                                } : {
                                  background: 'rgba(191,255,0,0.13)', border: '1px solid rgba(191,255,0,0.35)',
                                  color: '#BFFF00',
                                }),
                              }}
                            >
                              {nameSaving ? '…' : 'ยืนยัน'}
                            </button>
                          );
                        })()}
                      </div>
                      <p style={{ margin: '7px 0 0', fontSize: 10, color: 'rgba(255,255,255,0.22)', lineHeight: 1.5 }}>
                        หลังยืนยันแล้ว คุณจะเปลี่ยนชื่อได้อีกครั้งใน 30 วัน
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '2px 0' }} />

              {/* Language */}
              <div style={{
                padding: '16px 18px', borderRadius: 16,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <Globe style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Language
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {LANGUAGES.map(lang => {
                    const isActive = language === lang.code;
                    return (
                      <button
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        style={{
                          flex: 1, padding: '11px 0', borderRadius: 12,
                          fontSize: 14, fontWeight: 700,
                          cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                          transition: 'all 0.18s ease',
                          ...(isActive ? {
                            background: 'rgba(191,255,0,0.14)',
                            border: '1.5px solid rgba(191,255,0,0.5)',
                            color: '#BFFF00',
                            boxShadow: '0 0 14px rgba(191,255,0,0.18)',
                          } : {
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.5)',
                          }),
                        }}
                      >
                        {lang.native}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '2px 0' }} />

              {/* Weight */}
              <div style={{
                padding: '16px 18px', borderRadius: 16,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 12 }}>
                  Weight (kg)
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    placeholder="e.g. 65.5"
                    value={weightInput}
                    onChange={e => setWeightInput(e.target.value)}
                    style={{
                      flex: 1, padding: '10px 14px', borderRadius: 12,
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff', fontSize: 15, fontWeight: 600, outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleWeightSave}
                    disabled={weightSaving}
                    style={{
                      padding: '10px 18px', borderRadius: 12, fontWeight: 700, fontSize: 14,
                      background: 'rgba(191,255,0,0.15)', border: '1px solid rgba(191,255,0,0.35)',
                      color: '#BFFF00', cursor: 'pointer', flexShrink: 0,
                      opacity: weightSaving ? 0.6 : 1,
                    }}
                  >
                    {weightSaving ? '…' : 'Save'}
                  </button>
                </div>
                <p style={{ margin: '8px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                  Used for calorie estimation only.
                </p>
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '2px 0' }} />

              {/* Personal Info (optional) */}
              <div style={{
                padding: '16px 18px', borderRadius: 16,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>
                  Personal Info
                </p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '0 0 14px' }}>
                  Optional — used to pre-fill race registrations
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <input
                      placeholder="First name"
                      value={personalInfo.first_name}
                      onChange={e => setPersonalInfo(p => ({ ...p, first_name: e.target.value }))}
                      style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, outline: 'none' }}
                    />
                    <input
                      placeholder="Last name"
                      value={personalInfo.last_name}
                      onChange={e => setPersonalInfo(p => ({ ...p, last_name: e.target.value }))}
                      style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, outline: 'none' }}
                    />
                  </div>
                  <input
                    placeholder="Phone"
                    type="tel"
                    value={personalInfo.phone}
                    onChange={e => setPersonalInfo(p => ({ ...p, phone: e.target.value }))}
                    style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, outline: 'none' }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <input
                      placeholder="Birth date"
                      type="date"
                      value={personalInfo.birth_date}
                      onChange={e => setPersonalInfo(p => ({ ...p, birth_date: e.target.value }))}
                      style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: personalInfo.birth_date ? '#fff' : 'rgba(255,255,255,0.35)', fontSize: 14, outline: 'none', colorScheme: 'dark' }}
                    />
                    <select
                      value={personalInfo.gender}
                      onChange={e => setPersonalInfo(p => ({ ...p, gender: e.target.value }))}
                      style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: personalInfo.gender ? '#fff' : 'rgba(255,255,255,0.35)', fontSize: 14, outline: 'none' }}
                    >
                      <option value="">Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <input
                    placeholder="Nationality (e.g. Thai)"
                    value={personalInfo.nationality}
                    onChange={e => setPersonalInfo(p => ({ ...p, nationality: e.target.value }))}
                    style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, outline: 'none' }}
                  />
                  <button
                    onClick={handlePersonalSave}
                    disabled={personalSaving}
                    style={{
                      padding: '10px 0', borderRadius: 12, fontWeight: 700, fontSize: 13,
                      background: 'rgba(191,255,0,0.1)', border: '1px solid rgba(191,255,0,0.28)',
                      color: '#BFFF00', cursor: 'pointer', opacity: personalSaving ? 0.6 : 1,
                    }}
                  >
                    {personalSaving ? 'Saving…' : 'Save Personal Info'}
                  </button>
                </div>
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '2px 0' }} />

              <button
                onClick={onLogout}
                style={{
                  width: '100%', minHeight: 54, padding: '14px 18px', borderRadius: 16,
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: 600,
                  cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <LogOut style={{ width: 18, height: 18, flexShrink: 0 }} />
                <span style={{ flex: 1, textAlign: 'left' }}>Log Out</span>
              </button>

              <button
                onClick={onDeleteRequest}
                style={{
                  width: '100%', minHeight: 54, padding: '14px 18px', borderRadius: 16,
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: 'rgba(255,60,60,0.07)', border: '1px solid rgba(255,60,60,0.2)',
                  color: 'rgba(255,100,100,0.95)', fontSize: 15, fontWeight: 600,
                  cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Trash2 style={{ width: 18, height: 18, flexShrink: 0 }} />
                <span style={{ flex: 1, textAlign: 'left' }}>Delete Account</span>
              </button>
            </>
          ) : (
            <>
              {/* Hero */}
              <div style={{ textAlign: 'center', padding: '16px 0 24px' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 22, margin: '0 auto 18px',
                  background: 'linear-gradient(135deg, rgba(138,43,226,0.3), rgba(191,255,0,0.2))',
                  border: '1px solid rgba(191,255,0,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 36px rgba(138,43,226,0.2)',
                }}>
                  <Shield style={{ width: 30, height: 30, color: '#BFFF00' }} />
                </div>
                <p style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>Sign in to Stride</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.5 }}>
                  Save your progress, earn rewards &amp; connect with runners
                </p>
              </div>

              {/* Single sign-in CTA */}
              <button
                onClick={handleSignIn}
                disabled={isRedirecting}
                style={{
                  width: '100%', minHeight: 58, padding: '16px 20px', borderRadius: 18,
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: 'linear-gradient(135deg, rgba(191,255,0,0.18), rgba(138,43,226,0.18))',
                  border: '1px solid rgba(191,255,0,0.35)',
                  color: '#fff', fontSize: 16, fontWeight: 700,
                  cursor: isRedirecting ? 'default' : 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  opacity: isRedirecting ? 0.7 : 1,
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(191,255,0,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isRedirecting
                    ? <Loader2 style={{ width: 18, height: 18, color: '#BFFF00', animation: 'spin 1s linear infinite' }} />
                    : <Shield style={{ width: 18, height: 18, color: '#BFFF00' }} />
                  }
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff' }}>
                    Sign in / Create Account
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                    Choose Google, Facebook, Apple or email →
                  </p>
                </div>
                <ChevronRight style={{ width: 18, height: 18, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
              </button>

              {/* What you get */}
              <div style={{
                padding: '14px 16px', borderRadius: 14, marginTop: 2,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                {['Save runs & stats', 'Earn BX coins & badges', 'Join challenges & events'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 6, height: 6, borderRadius: 3, background: '#BFFF00', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{item}</span>
                  </div>
                ))}
              </div>

              <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', margin: '2px 0 0' }}>
                By continuing you agree to our Terms &amp; Privacy Policy
              </p>
            </>
          )}
        </div>

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </motion.div>
    </motion.div>
  );
}