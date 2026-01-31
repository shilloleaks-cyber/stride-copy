/**
 * Premium cyber-runner audio system using Web Audio API
 * Subtle, layered coin feedback with haptic support
 */

let audioContext = null;

const getAudioContext = () => {
  if (!audioContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioContext = new AudioContext();
    }
  }
  return audioContext;
};

const triggerHaptic = (pattern) => {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

/**
 * Coin Spawn: Short digital sparkle pop (80–120ms, medium-high pitch, ~35% volume)
 */
export const playSpawnSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  triggerHaptic(30); // Light haptic

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, now);
  osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);

  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.1);
};

/**
 * Coin Travel: Soft airy whoosh with stereo pan
 * @param {number} panValue - -1 (left) to 1 (right)
 */
export const playTravelSound = (panValue = 0) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const noise = ctx.createBufferSource();
  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);

  // White noise
  for (let i = 0; i < noiseBuffer.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noise.buffer = noiseBuffer;

  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  const panner = ctx.createStereoPanner();

  filter.type = 'highpass';
  filter.frequency.setValueAtTime(3000, now);
  filter.frequency.exponentialRampToValueAtTime(5000, now + 0.15);

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0, now + 0.2);

  panner.pan.setValueAtTime(panValue * 0.6, now);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(panner);
  panner.connect(ctx.destination);

  noise.start(now);
  noise.stop(now + 0.2);
};

/**
 * Coin Collect: Crystal arcade chime per coin
 * Pitch increases per hit, final coin louder
 * @param {number} coinIndex - Which coin in sequence (0-based)
 * @param {number} totalCoins - Total number of coins
 */
export const playCollectSound = (coinIndex, totalCoins) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  triggerHaptic(20); // Light haptic per coin

  const now = ctx.currentTime;
  const isFinal = coinIndex === totalCoins - 1;
  const baseFreq = 880 + coinIndex * 220; // Pitch increases per coin
  const finalFreq = isFinal ? baseFreq * 1.2 : baseFreq;
  const gainValue = isFinal ? 0.4 : 0.25;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(finalFreq, now);
  osc.frequency.exponentialRampToValueAtTime(finalFreq * 0.6, now + 0.15);

  gain.gain.setValueAtTime(gainValue, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.15);
};

/**
 * Batch collect chime for >5 coins (2-3 grouped chimes)
 * @param {number} coinCount - Total coins earned
 */
export const playBatchCollectSound = (coinCount) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const groupCount = coinCount > 10 ? 3 : 2;
  const coinsPerGroup = Math.ceil(coinCount / groupCount);

  for (let g = 0; g < groupCount; g++) {
    const groupDelay = g * 0.08;
    const baseFreq = 1100 + g * 200;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now + groupDelay);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + groupDelay + 0.12);

    gain.gain.setValueAtTime(0.3, now + groupDelay);
    gain.gain.exponentialRampToValueAtTime(0.01, now + groupDelay + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + groupDelay);
    osc.stop(now + groupDelay + 0.12);
  }
};

/**
 * Balance Settle: Deep soft synth hit with shimmer tail
 * @param {boolean} isRare - Whether this is a rare reward
 */
export const playSettleSound = (isRare = false) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  triggerHaptic(isRare ? [50, 30, 50] : [60]); // Medium haptic

  const now = ctx.currentTime;
  const baseFreq = isRare ? 220 : 264; // Lower for rare
  const duration = 0.8;

  // Main synth hit
  const mainOsc = ctx.createOscillator();
  const mainGain = ctx.createGain();

  mainOsc.type = 'sine';
  mainOsc.frequency.setValueAtTime(baseFreq, now);
  mainOsc.frequency.exponentialRampToValueAtTime(baseFreq * 0.3, now + duration);

  mainGain.gain.setValueAtTime(0.35, now);
  mainGain.gain.exponentialRampToValueAtTime(0, now + duration);

  mainOsc.connect(mainGain);
  mainGain.connect(ctx.destination);

  mainOsc.start(now);
  mainOsc.stop(now + duration);

  // Shimmer overlay (noise with high-pass filter)
  const shimmerBuffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
  const shimmerData = shimmerBuffer.getChannelData(0);
  for (let i = 0; i < shimmerBuffer.length; i++) {
    shimmerData[i] = Math.random() * 2 - 1;
  }

  const shimmerSource = ctx.createBufferSource();
  shimmerSource.buffer = shimmerBuffer;

  const shimmerFilter = ctx.createBiquadFilter();
  shimmerFilter.type = 'highpass';
  shimmerFilter.frequency.setValueAtTime(6000, now);

  const shimmerGain = ctx.createGain();
  shimmerGain.gain.setValueAtTime(0.15, now);
  shimmerGain.gain.exponentialRampToValueAtTime(0, now + duration);

  shimmerSource.connect(shimmerFilter);
  shimmerFilter.connect(shimmerGain);
  shimmerGain.connect(ctx.destination);

  shimmerSource.start(now);
  shimmerSource.stop(now + duration);
};

/**
 * Rare Reward: Reverse swell + sparkle cascade before settle
 */
export const playRarePrelude = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const duration = 0.4;

  // Reverse swell
  const swell = ctx.createOscillator();
  const swellGain = ctx.createGain();

  swell.type = 'sine';
  swell.frequency.setValueAtTime(600, now);
  swell.frequency.exponentialRampToValueAtTime(1200, now + duration);

  swellGain.gain.setValueAtTime(0, now);
  swellGain.gain.exponentialRampToValueAtTime(0.25, now + duration * 0.7);
  swellGain.gain.exponentialRampToValueAtTime(0, now + duration);

  swell.connect(swellGain);
  swellGain.connect(ctx.destination);

  swell.start(now);
  swell.stop(now + duration);

  // Sparkle cascade (high frequency bursts)
  for (let i = 0; i < 3; i++) {
    const sparkleDelay = now + i * 0.08;
    const sparkle = ctx.createOscillator();
    const sparkleGain = ctx.createGain();

    sparkle.type = 'sine';
    sparkle.frequency.setValueAtTime(2400 + i * 400, sparkleDelay);
    sparkle.frequency.exponentialRampToValueAtTime(1200, sparkleDelay + 0.08);

    sparkleGain.gain.setValueAtTime(0.2, sparkleDelay);
    sparkleGain.gain.exponentialRampToValueAtTime(0, sparkleDelay + 0.08);

    sparkle.connect(sparkleGain);
    sparkleGain.connect(ctx.destination);

    sparkle.start(sparkleDelay);
    sparkle.stop(sparkleDelay + 0.08);
  }
};