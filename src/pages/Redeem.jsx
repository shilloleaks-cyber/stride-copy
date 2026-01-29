import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function Redeem() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // --- Theme ---
  const THEME = useMemo(
    () => ({
      bg: "#0A0A0A",
      purple: "#8A2BE2",
      neon: "#BFFF00",
      card: "rgba(255,255,255,0.06)",
      card2: "rgba(255,255,255,0.04)",
      text: "rgba(255,255,255,0.92)",
      sub: "rgba(255,255,255,0.62)",
      stroke: "rgba(255,255,255,0.10)",
    }),
    []
  );

  // --- Fetch User Data ---
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const coins = user?.total_coins || 0;

  // --- Demo Catalog (Digital Items) ---
  const items = useMemo(
    () => [
      {
        id: "neon-route",
        title: "Neon Route Color",
        desc: "เปลี่ยนเส้นวิ่งให้เรืองแสงนีออน",
        price: 150,
        tag: "Popular",
        icon: "🟢",
      },
      {
        id: "profile-frame",
        title: "Profile Frame",
        desc: "กรอบโปรไฟล์สไตล์สตรีทมินิมอล",
        price: 200,
        tag: "Style",
        icon: "🖼️",
      },
      {
        id: "victory-sound",
        title: "Victory Sound",
        desc: "เสียงชนะตอนจบ run (เท่ ๆ ไม่เขิน)",
        price: 250,
        tag: "Audio",
        icon: "🔊",
      },
      {
        id: "ghost-skin",
        title: "Ghost Skin",
        desc: "สกิน Ghost Run (คู่แข่งเงามืดของคุณ)",
        price: 300,
        tag: "Pro",
        icon: "👻",
      },
      {
        id: "animated-badge",
        title: "Animated Badge",
        desc: "แบดจ์ขยับได้ โชว์ว่าเราไม่ธรรมดา",
        price: 400,
        tag: "Rare",
        icon: "✨",
      },
      {
        id: "streak-boost",
        title: "Streak Shield",
        desc: "กัน streak ขาด 1 ครั้ง/สัปดาห์",
        price: 500,
        tag: "Meta",
        icon: "🛡️",
      },
    ],
    []
  );

  // --- Redeem Mutation ---
  const redeemMutation = useMutation({
    mutationFn: async ({ item, currentCoins }) => {
      // Update user coins
      const newBalance = currentCoins - item.price;
      await base44.auth.updateMe({
        total_coins: newBalance,
      });

      // Save unlocked item in localStorage
      localStorage.setItem(`unlock:${item.id}`, "1");

      return { item, newBalance };
    },
    onSuccess: ({ item, newBalance }) => {
      queryClient.invalidateQueries(['currentUser']);
      toast.success(`Unlocked! ✅\n${item.title}\nRemaining: ${newBalance} coins`);
    },
    onError: (error) => {
      toast.error('Redeem failed. Please try again.');
    },
  });

  // --- Helpers ---
  const isUnlocked = (id) => localStorage.getItem(`unlock:${id}`) === "1";

  const handleRedeem = (item) => {
    // ถ้าปลดล็อกแล้ว
    if (isUnlocked(item.id)) return;

    // coin ไม่พอ
    if (coins < item.price) return;

    // confirm
    const ok = window.confirm(
      `Redeem "${item.title}"?\nCost: ${item.price} coins`
    );
    if (!ok) return;

    redeemMutation.mutate({ item, currentCoins: coins });
  };

  const goDetail = (id) => {
    navigate(createPageUrl(`RedeemDetail?id=${id}`));
  };

  return (
    <div className="redeemPage">
      <style>{css(THEME)}</style>

      {/* Top Bar */}
      <div className="topBar">
        <button className="backBtn" onClick={() => navigate(createPageUrl('Home'))}>
          ←
        </button>

        <div className="titleWrap">
          <div className="kicker">REDEEM</div>
          <div className="title">Spend Coins</div>
        </div>

        <div className="coinPill" title="Coin Balance">
          <span className="coinDot" />
          <span className="coinNum">{coins}</span>
        </div>
      </div>

      {/* Hint */}
      <div className="hint">
        เลือกของที่อยากปลดล็อก — เอาไว้ "ทำให้วิ่งแล้วเท่ขึ้น" ไม่ใช่แค่วิ่งแล้วเหนื่อย 😄
      </div>

      {/* Grid */}
      <div className="grid">
        {items.map((item) => {
          const unlocked = isUnlocked(item.id);
          const afford = coins >= item.price;

          return (
            <div
              key={item.id}
              className={`card ${unlocked ? "unlocked" : ""}`}
              onClick={() => goDetail(item.id)}
              role="button"
              tabIndex={0}
            >
              <div className="cardTop">
                <div className="icon">{item.icon}</div>
                <div className={`tag ${item.tag.toLowerCase()}`}>{item.tag}</div>
              </div>

              <div className="cardTitle">{item.title}</div>
              <div className="cardDesc">{item.desc}</div>

              <div className="cardBottom">
                <div className="price">
                  <span className="priceNum">{item.price}</span>
                  <span className="priceUnit">coins</span>
                </div>

                <button
                  className={`btn ${unlocked ? "btnDone" : afford ? "btnOn" : "btnOff"}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRedeem(item);
                  }}
                  disabled={unlocked || !afford}
                >
                  {unlocked ? "Unlocked" : afford ? "Redeem" : "Need coins"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom note */}
      <div className="footer">
        Tip: ทำ Daily Quest ให้ครบ เหรียญจะไหลมาเองแบบไม่ต้องง้อดวง ✨
      </div>
    </div>
  );
}

function css(T) {
  return `
  .redeemPage{
    min-height:100vh;
    background:${T.bg};
    color:${T.text};
    padding:18px 14px 90px;
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
  }

  .topBar{
    display:flex; align-items:center; justify-content:space-between;
    gap:10px;
    margin-bottom:12px;
  }

  .backBtn{
    width:42px; height:42px;
    border-radius:14px;
    border:1px solid ${T.stroke};
    background:rgba(255,255,255,0.04);
    color:${T.text};
    font-size:18px;
    cursor: pointer;
  }

  .titleWrap{ flex:1; padding-left:2px; }
  .kicker{
    font-size:12px; letter-spacing:0.18em;
    color:${T.sub};
  }
  .title{
    font-size:18px; font-weight:800;
    margin-top:2px;
  }

  .coinPill{
    display:flex; align-items:center; gap:8px;
    padding:10px 12px;
    border-radius:999px;
    border:1px solid rgba(191,255,0,0.22);
    background:linear-gradient(180deg, rgba(191,255,0,0.10), rgba(138,43,226,0.08));
    box-shadow: 0 0 0 1px rgba(138,43,226,0.10) inset;
  }
  .coinDot{
    width:10px; height:10px; border-radius:50%;
    background:${T.neon};
    box-shadow:0 0 14px rgba(191,255,0,0.55);
  }
  .coinNum{
    font-weight:900;
    color:${T.neon};
    font-size:16px;
  }

  .hint{
    margin:10px 0 14px;
    padding:12px 12px;
    border-radius:16px;
    background:rgba(255,255,255,0.04);
    border:1px solid ${T.stroke};
    color:${T.sub};
    line-height:1.35;
  }

  .grid{
    display:grid;
    grid-template-columns: 1fr 1fr;
    gap:12px;
  }

  .card{
    border-radius:18px;
    border:1px solid ${T.stroke};
    background:linear-gradient(180deg, ${T.card}, ${T.card2});
    padding:12px 12px 12px;
    cursor:pointer;
    transition: transform .12s ease, border-color .12s ease, box-shadow .12s ease;
    box-shadow: 0 10px 30px rgba(0,0,0,0.35);
  }
  .card:active{ transform: scale(0.99); }
  .card:hover{
    border-color: rgba(191,255,0,0.18);
    box-shadow: 0 12px 40px rgba(0,0,0,0.45);
  }
  .card.unlocked{
    border-color: rgba(191,255,0,0.35);
    box-shadow: 0 0 0 1px rgba(191,255,0,0.10) inset, 0 12px 40px rgba(0,0,0,0.45);
  }

  .cardTop{ display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
  .icon{
    width:36px; height:36px; border-radius:14px;
    display:flex; align-items:center; justify-content:center;
    background:rgba(138,43,226,0.18);
    border:1px solid rgba(138,43,226,0.28);
  }
  .tag{
    font-size:11px;
    padding:6px 8px;
    border-radius:999px;
    border:1px solid ${T.stroke};
    color:${T.sub};
    background:rgba(255,255,255,0.03);
  }
  .tag.rare{ border-color: rgba(138,43,226,0.35); color: rgba(138,43,226,0.95); }
  .tag.pro{ border-color: rgba(191,255,0,0.30); color:${T.neon}; }
  .tag.popular{ border-color: rgba(191,255,0,0.22); color:${T.neon}; }
  .tag.style{ border-color: rgba(255,255,255,0.14); }
  .tag.audio{ border-color: rgba(138,43,226,0.22); }
  .tag.meta{ border-color: rgba(191,255,0,0.18); }

  .cardTitle{
    font-weight:900;
    font-size:14px;
    line-height:1.2;
    margin-bottom:6px;
  }
  .cardDesc{
    font-size:12px;
    color:${T.sub};
    line-height:1.25;
    min-height:30px;
    margin-bottom:12px;
  }

  .cardBottom{
    display:flex; align-items:flex-end; justify-content:space-between; gap:10px;
  }
  .price{ display:flex; align-items:baseline; gap:6px; }
  .priceNum{ font-weight:900; font-size:16px; color:${T.text}; }
  .priceUnit{ font-size:11px; color:${T.sub}; }

  .btn{
    border-radius:12px;
    padding:10px 10px;
    font-weight:900;
    font-size:12px;
    border:1px solid ${T.stroke};
    background:rgba(255,255,255,0.03);
    color:${T.text};
    min-width:88px;
    cursor: pointer;
  }
  .btnOn{
    border-color: rgba(191,255,0,0.28);
    color:${T.neon};
    background: linear-gradient(180deg, rgba(191,255,0,0.10), rgba(138,43,226,0.06));
    box-shadow: 0 0 0 1px rgba(191,255,0,0.06) inset;
  }
  .btnOff{
    opacity:0.55;
    cursor: not-allowed;
  }
  .btnDone{
    border-color: rgba(191,255,0,0.35);
    color:${T.neon};
    background: rgba(191,255,0,0.06);
  }

  .footer{
    margin-top:14px;
    color:${T.sub};
    font-size:12px;
    text-align:center;
    padding:10px 0 0;
  }

  @media (max-width: 360px){
    .grid{ grid-template-columns: 1fr; }
  }
`;
}