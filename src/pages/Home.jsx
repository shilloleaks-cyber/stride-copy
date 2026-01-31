import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

// ===== Coin Pop Animation =====
function CoinPopLayer({ pops }) {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 99999 }}>
      {pops.map((pop) => (
        <div
          key={pop.id}
          style={{
            position: 'absolute',
            left: pop.x,
            top: pop.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="coinPopText">+{pop.amount}</div>
          {pop.particles.map((p) => (
            <div
              key={p.k}
              className="coinParticle"
              style={{
                '--dx': `${p.dx}px`,
                '--dy': `${p.dy}px`,
                '--s': p.s,
              }}
            >
              🪙
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  
  // Coin pop animation state
  const [coinPops, setCoinPops] = useState([]);
  const popId = useRef(0);

  const triggerCoinPop = (amount = 10, opts = {}) => {
    const x = opts.x ?? "90%";
    const y = opts.y ?? "12%";
    const id = ++popId.current;

    const particles = Array.from({ length: 10 }).map((_, i) => {
      const angle = (Math.PI * 2 * i) / 10;
      const radius = 26 + Math.random() * 32;
      const dx = Math.cos(angle) * radius;
      const dy = Math.sin(angle) * radius * 0.8 - (18 + Math.random() * 18);
      const s = (0.8 + Math.random() * 0.6).toFixed(2);
      return { k: `${id}-${i}`, dx, dy, s };
    });

    setCoinPops((prev) => [...prev, { id, amount, x, y, particles }]);
    setTimeout(() => {
      setCoinPops((prev) => prev.filter((p) => p.id !== id));
    }, 1100);
  };

  // ===== Fetch Real Data =====
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: runs = [] } = useQuery({
    queryKey: ['runs'],
    queryFn: () => base44.entities.Run.list('-start_time', 100),
  });

  const completedRuns = runs.filter(r => r.status === 'completed');

  // Today's stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayRuns = completedRuns.filter(r => {
    const runDate = new Date(r.start_time);
    runDate.setHours(0, 0, 0, 0);
    return runDate.getTime() === today.getTime();
  });
  const todayDistanceKm = todayRuns.reduce((sum, r) => sum + (r.distance_km || 0), 0);

  // Streak calculation
  const calculateStreak = () => {
    if (completedRuns.length === 0) return 0;
    const sortedRuns = [...completedRuns].sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
    const uniqueDays = new Set();
    sortedRuns.forEach(run => {
      const date = new Date(run.start_time);
      date.setHours(0, 0, 0, 0);
      uniqueDays.add(date.getTime());
    });
    const sortedDays = Array.from(uniqueDays).sort((a, b) => b - a);
    let streak = 0;
    const oneDayMs = 24 * 60 * 60 * 1000;
    for (let i = 0; i < sortedDays.length; i++) {
      const currentDay = sortedDays[i];
      const expectedDay = today.getTime() - (i * oneDayMs);
      if (Math.abs(currentDay - expectedDay) < oneDayMs / 2) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };
  const streakDays = calculateStreak();

  // This week's pace
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weekRuns = completedRuns.filter(r => new Date(r.start_time) >= oneWeekAgo);
  const weekAvgPaceRaw = weekRuns.length > 0
    ? weekRuns.reduce((sum, r) => sum + (r.pace_min_per_km || 0), 0) / weekRuns.length
    : 0;
  const formatPace = (pace) => {
    if (!pace || pace === 0) return "--:--";
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const avgPaceWeek = formatPace(weekAvgPaceRaw);

  // Best pace
  const bestPacePR = completedRuns.length > 0
    ? formatPace(Math.min(...completedRuns.map(r => r.pace_min_per_km || 999).filter(p => p > 0)))
    : "--:--";

  // Weekly distance data
  const weekly = useMemo(() => {
    const data = [0, 0, 0, 0, 0, 0, 0];
    const todayDay = today.getDay();
    weekRuns.forEach(r => {
      const runDate = new Date(r.start_time);
      const dayOfWeek = runDate.getDay();
      const mondayIndex = (dayOfWeek + 6) % 7;
      data[mondayIndex] += r.distance_km || 0;
    });
    return data;
  }, [weekRuns]);

  // Recent runs
  const recentRuns = completedRuns.slice(0, 2).map(r => {
    const date = new Date(r.start_time);
    const formatDate = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    const formatTime = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const durationMins = Math.floor((r.duration_seconds || 0) / 60);
    const durationSecs = (r.duration_seconds || 0) % 60;
    return {
      date: formatDate,
      time: formatTime,
      km: (r.distance_km || 0).toFixed(2),
      dur: `${durationMins}:${durationSecs.toString().padStart(2, '0')}`,
      pace: formatPace(r.pace_min_per_km),
      bpm: r.avg_heart_rate || 0,
    };
  });

  // Game stats
  const coinBalance = user?.coin_balance || 0;
  const level = user?.current_level || 1;
  const levelProgress = {
    current: Math.floor(coinBalance % 100),
    need: 100,
  };

  // ===== UI states =====
  const [showPaceHistory, setShowPaceHistory] = useState(false);

  // ===== Watch coin balance changes =====
  const prevCoinsRef = useRef(null);

  useEffect(() => {
    if (prevCoinsRef.current === null) {
      prevCoinsRef.current = coinBalance;
      return;
    }

    const prev = prevCoinsRef.current;
    const next = coinBalance;

    if (typeof prev === "number" && typeof next === "number" && next > prev) {
      const gained = next - prev;
      triggerCoinPop(gained, { x: "90%", y: "12%" });
    }

    prevCoinsRef.current = next;
  }, [coinBalance]);

  const streakTier = useMemo(() => {
    if (streakDays >= 14) return 14;
    if (streakDays >= 7) return 7;
    if (streakDays >= 3) return 3;
    return 0;
  }, [streakDays]);

  function handleStartRun() {
    navigate(createPageUrl('ActiveRun'));
  }

  function handleCoinClick() {
    navigate(createPageUrl('Wallet'));
  }

  // Pace history data (last 7 days avg)
  const paceHistory = useMemo(() => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const dayRuns = completedRuns.filter(r => {
        const runDate = new Date(r.start_time);
        return runDate >= day && runDate < nextDay;
      });
      
      const avgPace = dayRuns.length > 0
        ? dayRuns.reduce((sum, r) => sum + (r.pace_min_per_km || 0), 0) / dayRuns.length
        : 0;
      
      last7Days.push(avgPace || 8);
    }
    return last7Days;
  }, [completedRuns]);

  return (
    <div className="homeRoot">
      <style>{homeStyles}</style>

      {/* Coin Pop Animation */}
      <CoinPopLayer pops={coinPops} />

      {/* Sticky Coin HUD */}
      <motion.button
        className="coinHud"
        onClick={handleCoinClick}
        aria-label="Coin balance"
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ 
          scale: 1, 
          opacity: 1,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="coinIcon">🪙</span>
        <motion.span 
          className="coinText"
          key={coinBalance}
          initial={{ scale: 1 }}
          animate={{ 
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 0.3 }}
        >
          {coinBalance}
        </motion.span>
      </motion.button>

      <header className="topHeader">
        <div className="welcome">WELCOME BACK</div>
        <div className="title">Your Running</div>
      </header>

      {/* HERO / START */}
      <section className="heroCard" role="region" aria-label="Start new run">
        <div className="heroLeft">
          <div className="heroSmall">Ready to run?</div>
          <div className="heroBig">Start New Run</div>
          <div className="heroRule">
            <span className="ruleDot" /> 1 km = 10 coins
          </div>
        </div>
        <button className="heroPlay" onClick={handleStartRun} aria-label="Start run">
          ▶
        </button>
      </section>

      {/* TODAY */}
      <section className="section">
        <div className="sectionLabel">TODAY</div>
        <div className="grid2">
          <div className="statCard activeGlow">
            <div className="statTop">
              <div className="statLabel">DISTANCE</div>
              <div className="statBadge">📍</div>
            </div>
            <div className="statValue">
              {todayDistanceKm.toFixed(1)} <span className="unit">km</span>
            </div>
          </div>

          <div className="statCard">
            <div className="statTop">
              <div className="statLabel">STREAK</div>
              <div className={`streakFlame tier-${streakTier}`} title="Streak tier">
                🔥
              </div>
            </div>
            <div className="statValue">
              {streakDays} <span className="unit">days</span>
            </div>
            <div className="subNote">
              {streakTier === 14
                ? "Beast mode (14d)"
                : streakTier === 7
                ? "Hot streak (7d)"
                : streakTier === 3
                ? "Warming up (3d)"
                : "Start your streak"}
            </div>
          </div>
        </div>
      </section>

      {/* PERFORMANCE */}
      <section className="section">
        <div className="sectionLabel">PERFORMANCE</div>
        <div className="grid2">
          <button className="statCard tappable" onClick={() => setShowPaceHistory(true)}>
            <div className="statTop">
              <div className="statLabel">AVG PACE (WEEK)</div>
              <div className="statBadge">⚡</div>
            </div>
            <div className="statValue">
              {avgPaceWeek} <span className="unit">/km</span>
            </div>
            <div className="subNote">Tap to see pace history</div>
          </button>

          <div className="statCard activeGlow">
            <div className="statTop">
              <div className="statLabel">BEST PACE</div>
              <div className="statBadge">🏅</div>
            </div>
            <div className="statValue">
              {bestPacePR} <span className="unit">/km</span>
            </div>
            <div className="subNote">Personal record</div>
          </div>
        </div>
      </section>

      {/* GAME */}
      <section className="section">
        <div className="sectionLabel">GAME</div>

        <div className="grid2">
          <button className="levelCard" onClick={() => navigate(createPageUrl('LevelProgress'))}>
            <div className="levelTop">
              <div className="levelIcon">⚡</div>
              <div>
                <div className="statLabel">LEVEL</div>
                <div className="levelValue">{level}</div>
              </div>
            </div>

            <div className="progressWrap" aria-label="Level progress">
              <div
                className="progressFill"
                style={{
                  width: `${Math.min(100, Math.round((levelProgress.current / levelProgress.need) * 100))}%`,
                }}
              />
            </div>

            <div className="subNote">
              {levelProgress.current} / {levelProgress.need} coins to Level {level + 1}
            </div>
          </button>

          <div className="statCard activeGlow">
            <div className="statTop">
              <div className="statLabel">COIN BALANCE</div>
              <div className="statBadge">🪙</div>
            </div>
            <div className="statValue">
              {coinBalance} <span className="unit">coins</span>
            </div>
            <div className="subNote">Run → Earn → Redeem</div>
          </div>
        </div>

        {/* Daily Quest */}
        <div className="questCard">
          <div className="questTop">
            <div>
              <div className="sectionLabel small">DAILY QUEST</div>
              <div className="questTitle">Run 1 km today</div>
              <div className="subNote">Reward: +10 coins</div>
            </div>
            <button className="questBtn" onClick={handleStartRun}>Start</button>
          </div>
        </div>
      </section>

      {/* DAILY */}
      <section className="section">
        <div className="sectionLabel">DAILY</div>
        <div className="grid2">
          <button className="pillCard goldish" onClick={() => navigate(createPageUrl('Leaderboard'))}>
            <span className="pillIcon">🏆</span>
            <div>
              <div className="pillTitle">อันดับ</div>
              <div className="pillSub">ดูอันดับผู้เล่น</div>
            </div>
          </button>

          <button className="pillCard purplish" onClick={() => navigate(createPageUrl('Challenges'))}>
            <span className="pillIcon">🎯</span>
            <div>
              <div className="pillTitle">Challenges</div>
              <div className="pillSub">เข้าร่วมกิจกรรม</div>
            </div>
          </button>
        </div>
      </section>

      {/* WEEKLY DISTANCE */}
      <section className="section">
        <div className="chartCard">
          <div className="sectionLabel">WEEKLY DISTANCE</div>
          <WeeklyBarChart data={weekly} />
        </div>
      </section>

      {/* RECENT RUNS */}
      <section className="section">
        <div className="rowBetween">
          <div className="sectionLabel">RECENT RUNS</div>
          <button className="seeAll" onClick={() => navigate(createPageUrl('History'))}>
            See all
          </button>
        </div>

        <div className="runList">
          {recentRuns.map((r, idx) => (
            <button key={idx} className="runCard" onClick={() => navigate(createPageUrl('History'))}>
              <div className="runHeader">
                <div>
                  <div className="runDate">{r.date}</div>
                  <div className="runTime">{r.time}</div>
                </div>
                <div className="chev">›</div>
              </div>

              <div className="runStats">
                <div className="miniStat">
                  <span className="miniIcon green">📍</span>
                  <div>
                    <div className="miniVal">{r.km}</div>
                    <div className="miniLbl">km</div>
                  </div>
                </div>
                <div className="miniStat">
                  <span className="miniIcon blue">⏱</span>
                  <div>
                    <div className="miniVal">{r.dur}</div>
                    <div className="miniLbl">time</div>
                  </div>
                </div>
                <div className="miniStat">
                  <span className="miniIcon purple">⚡</span>
                  <div>
                    <div className="miniVal">{r.pace}</div>
                    <div className="miniLbl">/km</div>
                  </div>
                </div>
                <div className="miniStat">
                  <span className="miniIcon red">❤</span>
                  <div>
                    <div className="miniVal">{r.bpm}</div>
                    <div className="miniLbl">bpm</div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Pace history modal */}
      {showPaceHistory && (
        <Modal title="Pace History" onClose={() => setShowPaceHistory(false)}>
          <div className="modalBody">
            <div className="subNote" style={{ marginBottom: 10 }}>
              Avg Pace (week) — ดูกราฟเพื่อเห็นการพัฒนา
            </div>
            <SimpleLineGraph
              points={paceHistory}
              accent="var(--lime)"
              muted="var(--purple)"
            />
            <div className="subNote" style={{ marginTop: 10 }}>
              Tip: pace ต่ำลง = เร็วขึ้น 😄
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ===== Components =====

function Modal({ title, children, onClose }) {
  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <div className="modalCard">
        <div className="modalTop">
          <div className="modalTitle">{title}</div>
          <button className="modalClose" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function WeeklyBarChart({ data }) {
  const max = Math.max(...data, 1);
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="bars">
      {data.map((v, i) => {
        const h = Math.max(6, Math.round((v / max) * 100));
        return (
          <div className="barCol" key={i}>
            <div className="barTrack">
              <div className="barFill" style={{ height: `${h}%` }} />
            </div>
            <div className="barLbl">{labels[i]}</div>
          </div>
        );
      })}
      <div className="goalLine" aria-hidden="true" />
    </div>
  );
}

const homeStyles = `
/* ===== Theme (60/10/30) ===== */
:root{
  --bg: #0A0A0A;
  --purple: #8A2BE2;
  --lime: #BFFF00;
  --text: rgba(255,255,255,.92);
  --muted: rgba(255,255,255,.60);
  --muted2: rgba(255,255,255,.40);
  --line: rgba(255,255,255,.10);
  --card: rgba(255,255,255,.05);
  --card2: rgba(255,255,255,.04);
  --r: 22px;
  --shadow: 0 14px 40px rgba(0,0,0,.55);
  --shadow2: 0 10px 26px rgba(0,0,0,.45);
}
/* ===== Coin Pop Animation ===== */
.coinPopText {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  font-size: 32px;
  font-weight: 900;
  color: var(--lime);
  text-shadow: 0 0 20px rgba(191,255,0,0.6), 0 0 40px rgba(191,255,0,0.3);
  animation: coinTextPop 1s ease-out forwards;
  pointer-events: none;
}
@keyframes coinTextPop {
  0% { 
    opacity: 0;
    transform: translateX(-50%) translateY(0) scale(0.5);
  }
  20% {
    opacity: 1;
    transform: translateX(-50%) translateY(-20px) scale(1.1);
  }
  100% {
    opacity: 0;
    transform: translateX(-50%) translateY(-60px) scale(0.9);
  }
}
.coinParticle {
  position: absolute;
  top: 0;
  left: 0;
  font-size: 20px;
  animation: coinParticleBurst 1s ease-out forwards;
  pointer-events: none;
  filter: drop-shadow(0 0 8px rgba(191,255,0,0.4));
}
@keyframes coinParticleBurst {
  0% {
    opacity: 1;
    transform: translate(0, 0) scale(var(--s, 1)) rotate(0deg);
  }
  100% {
    opacity: 0;
    transform: translate(var(--dx, 0), var(--dy, 0)) scale(calc(var(--s, 1) * 0.3)) rotate(360deg);
  }
}
.homeRoot {
  min-height: 100vh;
  background: radial-gradient(1200px 600px at 50% -10%, rgba(138,43,226,.18), transparent 55%),
              radial-gradient(900px 500px at 15% 10%, rgba(191,255,0,.10), transparent 60%),
              var(--bg);
  color: var(--text);
  padding: 18px 16px 90px;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
}
.topHeader{ margin: 6px 2px 14px; }
.welcome{ letter-spacing: .18em; font-size: 12px; color:var(--muted2); }
.title{ font-size: 40px; font-weight: 700; margin-top: 4px; }
.coinHud{
  position: fixed;
  top: 14px; right: 14px;
  display:flex; align-items:center; gap:8px;
  padding: 10px 12px;
  border-radius: 999px;
  background: rgba(10,10,10,0.72);
  border: 1px solid rgba(191,255,0,0.25);
  color: var(--text);
  backdrop-filter: blur(10px);
  z-index: 9999;
  cursor: pointer;
  box-shadow: 0 0 20px rgba(191,255,0,0.15);
  transition: all 0.2s ease;
}
.coinHud:hover {
  box-shadow: 0 0 30px rgba(191,255,0,0.25);
  border-color: rgba(191,255,0,0.35);
}
.coinIcon{ filter: drop-shadow(0 0 10px rgba(191,255,0,0.35)); }
.coinText{ font-weight: 800; color:var(--lime); }
.coinPop{
  position:absolute;
  top:-10px; right: 6px;
  font-weight: 900;
  color:var(--lime);
  animation: pop 0.85s ease-out forwards;
  text-shadow: 0 0 14px rgba(191,255,0,.35);
}
@keyframes pop{
  0%{ transform: translateY(6px) scale(.9); opacity: 0; }
  35%{ transform: translateY(-2px) scale(1.05); opacity: 1; }
  100%{ transform: translateY(-18px) scale(.95); opacity: 0; }
}
.heroCard{
  position: relative;
  padding: 16px 16px;
  border-radius: 22px;
  background: linear-gradient(90deg, var(--lime) 0%, var(--purple) 100%);
  color: #0A0A0A;
  display:flex; align-items:center; justify-content:space-between;
  box-shadow: var(--shadow);
  margin-bottom: 18px;
}
.heroSmall{ font-size: 14px; opacity:.85; }
.heroBig{ font-size: 28px; font-weight: 900; margin-top: 2px; }
.heroRule{ margin-top: 8px; font-size: 12px; font-weight: 700; opacity:.8; display:flex; align-items:center; gap:8px; }
.ruleDot{ width:8px; height:8px; border-radius:999px; background:#0A0A0A; opacity:.8; }
.heroPlay{
  width: 52px; height: 52px;
  border-radius: 999px;
  border: 1px solid rgba(10,10,10,0.25);
  background: rgba(10,10,10,0.18);
  display:grid; place-items:center;
  font-weight: 900;
  cursor: pointer;
}
.section{ margin-top: 16px; }
.sectionLabel{
  letter-spacing: .18em;
  font-size: 12px;
  color:var(--muted2);
  margin: 0 2px 10px;
}
.sectionLabel.small{ margin:0 0 6px; }
.grid2{ display:grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.statCard{
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 14px;
  text-align:left;
  box-shadow: var(--shadow2);
}
.tappable{ cursor:pointer; }
.activeGlow{
  box-shadow: 0 18px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(191,255,0,0.12) inset;
}
.statTop{ display:flex; align-items:center; justify-content:space-between; }
.statLabel{ font-size: 12px; letter-spacing:.12em; color:var(--muted2); }
.statBadge{
  width: 34px; height: 34px; border-radius: 12px;
  background: rgba(10,10,10,0.25);
  border: 1px solid var(--line);
  display:grid; place-items:center;
  color:var(--lime);
}
.statValue{ font-size: 34px; font-weight: 900; margin-top: 8px; }
.unit{ font-size: 14px; font-weight: 800; color:var(--muted); margin-left: 4px; }
.subNote{ margin-top: 8px; font-size: 12px; color:var(--muted); }
.streakFlame{
  width: 34px; height: 34px; border-radius: 12px;
  background: rgba(10,10,10,0.25);
  border: 1px solid var(--line);
  display:grid; place-items:center;
}
.tier-3{ animation: flame 1.2s ease-in-out infinite; }
.tier-7{ animation: flame 0.9s ease-in-out infinite; filter: drop-shadow(0 0 10px rgba(191,255,0,0.35)); }
.tier-14{ animation: flame 0.75s ease-in-out infinite; filter: drop-shadow(0 0 14px rgba(138,43,226,0.35)); }
@keyframes flame{
  0%,100%{ transform: translateY(0) scale(1); }
  50%{ transform: translateY(-2px) scale(1.06); }
}
.levelCard{
  background: radial-gradient(120% 140% at 10% 10%, rgba(138,43,226,0.35) 0%, rgba(10,10,10,0.85) 58%, rgba(10,10,10,1) 100%);
  border: 1px solid rgba(138,43,226,0.22);
  border-radius: 18px;
  padding: 14px;
  box-shadow: var(--shadow);
  cursor: pointer;
  text-align: left;
}
.levelTop{ display:flex; gap: 12px; align-items:center; }
.levelIcon{
  width: 44px; height: 44px; border-radius: 16px;
  background: rgba(138,43,226,0.25);
  border: 1px solid var(--line);
  display:grid; place-items:center;
  color:var(--purple);
  font-size: 18px;
  box-shadow: 0 0 0 1px rgba(191,255,0,0.10) inset;
}
.levelValue{ font-size: 34px; font-weight: 900; margin-top: 2px; }
.progressWrap{
  height: 10px;
  border-radius: 999px;
  background: var(--line);
  overflow:hidden;
  margin-top: 12px;
}
.progressFill{
  height:100%;
  background: var(--lime);
  box-shadow: 0 0 18px rgba(191,255,0,0.35);
  border-radius: 999px;
}
.questCard{
  margin-top: 12px;
  background: var(--card2);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 14px;
}
.questTop{ display:flex; align-items:center; justify-content:space-between; gap: 10px; }
.questTitle{ font-size: 18px; font-weight: 900; margin-top: 2px; }
.questBtn{
  padding: 10px 14px;
  border-radius: 14px;
  border: 1px solid rgba(191,255,0,0.35);
  background: rgba(191,255,0,0.10);
  color:var(--lime);
  font-weight: 900;
  cursor:pointer;
  white-space: nowrap;
}
.pillCard{
  width:100%;
  display:flex; align-items:center; gap: 12px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid var(--line);
  box-shadow: var(--shadow2);
  cursor:pointer;
  background: var(--card);
  text-align:left;
}
.goldish{ background: radial-gradient(120% 140% at 10% 10%, rgba(191,255,0,0.20) 0%, rgba(10,10,10,0.90) 55%); }
.purplish{ background: radial-gradient(120% 140% at 10% 10%, rgba(138,43,226,0.28) 0%, rgba(10,10,10,0.90) 55%); }
.pillIcon{
  width: 44px; height: 44px; border-radius: 16px;
  display:grid; place-items:center;
  background: rgba(10,10,10,0.25);
  border: 1px solid var(--line);
}
.pillTitle{ font-size: 16px; font-weight: 900; }
.pillSub{ font-size: 12px; color:var(--muted); margin-top: 2px; }
.chartCard{
  background:var(--card);
  border:1px solid var(--line);
  border-radius: 18px;
  padding: 14px;
}
.bars{
  position: relative;
  margin-top: 10px;
  display:flex;
  gap: 10px;
  align-items:flex-end;
  height: 130px;
  padding: 8px 6px 2px;
}
.barCol{ flex:1; display:flex; flex-direction:column; align-items:center; gap: 6px; }
.barTrack{
  width: 100%;
  height: 100px;
  border-radius: 12px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
  overflow:hidden;
  display:flex;
  align-items:flex-end;
  padding: 6px;
}
.barFill{
  width: 100%;
  border-radius: 10px;
  background:var(--lime);
  box-shadow: 0 0 18px rgba(191,255,0,0.25);
}
.barLbl{ font-size: 11px; color:var(--muted); letter-spacing:.08em; }
.goalLine{
  position:absolute;
  left: 8px; right: 8px;
  top: 44%;
  height: 2px;
  background: rgba(138,43,226,0.35);
  border-radius: 999px;
  pointer-events:none;
}
.rowBetween{ display:flex; align-items:center; justify-content:space-between; }
.seeAll{
  border:none;
  background: transparent;
  color:var(--lime);
  font-weight: 900;
  cursor:pointer;
}
.runList{ display:flex; flex-direction:column; gap: 12px; margin-top: 10px; }
.runCard{
  background:var(--card);
  border:1px solid var(--line);
  border-radius: 18px;
  padding: 14px;
  text-align:left;
  cursor:pointer;
}
.runHeader{ display:flex; align-items:flex-start; justify-content:space-between; }
.runDate{ font-size: 18px; font-weight: 900; }
.runTime{ font-size: 12px; color:var(--muted); margin-top: 2px; }
.chev{ font-size: 22px; color:var(--muted); margin-top: 2px; }
.runStats{ margin-top: 12px; display:grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.miniStat{ display:flex; align-items:center; gap: 8px; }
.miniIcon{
  width: 26px; height: 26px; border-radius: 10px;
  display:grid; place-items:center;
  background: rgba(10,10,10,0.25);
  border: 1px solid var(--line);
  font-size: 12px;
}
.miniVal{ font-weight: 900; }
.miniLbl{ font-size: 11px; color:var(--muted); margin-top: 2px; }
.green{ color:var(--lime); }
.purple{ color:var(--purple); }
.red{ color: rgba(255,90,90,0.95); }
.blue{ color: rgba(120,180,255,0.95); }
.modalOverlay{
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.70);
  display:grid;
  place-items:center;
  padding: 18px;
  z-index: 99999;
}
.modalCard{
  width: min(560px, 100%);
  border-radius: 20px;
  background: rgba(10,10,10,0.90);
  border: 1px solid rgba(255,255,255,0.12);
  box-shadow: 0 26px 70px rgba(0,0,0,0.65);
  overflow:hidden;
}
.modalTop{
  display:flex; align-items:center; justify-content:space-between;
  padding: 14px 14px;
  border-bottom: 1px solid var(--line);
}
.modalTitle{ font-weight: 900; letter-spacing: .06em; }
.modalClose{
  border:none;
  background: transparent;
  color:var(--text);
  font-size: 18px;
  cursor:pointer;
}
.modalBody{ padding: 14px; }
.lineWrap{
  border-radius: 16px;
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--line);
  padding: 10px;
}
@media (max-width: 460px){
  .title{ font-size: 36px; }
  .runStats{ grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .heroBig{ font-size: 26px; }
}
`;

function SimpleLineGraph({ points, accent, muted }) {
  const w = 320;
  const h = 140;
  const pad = 16;

  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = Math.max(0.0001, max - min);

  const pts = points.map((p, i) => {
    const x = pad + (i * (w - pad * 2)) / (points.length - 1);
    const y = pad + ((max - p) * (h - pad * 2)) / span;
    return { x, y };
  });

  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <div className="lineWrap">
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <path d={`M ${pad} ${pad} L ${pad} ${h - pad}`} stroke="rgba(255,255,255,0.12)" />
        <path d={`M ${pad} ${h - pad} L ${w - pad} ${h - pad}`} stroke="rgba(255,255,255,0.12)" />
        <path d={d} fill="none" stroke={muted} strokeWidth="7" opacity="0.25" />
        <path d={d} fill="none" stroke={accent} strokeWidth="3.5" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill={accent} opacity="0.9" />
        ))}
      </svg>
    </div>
  );
}