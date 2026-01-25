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

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      {/* Header */}
      <div className="px-6 pt-6 flex items-center justify-between">
        <button 
          onClick={() => navigate(createPageUrl('Home'))}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-medium">กระเป๋าเงิน</h1>
        <div className="w-10" />
      </div>

      {/* Token Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-6 mt-6"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 rounded-3xl p-6">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-5 h-5 text-emerald-200" />
              <span className="text-emerald-100 text-sm">ยอดโทเค็นของคุณ</span>
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-light text-white">
                {(user?.token_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </span>
              <span className="text-emerald-200 text-lg">RUN</span>
            </div>

            <div className="mt-6 pt-4 border-t border-white/20 grid grid-cols-2 gap-4">
              <div>
                <p className="text-emerald-200 text-xs mb-1">ระยะทางรวม</p>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-white/70" />
                  <span className="text-lg text-white">{(user?.total_distance_km || 0).toFixed(1)} กม.</span>
                </div>
              </div>
              <div>
                <p className="text-emerald-200 text-xs mb-1">จำนวนครั้งที่วิ่ง</p>
                <div className="flex items-center gap-1">
                  <Award className="w-4 h-4 text-white/70" />
                  <span className="text-lg text-white">{user?.total_runs || 0} ครั้ง</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tokenomics Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mx-6 mt-6"
      >
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <span className="font-medium">RUN Tokenomics</span>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total Supply</span>
              <span className="text-white">{totalSupply.toLocaleString()} RUN</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">แจกไปแล้ว</span>
              <span className="text-emerald-400">{distributed.toLocaleString()} RUN</span>
            </div>
            <Progress value={distributedPercent} className="h-2 bg-white/10" />
            <p className="text-xs text-gray-500 text-center">
              {distributedPercent.toFixed(4)}% of total supply distributed
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-gray-400">อัตราการได้รับ:</span>
              <span className="text-white font-medium">0.1 กม. = 0.1 RUN</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Transaction History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mx-6 mt-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-gray-400" />
            <span className="font-medium">ประวัติธุรกรรม</span>
          </div>
        </div>

        {walletLogs.length > 0 ? (
          <div className="space-y-3">
            {walletLogs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    log.type === 'run' ? 'bg-emerald-500/20' :
                    log.type === 'bonus' ? 'bg-yellow-500/20' :
                    log.type === 'spend' ? 'bg-red-500/20' : 'bg-blue-500/20'
                  }`}>
                    {log.type === 'run' ? <MapPin className="w-5 h-5 text-emerald-400" /> :
                     log.type === 'bonus' ? <Sparkles className="w-5 h-5 text-yellow-400" /> :
                     <Coins className="w-5 h-5 text-gray-400" />}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{log.note || getTypeLabel(log.type)}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(log.created_date), 'd MMM yyyy, HH:mm', { locale: th })}
                    </p>
                  </div>
                </div>
                <div className={`text-right ${log.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  <span className="font-medium">
                    {log.amount >= 0 ? '+' : ''}{log.amount.toFixed(1)}
                  </span>
                  <span className="text-xs ml-1">RUN</span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
            <History className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">ยังไม่มีประวัติธุรกรรม</p>
            <p className="text-sm text-gray-600 mt-1">เริ่มวิ่งเพื่อรับโทเค็น RUN</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}