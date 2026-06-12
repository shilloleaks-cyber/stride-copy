// Rarity configuration — single source of truth for colors + effects
export const RARITY_CONFIG = {
  common: {
    label: 'Common',
    color: 'rgba(180,180,180,1)',
    bg: 'rgba(180,180,180,0.08)',
    border: 'rgba(180,180,180,0.25)',
    glow: 'rgba(180,180,180,0.15)',
    shimmerColor: 'rgba(255,255,255,0.12)',
    shinePeriod: null,
    floatAnim: false,
    pulseBorder: false,
    holographic: false,
    sparkles: false,
    tilt3d: false,
  },
  rare: {
    label: 'Rare',
    color: '#BFFF00',
    bg: 'rgba(191,255,0,0.08)',
    border: 'rgba(191,255,0,0.35)',
    glow: 'rgba(191,255,0,0.22)',
    shimmerColor: 'rgba(191,255,0,0.18)',
    shinePeriod: 8,
    floatAnim: false,
    pulseBorder: false,
    holographic: false,
    sparkles: false,
    tilt3d: false,
  },
  epic: {
    label: 'Epic',
    color: 'rgba(180,80,255,1)',
    bg: 'rgba(180,80,255,0.09)',
    border: 'rgba(180,80,255,0.45)',
    glow: 'rgba(180,80,255,0.3)',
    shimmerColor: 'rgba(191,255,0,0.22)',
    shinePeriod: 5,
    floatAnim: true,
    pulseBorder: true,
    holographic: false,
    sparkles: false,
    tilt3d: false,
    // extra glow color for dual-tone
    glowAlt: 'rgba(191,255,0,0.18)',
  },
  legendary: {
    label: 'Legendary',
    color: '#FFD700',
    bg: 'rgba(255,215,0,0.08)',
    border: 'rgba(255,215,0,0.55)',
    glow: 'rgba(255,215,0,0.35)',
    shimmerColor: 'rgba(255,255,255,0.3)',
    shinePeriod: 3,
    floatAnim: true,
    pulseBorder: true,
    holographic: true,
    sparkles: true,
    tilt3d: false,
  },
  founder: {
    label: 'Founder',
    color: '#BFFF00',
    bg: 'rgba(191,255,0,0.09)',
    border: 'rgba(191,255,0,0.55)',
    glow: 'rgba(191,255,0,0.35)',
    shimmerColor: 'rgba(191,255,0,0.28)',
    shinePeriod: 4,
    floatAnim: true,
    pulseBorder: true,
    holographic: false,
    sparkles: false,
    tilt3d: true,
    // premium dual glow
    glowAlt: 'rgba(138,43,226,0.3)',
    serialGlow: true,
  },
  sponsor: {
    label: 'Sponsor',
    color: '#FFD700',
    bg: 'rgba(255,215,0,0.08)',
    border: 'rgba(255,215,0,0.4)',
    glow: 'rgba(255,215,0,0.28)',
    shimmerColor: 'rgba(255,215,0,0.2)',
    shinePeriod: 6,
    floatAnim: false,
    pulseBorder: true,
    holographic: false,
    sparkles: false,
    tilt3d: false,
    glowAlt: 'rgba(191,255,0,0.15)',
  },
};

// CSS keyframe string to inject once
export const RARITY_KEYFRAMES = `
@keyframes bx-float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
}
@keyframes bx-pulse-border {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}
@keyframes bx-shine {
  0% { transform: translateX(-150%) skewX(-12deg); }
  100% { transform: translateX(250%) skewX(-12deg); }
}
@keyframes bx-holo {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes bx-glow-pulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}
@keyframes bx-sparkle {
  0%, 100% { opacity: 0; transform: scale(0.5); }
  50%       { opacity: 1; transform: scale(1); }
}
@keyframes bx-sponsor-badge {
  0%, 100% { box-shadow: 0 0 6px rgba(255,215,0,0.3); }
  50%       { box-shadow: 0 0 16px rgba(255,215,0,0.7); }
}
`;

let injected = false;
export function injectRarityKeyframes() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const style = document.createElement('style');
  style.id = 'bx-rarity-keyframes';
  style.textContent = RARITY_KEYFRAMES;
  document.head.appendChild(style);
}

// Sparkle positions for legendary cards (small, fast, scattered)
export const SPARKLE_POSITIONS = [
  { top: '12%', left: '18%', delay: '0s',    dur: '2.2s' },
  { top: '8%',  left: '72%', delay: '0.7s',  dur: '1.8s' },
  { top: '55%', left: '88%', delay: '1.4s',  dur: '2.5s' },
  { top: '78%', left: '22%', delay: '0.3s',  dur: '2.0s' },
  { top: '40%', left: '5%',  delay: '1.1s',  dur: '1.6s' },
  { top: '90%', left: '65%', delay: '0.9s',  dur: '2.8s' },
];