import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import './home.css';

export default function Home() {
  const navigate = useNavigate();

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
  const coinBalance = user?.total_coins || 0;
  const level = user?.current_level || 1;
  const levelProgress = {
    current: coinBalance % 100,
    need: 100,
  };

  // ===== UI states =====
  const [showPaceHistory, setShowPaceHistory] = useState(false);
  const [coinPop, setCoinPop] = useState(false);

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

      {/* Sticky Coin HUD */}
      <button
        className="coinHud"
        onClick={handleCoinClick}
        aria-label="Coin balance"
      >
        <span className="coinIcon">🪙</span>
        <span className="coinText">{coinBalance}</span>
        {coinPop && <span className="coinPop">+1</span>}
      </button>

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
          <div className="levelCard">
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
          </div>

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