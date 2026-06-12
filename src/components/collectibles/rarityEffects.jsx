// BOOMX Rarity Effects — premium physical card aesthetic
// Goal: luxury collectible feeling, not gaming UI
// All animations are slow, subtle, barely-there

export const RARITY_CONFIG = {
  common: {
    label: 'Common',
    color: '#b4b4b4',
    bg: 'rgba(180,180,180,0.06)',
    border: 'rgba(180,180,180,0.2)',
    glow: 'rgba(180,180,180,0.06)',
    shinePeriod: null,
    floatAnim: false,
    pulseBorder: false,
    holographic: false,
    sparkles: false,
    tilt3d: false,
    serialGlow: false,
  },
  rare: {
    label: 'Rare',
    color: '#BFFF00',
    bg: 'rgba(191,255,0,0.06)',
    border: 'rgba(191,255,0,0.3)',
    glow: 'rgba(191,255,0,0.09)',
    shinePeriod: 15,   // single sweep every 15s
    floatAnim: false,
    pulseBorder: false,
    holographic: false,
    sparkles: false,
    tilt3d: false,
    serialGlow: false,
  },
  epic: {
    label: 'Epic',
    color: '#b450ff',
    bg: 'rgba(180,80,255,0.07)',
    border: 'rgba(180,80,255,0.35)',
    glow: 'rgba(180,80,255,0.12)',
    shinePeriod: 12,   // gentle sweep every 12s
    floatAnim: false,
    pulseBorder: false,
    holographic: false,
    sparkles: false,
    tilt3d: false,
    serialGlow: false,
  },
  legendary: {
    label: 'Legendary',
    color: '#FFD700',
    bg: 'rgba(255,215,0,0.06)',
    border: 'rgba(255,215,0,0.35)',
    glow: 'rgba(255,215,0,0.14)',
    shinePeriod: null,
    floatAnim: false,
    pulseBorder: false,
    holographic: true,  // subtle holo reflection
    sparkles: true,     // rare sparkle moments
    tilt3d: false,
    serialGlow: false,
  },
  founder: {
    label: 'Founder',
    color: '#BFFF00',
    bg: 'rgba(191,255,0,0.07)',
    border: 'rgba(191,255,0,0.35)',
    glow: 'rgba(191,255,0,0.13)',
    shinePeriod: 14,   // holographic sweep every 14s
    floatAnim: true,   // float every 8s
    pulseBorder: false,
    holographic: true,
    sparkles: false,
    tilt3d: false,
    serialGlow: true,  // serial pulse every 10s
  },
  sponsor: {
    label: 'Sponsor',
    color: '#FFD700',
    bg: 'rgba(255,215,0,0.06)',
    border: 'rgba(255,215,0,0.3)',
    glow: 'rgba(255,215,0,0.1)',
    shinePeriod: 16,
    floatAnim: false,
    pulseBorder: false,
    holographic: false,
    sparkles: false,
    tilt3d: false,
    serialGlow: false,
  },
};

export const RARITY_KEYFRAMES = `
/* ── Float — founder only, slow drift ── */
@keyframes bx-float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-5px); }
}
.bx-float { animation: bx-float 8s ease-in-out infinite; }

/* ── Soft glow — very low intensity, slow ── */
@keyframes bx-glow-lime {
  0%, 100% { box-shadow: 0 0 12px rgba(191,255,0,0.13), 0 0 24px rgba(191,255,0,0.06); }
  50%       { box-shadow: 0 0 20px rgba(191,255,0,0.22), 0 0 40px rgba(191,255,0,0.09); }
}
@keyframes bx-glow-purple {
  0%, 100% { box-shadow: 0 0 12px rgba(180,80,255,0.12); }
  50%       { box-shadow: 0 0 20px rgba(180,80,255,0.22); }
}
@keyframes bx-glow-gold {
  0%, 100% { box-shadow: 0 0 12px rgba(255,215,0,0.14), 0 0 24px rgba(255,215,0,0.06); }
  50%       { box-shadow: 0 0 22px rgba(255,215,0,0.24), 0 0 44px rgba(255,215,0,0.1); }
}
@keyframes bx-glow-rare {
  0%, 100% { box-shadow: 0 0 10px rgba(191,255,0,0.09); }
  50%       { box-shadow: 0 0 18px rgba(191,255,0,0.18); }
}
@keyframes bx-glow-sponsor {
  0%, 100% { box-shadow: 0 0 10px rgba(255,215,0,0.10); }
  50%       { box-shadow: 0 0 18px rgba(255,215,0,0.20); }
}

.bx-glow-lime    { animation: bx-glow-lime    7s ease-in-out infinite; }
.bx-glow-purple  { animation: bx-glow-purple  8s ease-in-out infinite; }
.bx-glow-gold    { animation: bx-glow-gold    7s ease-in-out infinite; }
.bx-glow-rare    { animation: bx-glow-rare    9s ease-in-out infinite; }
.bx-glow-sponsor { animation: bx-glow-sponsor 9s ease-in-out infinite; }

/* ── Shine sweep — runs once, then pauses ── */
/* Uses animation-iteration-count + long delay to simulate "once per N seconds" */
@keyframes bx-shine {
  0%           { left: -70%; opacity: 0; }
  2%           { opacity: 1; }
  18%          { left: 160%; opacity: 0; }
  18.001%, 100%{ left: -70%; opacity: 0; }
}

/* ── Holographic reflection — barely visible, very slow diagonal ── */
@keyframes bx-holo-sweep {
  0%   { background-position: 0% 50%;   opacity: 0; }
  5%   { opacity: 0.18; }
  50%  { background-position: 100% 50%; opacity: 0.28; }
  95%  { opacity: 0.18; }
  100% { background-position: 0% 50%;   opacity: 0; }
}

/* ── Sparkle — soft drifting particles, each unique path ── */
@keyframes bx-sparkle-0 {
  0%   { opacity: 0;    transform: translate(0px, 0px)    scale(0.8); }
  20%  { opacity: 0.65; transform: translate(-3px, -5px)  scale(1.1); }
  50%  { opacity: 0.45; transform: translate(2px, -8px)   scale(0.9); }
  80%  { opacity: 0.7;  transform: translate(-2px, -4px)  scale(1.15); }
  100% { opacity: 0;    transform: translate(0px, 0px)    scale(0.8); }
}
@keyframes bx-sparkle-1 {
  0%   { opacity: 0;    transform: translate(0px, 0px)   scale(0.85); }
  25%  { opacity: 0.5;  transform: translate(4px, -4px)  scale(1.0); }
  55%  { opacity: 0.75; transform: translate(2px, -7px)  scale(1.2); }
  80%  { opacity: 0.4;  transform: translate(3px, -3px)  scale(0.9); }
  100% { opacity: 0;    transform: translate(0px, 0px)   scale(0.85); }
}
@keyframes bx-sparkle-2 {
  0%   { opacity: 0;    transform: translate(0px, 0px)    scale(1.0); }
  30%  { opacity: 0.6;  transform: translate(-4px, -3px)  scale(0.85); }
  60%  { opacity: 0.8;  transform: translate(-2px, -6px)  scale(1.1); }
  85%  { opacity: 0.35; transform: translate(-3px, -2px)  scale(0.9); }
  100% { opacity: 0;    transform: translate(0px, 0px)    scale(1.0); }
}
@keyframes bx-sparkle-3 {
  0%   { opacity: 0;    transform: translate(0px, 0px)   scale(0.9); }
  20%  { opacity: 0.4;  transform: translate(3px, -6px)  scale(1.0); }
  50%  { opacity: 0.7;  transform: translate(1px, -9px)  scale(1.15); }
  75%  { opacity: 0.5;  transform: translate(2px, -5px)  scale(1.0); }
  100% { opacity: 0;    transform: translate(0px, 0px)   scale(0.9); }
}
@keyframes bx-sparkle-4 {
  0%   { opacity: 0;    transform: translate(0px, 0px)    scale(0.8); }
  35%  { opacity: 0.55; transform: translate(-2px, -7px)  scale(1.05); }
  65%  { opacity: 0.75; transform: translate(-4px, -5px)  scale(0.9); }
  90%  { opacity: 0.3;  transform: translate(-1px, -3px)  scale(1.1); }
  100% { opacity: 0;    transform: translate(0px, 0px)    scale(0.8); }
}
@keyframes bx-sparkle-5 {
  0%   { opacity: 0;    transform: translate(0px, 0px)   scale(1.0); }
  28%  { opacity: 0.6;  transform: translate(3px, -5px)  scale(0.85); }
  58%  { opacity: 0.45; transform: translate(4px, -8px)  scale(1.2); }
  82%  { opacity: 0.65; transform: translate(2px, -4px)  scale(0.95); }
  100% { opacity: 0;    transform: translate(0px, 0px)   scale(1.0); }
}

/* ── Serial glow — slow gentle pulse ── */
@keyframes bx-serial-glow {
  0%, 100% { text-shadow: 0 0 4px rgba(191,255,0,0.3); }
  50%       { text-shadow: 0 0 10px rgba(191,255,0,0.7), 0 0 20px rgba(191,255,0,0.3); }
}
.bx-serial-glow { animation: bx-serial-glow 10s ease-in-out infinite; }

/* ── Teaser for coming-soon cards ── */
@keyframes bx-teaser {
  0%, 100% { opacity: 0.25; }
  50%       { opacity: 0.45; }
}
.bx-teaser { animation: bx-teaser 5s ease-in-out infinite; }
`;

let injected = false;
export function injectRarityKeyframes() {
  if (typeof document === 'undefined') return;
  // Remove old styles to pick up any changes (HMR-safe)
  const existing = document.getElementById('bx-rarity-keyframes');
  if (existing && injected) return;
  if (existing) existing.remove();
  injected = true;
  const style = document.createElement('style');
  style.id = 'bx-rarity-keyframes';
  style.textContent = RARITY_KEYFRAMES;
  document.head.appendChild(style);
}

// Sparkle positions — each uses its own drift keyframe (idx 0–5)
export const SPARKLE_POSITIONS = [
  { top: '12%', left: '18%', delay: '0s',   dur: '9s',  size: 4, idx: 0 },
  { top: '9%',  left: '78%', delay: '3.5s', dur: '10s', size: 3, idx: 1 },
  { top: '52%', left: '88%', delay: '1.5s', dur: '11s', size: 5, idx: 2 },
  { top: '82%', left: '22%', delay: '5s',   dur: '9s',  size: 3, idx: 3 },
  { top: '40%', left: '8%',  delay: '2s',   dur: '10s', size: 4, idx: 4 },
  { top: '88%', left: '65%', delay: '6.5s', dur: '8s',  size: 3, idx: 5 },
];