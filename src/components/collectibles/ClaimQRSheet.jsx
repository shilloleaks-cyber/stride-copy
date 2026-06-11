import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

const C = {
  bg: '#0D0D0D',
  lime: '#BFFF00',
  limeDim: 'rgba(191,255,0,0.08)',
  limeBorder: 'rgba(191,255,0,0.25)',
  muted: 'rgba(255,255,255,0.35)',
  text: '#fff',
  line: 'rgba(255,255,255,0.08)',
};

export default function ClaimQRSheet({ onClose, onClaimed }) {
  const [step, setStep] = useState('scan'); // scan | confirm | success | error
  const [scannedToken, setScannedToken] = useState(null);
  const [cardPreview, setCardPreview] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [claiming, setClaiming] = useState(false);
  const scannerRef = useRef(null);
  const scannerObjRef = useRef(null);

  const startScanner = () => {
    if (scannerObjRef.current) return;
    const scanner = new Html5Qrcode('claim-qr-reader');
    scannerObjRef.current = scanner;
    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      async (decodedText) => {
        await scanner.stop();
        scannerObjRef.current = null;
        handleTokenScanned(decodedText.trim());
      },
      () => {}
    ).catch(() => {});
  };

  const stopScanner = () => {
    if (scannerObjRef.current) {
      scannerObjRef.current.stop().catch(() => {});
      scannerObjRef.current = null;
    }
  };

  // Auto-start scanner when sheet opens
  useEffect(() => {
    const timer = setTimeout(() => startScanner(), 300);
    return () => { clearTimeout(timer); stopScanner(); };
  }, []);

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  const handleTokenScanned = async (token) => {
    // Try to look up the token to show card preview
    try {
      const tokens = await base44.entities.ClaimTokens.filter({ token });
      const ct = tokens[0];
      if (!ct) { setErrorMsg('Invalid QR code.'); setStep('error'); return; }
      if (ct.is_used) { setErrorMsg('This card has already been claimed.'); setStep('error'); return; }

      // Check expiry on the frontend too
      if (ct.expires_at && new Date(ct.expires_at) < new Date()) {
        setErrorMsg('This QR code has expired.'); setStep('error'); return;
      }

      const cards = await base44.entities.Cards.filter({ id: ct.card_id });
      const foundCard = cards[0] || null;

      // Block non-published cards early
      if (foundCard && foundCard.status && foundCard.status !== 'published') {
        setErrorMsg('This card is not available for claim yet.'); setStep('error'); return;
      }

      setCardPreview(foundCard);
      setScannedToken(token);
      setStep('confirm');
    } catch {
      setErrorMsg('Could not read QR. Please try again.');
      setStep('error');
    }
  };

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const res = await base44.functions.invoke('claimCard', { token: scannedToken });
      if (res.data?.success) {
        setStep('success');
        onClaimed?.();
      } else {
        setErrorMsg(res.data?.error || 'Claim failed.');
        setStep('error');
      }
    } catch (e) {
      setErrorMsg(e.message || 'Claim failed.');
      setStep('error');
    } finally {
      setClaiming(false);
    }
  };

  const RARITY_COLOR = {
    common: 'rgba(180,180,180,1)', rare: 'rgba(80,160,255,1)',
    epic: 'rgba(180,80,255,1)', legendary: '#FFD700',
    founder: '#BFFF00', sponsor: '#00e676',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end',
    }}>
      <div style={{
        width: '100%', maxHeight: '90dvh',
        background: '#111', borderRadius: '24px 24px 0 0',
        border: '1px solid rgba(255,255,255,0.08)',
        borderBottom: 'none',
        padding: '0 0 calc(env(safe-area-inset-bottom,0px) + 24px)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Handle + header */}
        <div style={{ padding: '16px 20px 14px', borderBottom: `1px solid ${C.line}` }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 14px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 16, fontWeight: 900, color: C.text, margin: 0 }}>Claim Card</p>
            <button onClick={handleClose} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 4 }}>
              <X style={{ width: 20, height: 20 }} />
            </button>
          </div>
        </div>

        <div style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>
          {step === 'scan' && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Point your camera at the QR code</p>
              <div
                id="claim-qr-reader"
                ref={scannerRef}
                style={{ borderRadius: 16, overflow: 'hidden', maxWidth: 300, margin: '0 auto 20px' }}
              />
              <p style={{ marginTop: 8, fontSize: 12, color: C.muted }}>
                Or enter token manually:
              </p>
              <ManualTokenInput onSubmit={handleTokenScanned} />
            </div>
          )}

          {step === 'confirm' && cardPreview && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 20, fontWeight: 900, color: C.text, marginBottom: 4 }}>Claim Card?</p>
              <p style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>This will be added to your collection.</p>

              <div style={{
                borderRadius: 18, overflow: 'hidden',
                border: `2px solid ${RARITY_COLOR[cardPreview.rarity] || C.limeBorder}`,
                boxShadow: `0 0 24px ${RARITY_COLOR[cardPreview.rarity] || C.lime}33`,
                marginBottom: 24, width: 160, margin: '0 auto 24px',
              }}>
                {/* 2:3 aspect card */}
                <div style={{ width: 160, height: 240, overflow: 'hidden', position: 'relative', background: 'rgba(255,255,255,0.04)' }}>
                  {(cardPreview.front_image_url || cardPreview.image_url) ? (
                    <img src={cardPreview.front_image_url || cardPreview.image_url} alt={cardPreview.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60 }}>✦</div>
                  )}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${RARITY_COLOR[cardPreview.rarity] || C.lime}, transparent)` }} />
                </div>
                <div style={{ padding: '12px 14px 14px', background: '#111' }}>
                  <p style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>{cardPreview.name}</p>
                  <span style={{
                    fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 5,
                    color: RARITY_COLOR[cardPreview.rarity] || C.lime,
                    border: `1px solid ${RARITY_COLOR[cardPreview.rarity] || C.lime}55`,
                    background: `${RARITY_COLOR[cardPreview.rarity] || C.lime}10`,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>{cardPreview.rarity}</span>
                </div>
              </div>

              <button
                onClick={handleClaim}
                disabled={claiming}
                style={{
                  width: '100%', padding: '13px', borderRadius: 14,
                  background: claiming ? 'rgba(191,255,0,0.4)' : C.lime,
                  color: '#000', fontSize: 15, fontWeight: 900,
                  border: 'none', cursor: claiming ? 'not-allowed' : 'pointer',
                }}
              >
                {claiming ? 'Claiming…' : 'Claim Card'}
              </button>
              <button onClick={() => setStep('scan')} style={{ marginTop: 12, background: 'none', border: 'none', color: C.muted, fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          )}

          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
              <CheckCircle2 style={{ width: 48, height: 48, color: C.lime, margin: '0 auto 12px' }} />
              <p style={{ fontSize: 20, fontWeight: 900, color: C.text, marginBottom: 8 }}>Card Claimed!</p>
              <p style={{ fontSize: 13, color: C.muted, marginBottom: 28 }}>
                {cardPreview?.name} has been added to your collection.
              </p>
              <button
                onClick={handleClose}
                style={{
                  width: '100%', padding: '13px', borderRadius: 14,
                  background: C.lime, color: '#000', fontSize: 15, fontWeight: 900,
                  border: 'none', cursor: 'pointer',
                }}
              >
                View Collection
              </button>
            </div>
          )}

          {step === 'error' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <AlertCircle style={{ width: 48, height: 48, color: '#ff6060', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 18, fontWeight: 900, color: '#ff6060', marginBottom: 8 }}>Oops!</p>
              <p style={{ fontSize: 13, color: C.muted, marginBottom: 28 }}>{errorMsg}</p>
              <button
                onClick={() => { setStep('scan'); setTimeout(() => startScanner(), 300); }}
                style={{
                  width: '100%', padding: '13px', borderRadius: 14,
                  background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 15, fontWeight: 800,
                  border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer',
                }}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ManualTokenInput({ onSubmit }) {
  const [val, setVal] = useState('');
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 8, maxWidth: 300, margin: '8px auto 0' }}>
      <input
        value={val}
        onChange={e => setVal(e.target.value)}
        placeholder="Enter token…"
        style={{
          flex: 1, padding: '10px 12px', borderRadius: 10,
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
          color: '#fff', fontSize: 13, outline: 'none',
        }}
      />
      <button
        onClick={() => val.trim() && onSubmit(val.trim())}
        style={{
          padding: '10px 14px', borderRadius: 10,
          background: 'rgba(191,255,0,0.12)', border: '1px solid rgba(191,255,0,0.25)',
          color: '#BFFF00', fontSize: 12, fontWeight: 800, cursor: 'pointer',
        }}
      >
        Go
      </button>
    </div>
  );
}