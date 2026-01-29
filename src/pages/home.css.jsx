/* home.css */

/* ===== Theme (60/10/30) ===== */
:root{
  --bg: #0A0A0A;          /* 60% */
  --purple: #8A2BE2;      /* 10% */
  --lime: #BFFF00;        /* 30% */

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

/* Page */
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
  border: 1px solid rgba(255,255,255,0.12);
  color: var(--text);
  backdrop-filter: blur(10px);
  z-index: 9999;
  cursor: pointer;
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