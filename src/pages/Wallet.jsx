import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { 
  ArrowLeft, Wallet as WalletIcon, TrendingUp, History,
  Coins, MapPin, Award, ChevronRight, Sparkles
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function Wallet() {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: walletLogs = [] } = useQuery({
    queryKey: ['walletLogs', user?.email],
    queryFn: () => base44.entities.WalletLog.filter({ user: user?.email }, '-created_date', 50),
    enabled: !!user?.email,
  });

  const { data: tokenConfig } = useQuery({
    queryKey: ['tokenConfig'],
    queryFn: async () => {
      const configs = await base44.entities.TokenConfig.list();
      return configs[0] || { total_supply: 29000000, distributed: 0, remaining: 29000000 };
    },
  });

  const totalSupply = 29000000;
  const distributed = tokenConfig?.distributed || 0;
  const distributedPercent = (distributed / totalSupply) * 100;

  const getTypeLabel = (type) => {
    switch (type) {
      case 'run': return 'วิ่ง';
      case 'bonus': return 'โบนัส';
      case 'spend': return 'ใช้จ่าย';
      case 'transfer': return 'โอน';
      default: return type;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'run': return 'text-emerald-400';
      case 'bonus': return 'text-yellow-400';
      case 'spend': return 'text-red-400';
      case 'transfer': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const lastRunLog = walletLogs.find(log => log.type === 'run');
  const lastRunAmount = lastRunLog ? lastRunLog.amount : 0;

  return (
    <div className="walletRoot">
      <style>{walletStyles}</style>

      {/* Header */}
      <div className="walletHeader">
        <button onClick={() => navigate(createPageUrl('Home'))} className="backBtn">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="headerTitle">Wallet</h1>
        <div className="w-10" />
      </div>

      {/* Balance Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="balanceHero"
      >
        <div className="balanceLabel">RUN BALANCE</div>
        <div className="balanceValue">
          {(user?.coin_balance || 0).toFixed(2)}
        </div>
        {lastRunAmount > 0 && (
          <div className="balanceSubtitle">+{lastRunAmount.toFixed(2)} from last run</div>
        )}
      </motion.div>



      {/* RUN Economy Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="economyCard"
      >
        <div className="economyHeader">
          <Sparkles className="w-4 h-4" />
          <span>RUN ECONOMY</span>
        </div>
        
        <div className="economyStats">
          <div className="economyStat">
            <div className="economyLabel">Total Supply</div>
            <div className="economyValue">{totalSupply.toLocaleString()} RUN</div>
          </div>
          <div className="economyStat">
            <div className="economyLabel">Earn Rate</div>
            <div className="economyValue">0.1 km = 0.1 RUN</div>
          </div>
        </div>

        <div className="economyProgress">
          <div className="economyProgressBar">
            <div className="economyProgressFill" style={{ width: `${distributedPercent}%` }} />
          </div>
          <div className="economyProgressText">{distributedPercent.toFixed(2)}% distributed</div>
        </div>
      </motion.div>

      {/* Activity Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="activitySection"
      >
        <div className="activityHeader">
          <History className="w-4 h-4" />
          <span>ACTIVITY FEED</span>
        </div>

        {walletLogs.length > 0 ? (
          <div className="activityFeed">
            {walletLogs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="activityItem"
              >
                <div className="activityIconWrap">
                  {log.type === 'run' ? (
                    <MapPin className="w-4 h-4 activityIcon" />
                  ) : log.type === 'bonus' ? (
                    <Sparkles className="w-4 h-4 activityIcon" />
                  ) : (
                    <Coins className="w-4 h-4 activityIcon" />
                  )}
                </div>
                <div className="activityContent">
                  <div className="activityTitle">{log.note || getTypeLabel(log.type)}</div>
                  <div className="activityTime">
                    {format(new Date(log.created_date), 'd MMM yyyy, HH:mm', { locale: th })}
                  </div>
                </div>
                <div className="activityAmount">
                  {log.amount >= 0 ? '+' : ''}{log.amount.toFixed(1)} RUN
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="activityEmpty">
            <History className="w-10 h-10 activityEmptyIcon" />
            <p className="activityEmptyText">No activity yet</p>
            <p className="activityEmptySub">Start running to earn RUN tokens</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

const walletStyles = `
  .walletRoot {
    min-height: 100vh;
    background: radial-gradient(1200px 800px at 50% 0%, rgba(123,77,255,0.12), transparent 65%),
                #050508;
    color: rgba(255,255,255,0.95);
    padding: 0 0 100px;
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
  }

  .walletHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 20px;
  }

  .backBtn {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }

  .backBtn:hover {
    background: rgba(182,255,0,0.1);
    border-color: rgba(182,255,0,0.25);
    color: #B6FF00;
  }

  .headerTitle {
    font-size: 16px;
    font-weight: 600;
    color: rgba(255,255,255,0.95);
  }

  /* Balance Hero Card */
  .balanceHero {
    margin: 0 20px 24px;
    padding: 32px 24px;
    background: rgba(20,20,20,0.5);
    border: 1px solid rgba(182,255,0,0.2);
    border-radius: 24px;
    box-shadow: 0 0 20px rgba(182,255,0,0.15);
    text-align: center;
  }

  .balanceLabel {
    font-size: 11px;
    color: rgba(255,255,255,0.5);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 700;
    margin-bottom: 12px;
  }

  .balanceValue {
    font-size: 56px;
    font-weight: 900;
    color: #B6FF00;
    text-shadow: 0 0 28px rgba(182,255,0,0.5);
    margin-bottom: 8px;
  }

  .balanceSubtitle {
    font-size: 13px;
    color: rgba(255,255,255,0.6);
    padding: 8px 16px;
    background: rgba(182,255,0,0.08);
    border-radius: 999px;
    display: inline-block;
  }



  /* Economy Card */
  .economyCard {
    margin: 0 20px 24px;
    padding: 20px;
    background: rgba(20,20,20,0.5);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
  }

  .economyHeader {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    color: rgba(255,255,255,0.5);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 700;
  }

  .economyStats {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
  }

  .economyStat {
    flex: 1;
  }

  .economyLabel {
    font-size: 10px;
    color: rgba(255,255,255,0.45);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 6px;
  }

  .economyValue {
    font-size: 16px;
    font-weight: 900;
    color: #B6FF00;
  }

  .economyProgress {
    margin-top: 12px;
  }

  .economyProgressBar {
    height: 6px;
    border-radius: 999px;
    background: rgba(60,60,60,0.6);
    overflow: hidden;
    margin-bottom: 6px;
  }

  .economyProgressFill {
    height: 100%;
    background: #B6FF00;
    border-radius: 999px;
    box-shadow: 0 0 12px rgba(182,255,0,0.6);
    transition: width 0.4s ease;
  }

  .economyProgressText {
    font-size: 11px;
    color: rgba(255,255,255,0.5);
    text-align: center;
  }

  /* Activity Feed */
  .activitySection {
    padding: 0 20px;
  }

  .activityHeader {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;
    color: rgba(255,255,255,0.5);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 700;
  }

  .activityFeed {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .activityItem {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    background: rgba(20,20,20,0.5);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    transition: all 0.2s;
  }

  .activityItem:hover {
    border-color: rgba(182,255,0,0.2);
  }

  .activityIconWrap {
    width: 36px;
    height: 36px;
    border-radius: 12px;
    background: rgba(182,255,0,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .activityIcon {
    color: #B6FF00;
  }

  .activityContent {
    flex: 1;
  }

  .activityTitle {
    font-size: 14px;
    font-weight: 600;
    color: rgba(255,255,255,0.95);
    margin-bottom: 2px;
  }

  .activityTime {
    font-size: 11px;
    color: rgba(255,255,255,0.45);
  }

  .activityAmount {
    font-size: 16px;
    font-weight: 900;
    color: #B6FF00;
  }

  .activityEmpty {
    text-align: center;
    padding: 48px 24px;
    background: rgba(20,20,20,0.5);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
  }

  .activityEmptyIcon {
    color: rgba(255,255,255,0.15);
    margin: 0 auto 16px;
  }

  .activityEmptyText {
    font-size: 14px;
    color: rgba(255,255,255,0.6);
    margin-bottom: 4px;
  }

  .activityEmptySub {
    font-size: 12px;
    color: rgba(255,255,255,0.4);
  }

  @media (max-width: 420px) {
    .balanceValue { font-size: 48px; }
    .quickActions { gap: 8px; }
    .actionButton { padding: 14px 10px; font-size: 11px; }
  }
`;