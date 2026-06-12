// BOOMX Rarity Effects — single source of truth
export const RARITY_CONFIG = {
  common: {
    label: 'Common',
    color: '#b4b4b4',
    bg: 'rgba(180,180,180,0.08)',
    border: 'rgba(180,180,180,0.25)',
    glow: 'rgba(180,180,180,0.12)',
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
    bg: 'rgba(191,255,0,0.08)',
    border: 'rgba(191,255,0,0.5)',
    glow: 'rgba(191,255,0,0.3)',
    shinePeriod: 8,
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
    bg: 'rgba(180,80,255,0.09)',
    border: 'rgba(180,80,255,0.6)',
    glow: 'rgba(180,80,255,0.4)',
    shinePeriod: 5,
    floatAnim: true,
    pulseBorder: true,
    holographic: false,
    sparkles: false,
    tilt3d: false,
    serialGlow: false,
  },
  legendary: {
    label: 'Legendary',
    color: '#FFD700',
    bg: 'rgba(255,215,0,0.08)',
    border: 'rgba(255,215,0,0.7)',
    glow: 'rgba(255,215,0,0.45)',
    shinePeriod: 3,
    floatAnim: true,
    pulseBorder: true,
    holographic: true,
    sparkles: true,
    tilt3d: false,
    serialGlow: false,
  },
  founder: {
    label: 'Founder',
    color: '#BFFF00',
    bg: 'rgba(191,255,0,0.09)',
    border: 'rgba(191,255,0,0.7)',
    glow: 'rgba(191,255,0,0.45)',
    shinePeriod: 3,
    floatAnim: true,
    pulseBorder: true,
    holographic: true,
    sparkles: false,
    tilt3d: true,
    serialGlow: true,
  },
  sponsor: {
    label: 'Sponsor',
    color: '#FFD700',
    bg: 'rgba(255,215,0,0.08)',
    border: 'rgba(255,215,0,0.55)',
    glow: 'rgba(255,215,0,0.35)',
    shinePeriod: 6,
    floatAnim: false,
    pulseBorder: true,
    holographic: false,
    sparkles: false,
    tilt3d: false,
    serialGlow: false,
  },
};

export const RARITY_KEYFRAMES = `
/* Float up/down */
@keyframes bx-float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-8px); }
}

/* Glow pulse on the outer wrapper */
@keyframes bx-glow-lime {
  0%, 100% { box-shadow: 0 0 18px rgba(191,255,0,0.45), 0 0 40px rgba(191,255,0,0.2), 0 0 70px rgba(138,43,226,0.25); }
  50%       { box-shadow: 0 0 32px rgba(191,255,0,0.75), 0 0 70px rgba(191,255,0,0.35), 0 0 110px rgba(138,43,226,0.45); }
}
@keyframes bx-glow-purple {
  0%, 100% { box-shadow: 0 0 18px rgba(180,80,255,0.45), 0 0 40px rgba(191,255,0,0.15); }
  50%       { box-shadow: 0 0 36px rgba(180,80,255,0.75), 0 0 70px rgba(191,255,0,0.3); }
}
@keyframes bx-glow-gold {
  0%, 100% { box-shadow: 0 0 20px rgba(255,215,0,0.5), 0 0 50px rgba(255,215,0,0.2); }
  50%       { box-shadow: 0 0 40px rgba(255,215,0,0.85), 0 0 80px rgba(255,215,0,0.35); }
}
@keyframes bx-glow-rare {
  0%, 100% { box-shadow: 0 0 14px rgba(191,255,0,0.3); }
  50%       { box-shadow: 0 0 28px rgba(191,255,0,0.65); }
}
@keyframes bx-glow-sponsor {
  0%, 100% { box-shadow: 0 0 16px rgba(255,215,0,0.35), 0 0 32px rgba(191,255,0,0.1); }
  50%       { box-shadow: 0 0 32px rgba(255,215,0,0.7), 0 0 60px rgba(191,255,0,0.2); }
}

/* Animated border — marching gradient */
@keyframes bx-border-spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Shine sweep — a bright band crossing the card */
@keyframes bx-shine {
  0%   { left: -80%; }
  100% { left: 160%; }
}

/* Holographic rainbow diagonal sweep */
@keyframes bx-holo-sweep {
  0%   { background-position: 0% 50%; opacity: 0.55; }
  50%  { background-position: 100% 50%; opacity: 0.85; }
  100% { background-position: 0% 50%; opacity: 0.55; }
}

/* Border pulse (opacity) */
@keyframes bx-border-pulse {
  0%, 100% { opacity: 0.55; }
  50%       { opacity: 1; }
}

/* Sparkle blink */
@keyframes bx-sparkle {
  0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); }
  40%, 60% { opacity: 1; transform: scale(1.1) rotate(45deg); }
}

/* Serial number glow */
@keyframes bx-serial-glow {
  0%, 100% { text-shadow: 0 0 6px rgba(191,255,0,0.6); }
  50%       { text-shadow: 0 0 18px rgba(191,255,0,1), 0 0 32px rgba(191,255,0,0.6); }
}

/* Badge pulse for sponsor */
@keyframes bx-badge-pulse {
  0%, 100% { box-shadow: 0 0 4px rgba(255,215,0,0.4); }
  50%       { box-shadow: 0 0 14px rgba(255,215,0,0.9), 0 0 24px rgba(255,215,0,0.5); }
}

/* Coming soon teaser */
@keyframes bx-teaser {
  0%, 100% { opacity: 0.35; }
  50%       { opacity: 0.65; }
}

/* Card wrapper float class */
.bx-float    { animation: bx-float 3.5s ease-in-out infinite; }
.bx-float-slow { animation: bx-float 5s ease-in-out infinite; }

/* Glow wrappers */
.bx-glow-lime    { animation: bx-glow-lime    2s ease-in-out infinite; }
.bx-glow-purple  { animation: bx-glow-purple  2s ease-in-out infinite; }
.bx-glow-gold    { animation: bx-glow-gold    2s ease-in-out infinite; }
.bx-glow-rare    { animation: bx-glow-rare    3s ease-in-out infinite; }
.bx-glow-sponsor { animation: bx-glow-sponsor 2.5s ease-in-out infinite; }

/* Border pulse overlay */
.bx-border-pulse { animation: bx-border-pulse 2s ease-in-out infinite; }

/* Sparkle */
.bx-sparkle { animation: bx-sparkle 2s ease-in-out infinite; }

/* Serial glow text */
.bx-serial-glow { animation: bx-serial-glow 2s ease-in-out infinite; }

/* Badge pulse */
.bx-badge-pulse { animation: bx-badge-pulse 1.8s ease-in-out infinite; }

/* Teaser */
.bx-teaser { animation: bx-teaser 2.5s ease-in-out infinite; }
`;

let injected = false;
export function injectRarityKeyframes() {
  if (injected || typeof document === 'undefined') return;
  // Always re-check if element exists (HMR-safe)
  if (document.getElementById('bx-rarity-keyframes')) { injected = true; return; }
  injected = true;
  const style = document.createElement('style');
  style.id = 'bx-rarity-keyframes';
  style.textContent = RARITY_KEYFRAMES;
  document.head.appendChild(style);
}

export const SPARKLE_POSITIONS = [
  { top: '10%', left: '15%', delay: '0s',   dur: '1.8s', size: 5 },
  { top: '8%',  left: '75%', delay: '0.6s', dur: '2.1s', size: 4 },
  { top: '50%', left: '90%', delay: '1.2s', dur: '1.6s', size: 6 },
  { top: '80%', left: '20%', delay: '0.3s', dur: '2.3s', size: 4 },
  { top: '38%', left: '6%',  delay: '1.5s', dur: '1.9s', size: 5 },
  { top: '88%', left: '68%', delay: '0.9s', dur: '2.0s', size: 4 },
];