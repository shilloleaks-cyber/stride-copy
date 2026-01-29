import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Sparkles, TrendingUp, Users, Bell, Brain, 
  Target, CheckCircle, Clock, Trophy, MessageCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

export default function CommunityCoach() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insights, setInsights] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: nudges = [] } = useQuery({
    queryKey: ['coachNudges', user?.email],
    queryFn: () => base44.entities.CoachNudge.filter({ user_email: user?.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const { data: coachingMatches = [] } = useQuery({
    queryKey: ['coachingMatches', user?.email],
    queryFn: async () => {
      const asCoach = await base44.entities.CoachingMatch.filter({ coach_email: user?.email });
      const asUser = await base44.entities.CoachingMatch.filter({ user_email: user?.email });
      return [...asCoach, ...asUser];
    },
    enabled: !!user?.email,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsersForMatching'],
    queryFn: () => base44.entities.User.list(),
  });

  const generateInsights = async (type) => {
    setLoadingInsights(true);
    try {
      const response = await base44.functions.invoke('generateCoachInsights', {
        userEmail: user.email,
        insightType: type,
      });
      setInsights({ type, data: response.data });
      toast.success('Insights generated!');
    } catch (error) {
      toast.error('Failed to generate insights');
    } finally {
      setLoadingInsights(false);
    }
  };

  const markNudgeRead = useMutation({
    mutationFn: (nudgeId) => base44.entities.CoachNudge.update(nudgeId, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['coachNudges']);
    },
  });

  const unreadNudges = nudges.filter(n => !n.is_read);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getNudgeIcon = (type) => {
    switch (type) {
      case 'motivation': return <Sparkles className="w-5 h-5 text-yellow-400" />;
      case 'goal_reminder': return <Target className="w-5 h-5 text-blue-400" />;
      case 'event_reminder': return <Clock className="w-5 h-5 text-purple-400" />;
      case 'challenge_update': return <Trophy className="w-5 h-5 text-emerald-400" />;
      case 'peer_activity': return <Users className="w-5 h-5 text-orange-400" />;
      default: return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen text-white pb-24" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Header */}
      <div className="sticky top-0 z-50 px-6 pt-6 pb-4 backdrop-blur-lg border-b" style={{ backgroundColor: 'rgba(10, 10, 10, 0.95)', borderColor: 'rgba(191, 255, 0, 0.3)' }}>
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate(createPageUrl('Home'))}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-yellow-400" />
            <h1 className="text-lg font-medium">Community Coach</h1>
          </div>
          <div className="relative">
            <Bell className="w-6 h-6 text-gray-400" />
            {unreadNudges.length > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px]">
                {unreadNudges.length}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="px-6 pt-6 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-2xl p-5"
        >
          <div className="flex items-start gap-3">
            <Brain className="w-8 h-8 text-yellow-400 mt-1" />
            <div>
              <h2 className="text-lg font-medium text-white mb-1">Your AI Running Coach</h2>
              <p className="text-sm text-gray-300">
                Get personalized insights, connect with peers, and stay motivated with AI-powered coaching.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="insights" className="px-6">
        <TabsList className="w-full bg-white/5 grid grid-cols-3">
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="peers">Peer Coaching</TabsTrigger>
          <TabsTrigger value="nudges">Nudges ({unreadNudges.length})</TabsTrigger>
        </TabsList>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 gap-3">
            <Button
              onClick={() => generateInsights('performance')}
              disabled={loadingInsights}
              className="h-auto p-4 bg-gradient-to-r from-emerald-500/20 to-transparent border border-emerald-500/30 hover:bg-emerald-500/30 text-left flex items-start gap-3"
              variant="ghost"
            >
              <TrendingUp className="w-6 h-6 text-emerald-400 mt-1" />
              <div className="flex-1">
                <p className="font-medium text-white">Performance Analysis</p>
                <p className="text-xs text-gray-400 mt-1">Get AI-powered tips based on your running data</p>
              </div>
            </Button>

            <Button
              onClick={() => generateInsights('group_trends')}
              disabled={loadingInsights}
              className="h-auto p-4 bg-gradient-to-r from-purple-500/20 to-transparent border border-purple-500/30 hover:bg-purple-500/30 text-left flex items-start gap-3"
              variant="ghost"
            >
              <Users className="w-6 h-6 text-purple-400 mt-1" />
              <div className="flex-1">
                <p className="font-medium text-white">Group Activity Trends</p>
                <p className="text-xs text-gray-400 mt-1">See how you compare with your groups</p>
              </div>
            </Button>

            <Button
              onClick={() => generateInsights('peer_match')}
              disabled={loadingInsights}
              className="h-auto p-4 bg-gradient-to-r from-blue-500/20 to-transparent border border-blue-500/30 hover:bg-blue-500/30 text-left flex items-start gap-3"
              variant="ghost"
            >
              <MessageCircle className="w-6 h-6 text-blue-400 mt-1" />
              <div className="flex-1">
                <p className="font-medium text-white">Find a Peer Coach</p>
                <p className="text-xs text-gray-400 mt-1">AI suggests the best coaching match for you</p>
              </div>
            </Button>
          </div>

          {/* Insights Display */}
          {insights && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 mt-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                <h3 className="font-medium text-white">AI Coach Insights</h3>
              </div>

              {insights.type === 'performance' && insights.data.insights && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Performance Summary</p>
                    <p className="text-white">{insights.data.insights.summary}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Tips to Improve</p>
                    <ul className="space-y-2">
                      {insights.data.insights.tips?.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                          <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-3 border-t border-white/10">
                    <p className="text-yellow-400 italic">{insights.data.insights.motivation}</p>
                  </div>
                </div>
              )}

              {insights.type === 'group_trends' && insights.data.insights && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Engagement Insight</p>
                    <p className="text-white">{insights.data.insights.engagement_insight}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">How You Compare</p>
                    <p className="text-white">{insights.data.insights.comparison}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Suggestions</p>
                    <ul className="space-y-2">
                      {insights.data.insights.suggestions?.map((suggestion, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                          <Target className="w-4 h-4 text-purple-400 mt-0.5" />
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {insights.type === 'peer_match' && insights.data.insights && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Ideal Coach Profile</p>
                    <p className="text-white">{insights.data.insights.ideal_experience}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Shared Goals</p>
                    <div className="flex flex-wrap gap-2">
                      {insights.data.insights.shared_goals?.map((goal, idx) => (
                        <span key={idx} className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                          {goal}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-3 border-t border-white/10">
                    <p className="text-sm text-gray-300">{insights.data.insights.match_reason}</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </TabsContent>

        {/* Peer Coaching Tab */}
        <TabsContent value="peers" className="space-y-4 mt-4">
          <p className="text-sm text-gray-400">Connect with runners who share your goals and experience level.</p>
          
          {coachingMatches.length > 0 ? (
            <div className="space-y-3">
              {coachingMatches.map(match => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3"
                >
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                      {getInitials(match.coach_email === user?.email ? match.user_name : match.coach_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-white">
                      {match.coach_email === user?.email ? match.user_name : match.coach_name}
                    </p>
                    <p className="text-xs text-gray-500">{match.match_reason}</p>
                    <div className="flex gap-2 mt-1">
                      {match.goals?.slice(0, 2).map((goal, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px]">
                          {goal}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    match.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {match.status}
                  </span>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No peer coaches yet</p>
              <p className="text-xs text-gray-600 mt-1">Use AI Insights to find your perfect match!</p>
            </div>
          )}
        </TabsContent>

        {/* Nudges Tab */}
        <TabsContent value="nudges" className="space-y-3 mt-4">
          {nudges.length > 0 ? (
            <AnimatePresence>
              {nudges.map(nudge => (
                <motion.div
                  key={nudge.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`p-4 rounded-2xl border ${
                    nudge.is_read 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-gradient-to-r from-yellow-500/20 to-transparent border-yellow-500/30'
                  }`}
                  onClick={() => !nudge.is_read && markNudgeRead.mutate(nudge.id)}
                >
                  <div className="flex items-start gap-3">
                    {getNudgeIcon(nudge.nudge_type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-white">{nudge.title}</p>
                        {!nudge.is_read && (
                          <span className="w-2 h-2 bg-yellow-400 rounded-full" />
                        )}
                      </div>
                      <p className="text-sm text-gray-300">{nudge.message}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(nudge.created_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
              <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No nudges yet</p>
              <p className="text-xs text-gray-600 mt-1">Your AI coach will send personalized reminders soon!</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}