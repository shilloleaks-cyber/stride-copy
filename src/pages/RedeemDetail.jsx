import React, { useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { isUnlocked, isEquipped, equipItem, unequipItem } from '@/utils/itemUtils';

export default function RedeemDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Get item ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const itemId = urlParams.get('id');

  // --- Theme ---
  const THEME = useMemo(
    () => ({
      bg: "#0A0A0A",
      purple: "#8A2BE2",
      neon: "#BFFF00",
      card: "rgba(255,255,255,0.06)",
      text: "rgba(255,255,255,0.92)",
      sub: "rgba(255,255,255,0.62)",
      stroke: "rgba(255,255,255,0.10)",
    }),
    []
  );

  // --- Item Data ---
  const items = {
    "neon-route": {
      id: "neon-route",
      title: "Neon Route Color",
      desc: "เปลี่ยนเส้นวิ่งให้เรืองแสงนีออน",
      longDesc: "เพิ่มความเท่ให้กับเส้นทางวิ่งของคุณด้วยสีนีออนสะกดตา ทำให้ทุกก้าวของคุณดูโดดเด่นและมีสไตล์",
      price: 150,
      tag: "Popular",
      icon: "🟢",
      preview: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80",
    },
    "profile-frame": {
      id: "profile-frame",
      title: "Profile Frame",
      desc: "กรอบโปรไฟล์สไตล์สตรีทมินิมอล",
      longDesc: "กรอบโปรไฟล์พรีเมียมที่จะทำให้คุณโดดเด่นในชุมชน ดีไซน์มินิมัลแต่ทรงพลัง",
      price: 200,
      tag: "Style",
      icon: "🖼️",
      preview: "https://images.unsplash.com/photo-1552581234-26160f608093?w=800&q=80",
    },
    "victory-sound": {
      id: "victory-sound",
      title: "Victory Sound",
      desc: "เสียงชนะตอนจบ run (เท่ ๆ ไม่เขิน)",
      longDesc: "เสียงชัยชนะสุดมันส์ที่จะดังขึ้นทุกครั้งที่คุณจบการวิ่ง เพิ่มความสนุกและแรงจูงใจ",
      price: 250,
      tag: "Audio",
      icon: "🔊",
      preview: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80",
    },
    "ghost-skin": {
      id: "ghost-skin",
      title: "Ghost Skin",
      desc: "สกิน Ghost Run (คู่แข่งเงามืดของคุณ)",
      longDesc: "แข่งกับเงาของตัวเองในรูปแบบพิเศษ เหมาะสำหรับนักวิ่งที่ต้องการท้าทายตัวเอง",
      price: 300,
      tag: "Pro",
      icon: "👻",
      preview: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&q=80",
    },
    "animated-badge": {
      id: "animated-badge",
      title: "Animated Badge",
      desc: "แบดจ์ขยับได้ โชว์ว่าเราไม่ธรรมดา",
      longDesc: "แบดจ์พิเศษที่มีอนิเมชั่นสวยงาม แสดงความเป็นนักวิ่งระดับพรีเมียม",
      price: 400,
      tag: "Rare",
      icon: "✨",
      preview: "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80",
    },
    "streak-boost": {
      id: "streak-boost",
      title: "Streak Shield",
      desc: "กัน streak ขาด 1 ครั้ง/สัปดาห์",
      longDesc: "ไอเทมสุดพาวเวอร์ที่จะปกป้องสตรีคของคุณไม่ให้ขาด แม้จะพลาดวิ่งไป 1 วัน",
      price: 500,
      tag: "Meta",
      icon: "🛡️",
      preview: "https://images.unsplash.com/photo-1556139943-4bdca53adf1e?w=800&q=80",
    },
  };

  const item = items[itemId] || items["neon-route"];

  // --- Fetch User Data ---
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const coins = user?.total_coins || 0;
  const itemUnlocked = isUnlocked(item.id);
  const itemEquipped = isEquipped(item.id);
  const canAfford = coins >= item.price;
  
  const getItemType = (itemId) => {
    const typeMap = {
      'neon-route': 'route',
      'profile-frame': 'frame',
      'victory-sound': 'sound',
      'ghost-skin': 'ghost',
      'animated-badge': 'badge',
      'streak-boost': 'shield',
    };
    return typeMap[itemId] || 'misc';
  };

  // --- Redeem Mutation ---
  const redeemMutation = useMutation({
    mutationFn: async ({ item, currentCoins }) => {
      const newBalance = currentCoins - item.price;
      await base44.auth.updateMe({
        total_coins: newBalance,
      });

      localStorage.setItem(`unlock:${item.id}`, "1");

      return { item, newBalance };
    },
    onSuccess: ({ item, newBalance }) => {
      queryClient.invalidateQueries(['currentUser']);
      toast.success(`Unlocked! ✅\n${item.title}\nRemaining: ${newBalance} coins`);
    },
    onError: () => {
      toast.error('Redeem failed. Please try again.');
    },
  });

  const handleRedeem = () => {
    if (itemUnlocked || !canAfford) return;

    const ok = window.confirm(
      `Redeem "${item.title}"?\nCost: ${item.price} coins`
    );
    if (!ok) return;

    redeemMutation.mutate({ item, currentCoins: coins });
  };
  
  const handleToggleEquip = () => {
    const itemType = getItemType(item.id);
    
    if (itemEquipped) {
      unequipItem(item.id, itemType);
      toast.success(`ยกเลิกการใช้งาน ${item.title}`);
    } else {
      equipItem(item.id, itemType);
      toast.success(`ใช้งาน ${item.title} แล้ว!`);
    }
    
    queryClient.invalidateQueries(['currentUser']);
  };

  return (
    <div className="detailPage">
      <style>{css(THEME)}</style>

      {/* Header */}
      <div className="header">
        <button className="backBtn" onClick={() => navigate(createPageUrl('Redeem'))}>
          ←
        </button>
        <div className="coinPill">
          <span className="coinDot" />
          <span className="coinNum">{coins}</span>
        </div>
      </div>

      {/* Preview Image */}
      <div className="preview">
        <img src={item.preview} alt={item.title} />
        <div className="previewIcon">{item.icon}</div>
      </div>

      {/* Content */}
      <div className="content">
        <div className="topRow">
          <div className={`tag ${item.tag.toLowerCase()}`}>{item.tag}</div>
          {itemEquipped ? (
            <div className="equipped">✓ Equipped</div>
          ) : itemUnlocked ? (
            <div className="unlocked">✓ Unlocked</div>
          ) : null}
        </div>

        <h1 className="itemTitle">{item.title}</h1>
        <p className="itemDesc">{item.longDesc}</p>

        {/* Features */}
        <div className="features">
          <div className="feature">
            <span className="featureIcon">⚡</span>
            <span>Instant Activation</span>
          </div>
          <div className="feature">
            <span className="featureIcon">♾️</span>
            <span>Lifetime Access</span>
          </div>
          <div className="feature">
            <span className="featureIcon">🎨</span>
            <span>Exclusive Design</span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="bottomBar">
          <div className="priceBox">
            <div className="priceLabel">Price</div>
            <div className="price">
              <span className="priceNum">{item.price}</span>
              <span className="priceUnit">coins</span>
            </div>
          </div>

          {itemUnlocked ? (
            <button
              className={`redeemBtn ${itemEquipped ? "btnEquipped" : "btnEquip"}`}
              onClick={handleToggleEquip}
            >
              {itemEquipped ? "✓ Equipped" : "Equip Now"}
            </button>
          ) : (
            <button
              className={`redeemBtn ${canAfford ? "btnOn" : "btnOff"}`}
              onClick={handleRedeem}
              disabled={!canAfford}
            >
              {canAfford ? "Redeem Now" : "Not Enough Coins"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function css(T) {
  return `
  .detailPage{
    min-height:100vh;
    background:${T.bg};
    color:${T.text};
    padding-bottom:120px;
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
  }

  .header{
    display:flex; align-items:center; justify-content:space-between;
    padding:18px 14px;
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

  .preview{
    position: relative;
    width: 100%;
    height: 280px;
    overflow: hidden;
  }
  .preview img{
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .previewIcon{
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 80px;
    filter: drop-shadow(0 8px 32px rgba(0,0,0,0.8));
  }

  .content{
    padding: 24px 18px;
  }

  .topRow{
    display:flex; align-items:center; justify-content:space-between;
    margin-bottom:14px;
  }

  .tag{
    font-size:12px;
    padding:8px 12px;
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

  .unlocked{
    font-size:12px;
    padding:8px 12px;
    border-radius:999px;
    border:1px solid rgba(191,255,0,0.35);
    color:${T.neon};
    background: rgba(191,255,0,0.06);
  }
  
  .equipped{
    font-size:12px;
    padding:8px 12px;
    border-radius:999px;
    border:1px solid rgba(191,255,0,0.45);
    color: #0A0A0A;
    background: ${T.neon};
    font-weight: 900;
  }

  .itemTitle{
    font-size:32px;
    font-weight:900;
    margin-bottom:12px;
    line-height:1.1;
  }

  .itemDesc{
    font-size:15px;
    color:${T.sub};
    line-height:1.5;
    margin-bottom:24px;
  }

  .features{
    display:flex;
    flex-direction:column;
    gap:12px;
    margin-bottom:32px;
    padding:18px;
    border-radius:16px;
    background:rgba(255,255,255,0.04);
    border:1px solid ${T.stroke};
  }

  .feature{
    display:flex;
    align-items:center;
    gap:12px;
    font-size:14px;
  }

  .featureIcon{
    width:32px; height:32px;
    border-radius:10px;
    background:rgba(138,43,226,0.15);
    border:1px solid rgba(138,43,226,0.25);
    display:flex;
    align-items:center;
    justify-content:center;
  }

  .bottomBar{
    position:fixed;
    bottom:0;
    left:0;
    right:0;
    padding:18px;
    background:rgba(10,10,10,0.95);
    border-top:1px solid ${T.stroke};
    backdrop-filter:blur(20px);
    display:flex;
    align-items:center;
    gap:14px;
  }

  .priceBox{
    flex-shrink:0;
  }

  .priceLabel{
    font-size:11px;
    color:${T.sub};
    margin-bottom:4px;
  }

  .price{
    display:flex;
    align-items:baseline;
    gap:6px;
  }

  .priceNum{
    font-weight:900;
    font-size:24px;
    color:${T.text};
  }

  .priceUnit{
    font-size:12px;
    color:${T.sub};
  }

  .redeemBtn{
    flex:1;
    height:54px;
    border-radius:14px;
    font-weight:900;
    font-size:16px;
    border:1px solid ${T.stroke};
    background:rgba(255,255,255,0.03);
    color:${T.text};
    cursor: pointer;
  }

  .btnOn{
    border-color: rgba(191,255,0,0.35);
    color:#0A0A0A;
    background: linear-gradient(135deg, rgba(138,43,226,0.95), rgba(191,255,0,0.95));
    box-shadow: 0 8px 24px rgba(138,43,226,0.4);
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
  
  .btnEquip{
    border-color: rgba(191,255,0,0.35);
    color: #0A0A0A;
    background: linear-gradient(135deg, rgba(138,43,226,0.95), rgba(191,255,0,0.95));
    box-shadow: 0 8px 24px rgba(138,43,226,0.4);
  }
  
  .btnEquipped{
    border-color: rgba(191,255,0,0.55);
    color: #0A0A0A;
    background: ${T.neon};
    font-weight: 900;
    box-shadow: 0 0 24px rgba(191,255,0,0.4);
  }
`;
}