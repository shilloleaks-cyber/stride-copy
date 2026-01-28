import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Heart, Activity, Moon, TrendingUp, Smartphone, Check, Zap, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function HealthConnect() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualData, setManualData] = useState({
    steps: '',
    resting_heart_rate: '',
    sleep_hours: '',
    weight_kg: ''
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: recentHealthData = [] } = useQuery({
    queryKey: ['healthData', user?.email],
    queryFn: async () => {
      const data = await base44.entities.HealthData.filter({ 
        user_email: user?.email 
      });
      return data.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 7);
    },
    enabled: !!user?.email,
  });

  const connectPlatformMutation = useMutation({
    mutationFn: async (platform) => {
      await base44.auth.updateMe({ 
        health_platform_connected: platform,
        health_sync_enabled: true 
      });
      return base44.functions.invoke('syncHealthData', { platform });
    },
    onSuccess: (response) => {
      toast.success(`✅ ${response.data.message}`);
      queryClient.invalidateQueries(['currentUser']);
      queryClient.invalidateQueries(['healthData']);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      return base44.auth.updateMe({ 
        health_platform_connected: 'none',
        health_sync_enabled: false 
      });
    },
    onSuccess: () => {
      toast.success('Platform disconnected');
      queryClient.invalidateQueries(['currentUser']);
    },
  });

  const syncNowMutation = useMutation({
    mutationFn: async () => {
      return base44.functions.invoke('syncHealthData', { 
        platform: user.health_platform_connected 
      });
    },
    onSuccess: (response) => {
      toast.success(`✅ ${response.data.message}`);
      queryClient.invalidateQueries(['healthData']);
      queryClient.invalidateQueries(['currentUser']);
    },
  });

  const manualEntryMutation = useMutation({
    mutationFn: async (data) => {
      return base44.functions.invoke('syncHealthData', { manualData: data });
    },
    onSuccess: () => {
      toast.success('Health data saved!');
      queryClient.invalidateQueries(['healthData']);
      setShowManualEntry(false);
      setManualData({ steps: '', resting_heart_rate: '', sleep_hours: '', weight_kg: '' });
    },
  });

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const data = {
      steps: manualData.steps ? parseInt(manualData.steps) : undefined,
      resting_heart_rate: manualData.resting_heart_rate ? parseInt(manualData.resting_heart_rate) : undefined,
      sleep_hours: manualData.sleep_hours ? parseFloat(manualData.sleep_hours) : undefined,
      weight_kg: manualData.weight_kg ? parseFloat(manualData.weight_kg) : undefined,
    };
    manualEntryMutation.mutate(data);
  };

  const platforms = [
    {
      id: 'apple_health',
      name: 'Apple Health',
      icon: '🍎',
      description: 'Connect with Apple HealthKit',
      color: 'from-pink-500/20 to-red-500/10 border-pink-500/30'
    },
    {
      id: 'google_fit',
      name: 'Google Fit',
      icon: '💚',
      description: 'Connect with Google Fit',
      color: 'from-blue-500/20 to-green-500/10 border-blue-500/30'
    }
  ];

  const isConnected = user?.health_platform_connected && user?.health_platform_connected !== 'none';
  const connectedPlatform = platforms.find(p => p.id === user?.health_platform_connected);

  return (
    <div className="min-h-screen text-white pb-24" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <button 
          onClick={() => navigate(createPageUrl('Profile'))}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-light mb-2">Health Connect</h1>
          <p className="text-gray-400">
            Import health data for better insights
          </p>
        </motion.div>
      </div>

      {/* Info Banner */}
      <div className="px-6 mb-6">
        <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-300">
              <p className="font-medium text-white mb-1">Enhanced Run Analysis</p>
              <p>Connect your health platform to enrich run data with heart rate, sleep, and recovery metrics.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Status */}
      {isConnected && connectedPlatform && (
        <div className="px-6 mb-6">
          <Card className="bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-2xl">
                  {connectedPlatform.icon}
                </div>
                <div>
                  <p className="font-medium text-white flex items-center gap-2">
                    {connectedPlatform.name}
                    <Check className="w-4 h-4 text-emerald-400" />
                  </p>
                  <p className="text-sm text-gray-400">Connected</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
                className="text-red-400 hover:text-red-300"
              >
                Disconnect
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Last sync: {user.last_health_sync ? new Date(user.last_health_sync).toLocaleString() : 'Never'}
              </div>
              <Button
                onClick={() => syncNowMutation.mutate()}
                disabled={syncNowMutation.isPending}
                size="sm"
                style={{ backgroundColor: '#BFFF00', color: '#0A0A0A' }}
                className="hover:opacity-90"
              >
                <Zap className="w-4 h-4 mr-2" />
                Sync Now
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Connect Platforms */}
      {!isConnected && (
        <div className="px-6 mb-6">
          <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Connect Platform</h2>
          <div className="space-y-3">
            {platforms.map((platform) => (
              <motion.div
                key={platform.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className={`bg-gradient-to-r ${platform.color} p-5 cursor-pointer`}
                  onClick={() => connectPlatformMutation.mutate(platform.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl">
                        {platform.icon}
                      </div>
                      <div>
                        <p className="font-medium text-white">{platform.name}</p>
                        <p className="text-sm text-gray-400">{platform.description}</p>
                      </div>
                    </div>
                    <Smartphone className="w-5 h-5 text-gray-400" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Entry */}
      <div className="px-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs uppercase tracking-widest text-gray-500">Manual Entry</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowManualEntry(!showManualEntry)}
            style={{ color: '#BFFF00' }}
          >
            {showManualEntry ? 'Cancel' : '+ Add Data'}
          </Button>
        </div>

        <AnimatePresence>
          {showManualEntry && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="bg-white/5 border-white/10 p-5">
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div>
                    <Label>Steps</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 10000"
                      value={manualData.steps}
                      onChange={(e) => setManualData({...manualData, steps: e.target.value})}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div>
                    <Label>Resting Heart Rate (BPM)</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 60"
                      value={manualData.resting_heart_rate}
                      onChange={(e) => setManualData({...manualData, resting_heart_rate: e.target.value})}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div>
                    <Label>Sleep Hours</Label>
                    <Input
                      type="number"
                      step="0.5"
                      placeholder="e.g., 7.5"
                      value={manualData.sleep_hours}
                      onChange={(e) => setManualData({...manualData, sleep_hours: e.target.value})}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div>
                    <Label>Weight (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g., 70.5"
                      value={manualData.weight_kg}
                      onChange={(e) => setManualData({...manualData, weight_kg: e.target.value})}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    style={{ backgroundColor: '#BFFF00', color: '#0A0A0A' }}
                    disabled={manualEntryMutation.isPending}
                  >
                    Save Health Data
                  </Button>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Recent Health Data */}
      {recentHealthData.length > 0 && (
        <div className="px-6">
          <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Recent Data</h2>
          <div className="space-y-3">
            {recentHealthData.map((data) => (
              <Card key={data.id} className="bg-white/5 border-white/10 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-white">
                    {new Date(data.date).toLocaleDateString()}
                  </p>
                  <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-400">
                    {data.source}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {data.steps && (
                    <div className="flex items-center gap-2 text-sm">
                      <Activity className="w-4 h-4" style={{ color: '#BFFF00' }} />
                      <span className="text-gray-400">{data.steps.toLocaleString()} steps</span>
                    </div>
                  )}
                  {data.resting_heart_rate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Heart className="w-4 h-4 text-red-400" />
                      <span className="text-gray-400">{data.resting_heart_rate} BPM</span>
                    </div>
                  )}
                  {data.sleep_hours && (
                    <div className="flex items-center gap-2 text-sm">
                      <Moon className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-400">{data.sleep_hours.toFixed(1)}h sleep</span>
                    </div>
                  )}
                  {data.weight_kg && (
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-purple-400" />
                      <span className="text-gray-400">{data.weight_kg.toFixed(1)} kg</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}