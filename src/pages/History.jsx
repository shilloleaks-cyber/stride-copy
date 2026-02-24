import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import RunCard from '../components/running/RunCard';

export default function History() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: runs = [], isLoading: runsLoading } = useQuery({
    queryKey: ['historyRuns'],
    queryFn: () => base44.entities.Runs.filter({ status: 'completed' }, '-start_time', 50),
    enabled: !isLoading && !!user,
  });

  const hasRuns = runs.length > 0;

  useEffect(() => {
    if (!isLoading && user && user.has_seen_welcome !== true) {
      navigate(createPageUrl('Welcome'), { replace: true });
    }
  }, [user, isLoading]);

  // Animated grain canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const drawGrain = () => {
      const { width, height } = canvas;
      if (!width || !height) { animId = requestAnimationFrame(drawGrain); return; }
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 18;
      }
      ctx.putImageData(imageData, 0, 0);
      animId = requestAnimationFrame(drawGrain);
    };

    drawGrain();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div style={styles.root}>
      {/* Grain overlay */}
      <canvas ref={canvasRef} style={styles.grain} />

      {/* Background glows */}
      <div style={styles.glowPurple} />
      <div style={styles.glowLime} />
      <div style={styles.glowBottom} />

      {/* Scanlines */}
      <div style={styles.scanlines} />

      {/* Content */}
      <div style={styles.content}>

        {/* Top label */}
        <div style={styles.topLabel}>
          <span style={styles.topDot} />
          RUN HISTORY
        </div>

        {/* Main headline */}
        <div style={styles.headlineWrap}>
          <h1 style={styles.headlineLine1}>ZERO KM.</h1>
          <h1 style={styles.headlineLine2}>ZERO<br />EXCUSES.</h1>
        </div>

        {/* Divider line */}
        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerIcon}>⚡</span>
          <div style={styles.dividerLine} />
        </div>

        {/* Subtext */}
        <p style={styles.subtext}>
          Every kilometer creates value.<br />
          <span style={styles.subtextAccent}>Start moving.</span>
        </p>

        {/* CTA Button */}
        <button
          style={styles.btn}
          onClick={async () => {
            await base44.auth.updateMe({ has_seen_welcome: true });
            navigate(createPageUrl('ActiveRun'));
          }}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = styles.btnHoverShadow;
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = styles.btnShadow;
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
          }}
        >
          GO RUN
        </button>

        {/* Bottom stat strip */}
        <div style={styles.statStrip}>
          {['0 RUNS', '0 KM', '0 COINS'].map((s, i) => (
            <React.Fragment key={s}>
              <span style={styles.stat}>{s}</span>
              {i < 2 && <span style={styles.statDivider}>·</span>}
            </React.Fragment>
          ))}
        </div>

      </div>

      {/* Bottom tagline */}
      <div style={styles.bottomBar}>
        <span style={styles.bottomText}>RUN · EARN · EVOLVE</span>
      </div>
    </div>
  );
}

const btnShadow = '0 0 40px rgba(191,255,0,0.45), 0 0 80px rgba(191,255,0,0.20), 0 8px 32px rgba(0,0,0,0.6)';
const btnHoverShadow = '0 0 60px rgba(191,255,0,0.65), 0 0 120px rgba(191,255,0,0.30), 0 12px 40px rgba(0,0,0,0.7)';

const styles = {
  root: {
    position: 'relative',
    minHeight: '100vh',
    backgroundColor: '#07070A',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
  },
  grain: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 2,
    opacity: 1,
    mixBlendMode: 'overlay',
  },
  glowPurple: {
    position: 'absolute',
    top: '-10%',
    left: '-15%',
    width: '70vw',
    height: '70vw',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(138,43,226,0.22) 0%, transparent 65%)',
    pointerEvents: 'none',
    zIndex: 1,
  },
  glowLime: {
    position: 'absolute',
    bottom: '5%',
    right: '-10%',
    width: '55vw',
    height: '55vw',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(191,255,0,0.14) 0%, transparent 65%)',
    pointerEvents: 'none',
    zIndex: 1,
  },
  glowBottom: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100vw',
    height: '30vh',
    background: 'linear-gradient(to top, rgba(138,43,226,0.12) 0%, transparent 100%)',
    pointerEvents: 'none',
    zIndex: 1,
  },
  scanlines: {
    position: 'fixed',
    inset: 0,
    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
    pointerEvents: 'none',
    zIndex: 3,
    opacity: 0.6,
  },
  content: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '0 24px',
    width: '100%',
    maxWidth: 480,
  },
  topLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.28em',
    color: 'rgba(255,255,255,0.35)',
    marginBottom: 36,
    textTransform: 'uppercase',
  },
  topDot: {
    display: 'inline-block',
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: '#BFFF00',
    boxShadow: '0 0 8px rgba(191,255,0,0.8)',
  },
  headlineWrap: {
    marginBottom: 28,
  },
  headlineLine1: {
    margin: 0,
    fontSize: 'clamp(52px, 14vw, 88px)',
    fontWeight: 900,
    lineHeight: 0.95,
    letterSpacing: '-0.03em',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    textShadow: '0 0 80px rgba(255,255,255,0.12)',
  },
  headlineLine2: {
    margin: 0,
    fontSize: 'clamp(52px, 14vw, 88px)',
    fontWeight: 900,
    lineHeight: 0.95,
    letterSpacing: '-0.03em',
    color: '#BFFF00',
    textTransform: 'uppercase',
    textShadow: '0 0 60px rgba(191,255,0,0.5), 0 0 120px rgba(191,255,0,0.25)',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    maxWidth: 280,
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15))',
  },
  dividerIcon: {
    fontSize: 16,
    color: '#BFFF00',
    filter: 'drop-shadow(0 0 6px rgba(191,255,0,0.8))',
  },
  subtext: {
    margin: '0 0 40px',
    fontSize: 16,
    lineHeight: 1.65,
    color: 'rgba(255,255,255,0.50)',
    fontWeight: 400,
    letterSpacing: '0.01em',
  },
  subtextAccent: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: 600,
  },
  btn: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '18px 48px',
    borderRadius: 999,
    background: 'linear-gradient(135deg, #BFFF00 0%, #8FD400 100%)',
    color: '#07070A',
    fontSize: 16,
    fontWeight: 900,
    letterSpacing: '0.14em',
    border: 'none',
    cursor: 'pointer',
    boxShadow: btnShadow,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    textTransform: 'uppercase',
    marginBottom: 36,
  },
  btnArrow: {
    fontSize: 13,
  },
  btnShadow,
  btnHoverShadow,
  statStrip: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  stat: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.18em',
    color: 'rgba(255,255,255,0.25)',
  },
  statDivider: {
    color: 'rgba(255,255,255,0.15)',
    fontSize: 14,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 28,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'center',
    zIndex: 10,
  },
  bottomText: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.35em',
    color: 'rgba(255,255,255,0.18)',
    textTransform: 'uppercase',
  },
};