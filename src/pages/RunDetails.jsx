import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  ArrowLeft, Share2, Trash2, MapPin, Clock, Zap, Heart, 
  Flame, TrendingUp, Award, Edit2, X, Save 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import RunMap from '@/components/running/RunMap';

export default function RunDetails() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const runId = urlParams.get('id');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');

  const { data: run, isLoading } = useQuery({
    queryKey: ['run', runId],
    queryFn: async () => {
      const runs = await base44.entities.Run.filter({ id: runId });
      return runs[0];
    },
    enabled: !!runId,
    onSuccess: (data) => {
      if (data?.notes) setNotes(data.notes);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Run.update(runId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['run', runId]);
      setEditingNotes(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Run.delete(runId),
    onSuccess: () => {
      navigate(createPageUrl('History'));
    }
  });

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPace = (pace) => {
    if (!pace || pace === 0) return '--:--';
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!run) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white p-6">
        <p className="text-gray-400 mb-4">Run not found</p>
        <Button onClick={() => navigate(createPageUrl('Home'))} variant="outline">
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      {/* Header */}
      <div className="px-6 pt-6 flex items-center justify-between">
        <button 
          onClick={() => navigate(createPageUrl('History'))}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <Share2 className="w-5 h-5" />
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-gray-900 border-gray-800">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Delete this run?</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-400">
                  This action cannot be undone. This will permanently delete your run data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => deleteMutation.mutate()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Date & Time */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pt-8 pb-6"
      >
        <p className="text-emerald-400 text-sm uppercase tracking-widest mb-1">Completed Run</p>
        <h1 className="text-3xl font-light">
          {run.start_time && format(new Date(run.start_time), 'EEEE, MMMM d')}
        </h1>
        <p className="text-gray-500 mt-1">
          {run.start_time && format(new Date(run.start_time), 'h:mm a')}
        </p>
      </motion.div>

      {/* Route Map */}
      {run.route_points && run.route_points.length >= 2 ? (
        <div className="px-6 mb-6">
          <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Route</h2>
          <div className="h-64 rounded-2xl overflow-hidden border border-white/10">
            <RunMap 
              routeCoordinates={run.route_points}
              currentPosition={null}
              isActive={false}
              showFullRoute={true}
              enableZoom={true}
            />
          </div>
          {/* Debug Info */}
          <div className="mt-3 bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 text-xs space-y-1">
            <p className="text-purple-400">Route points count: <span className="text-white font-mono">{run.route_points.length}</span></p>
            <p className="text-purple-400">First point: <span className="text-white font-mono">{JSON.stringify(run.route_points[0])}</span></p>
            <p className="text-purple-400">Last point: <span className="text-white font-mono">{JSON.stringify(run.route_points[run.route_points.length - 1])}</span></p>
          </div>
        </div>
      ) : (
        <div className="px-6 mb-6">
          <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Route</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Route not available for this run</p>
            <p className="text-sm text-gray-600 mt-1">GPS tracking was not enabled during this run</p>
          </div>
        </div>
      )}

      {/* Main Stats */}
      <div className="px-6 mb-6">
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-3xl p-6">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Distance</p>
              <p className="text-4xl font-light text-white">{run.distance_km?.toFixed(2) || '0.00'}</p>
              <p className="text-sm text-gray-500">km</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Duration</p>
              <p className="text-4xl font-light text-white">{formatDuration(run.duration_seconds)}</p>
              <p className="text-sm text-gray-500">time</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Pace</p>
              <p className="text-4xl font-light text-white">{formatPace(run.pace_min_per_km)}</p>
              <p className="text-sm text-gray-500">/km</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="px-6 mb-6">
        <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-blue-500/20">
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-xs uppercase tracking-widest text-gray-400">Speed</p>
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-xs text-gray-500">Avg</p>
                <p className="text-2xl font-light text-white">{run.avg_speed_kmh?.toFixed(1) || '0.0'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Max</p>
                <p className="text-2xl font-light text-emerald-400">{run.max_speed_kmh?.toFixed(1) || '0.0'}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">km/h</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-red-500/20">
                <Heart className="w-5 h-5 text-red-400" />
              </div>
              <p className="text-xs uppercase tracking-widest text-gray-400">Heart Rate</p>
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-xs text-gray-500">Avg</p>
                <p className="text-2xl font-light text-white">{run.avg_heart_rate || '--'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Max</p>
                <p className="text-2xl font-light text-red-400">{run.max_heart_rate || '--'}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">bpm</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 col-span-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-orange-500/20">
                <Flame className="w-5 h-5 text-orange-400" />
              </div>
              <p className="text-xs uppercase tracking-widest text-gray-400">Calories Burned</p>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-light text-white">{run.calories_burned || 0}</p>
              <p className="text-sm text-gray-500">kcal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="px-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs uppercase tracking-widest text-gray-500">Notes</h2>
          {!editingNotes && (
            <button 
              onClick={() => {
                setNotes(run.notes || '');
                setEditingNotes(true);
              }}
              className="text-emerald-400 text-sm flex items-center gap-1"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>
        
        {editingNotes ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did this run feel? Add notes here..."
              className="bg-transparent border-none text-white placeholder:text-gray-600 resize-none min-h-[100px] focus-visible:ring-0"
            />
            <div className="flex justify-end gap-2 mt-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setEditingNotes(false)}
                className="text-gray-400"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button 
                size="sm"
                onClick={() => updateMutation.mutate({ notes })}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            {run.notes ? (
              <p className="text-gray-300 whitespace-pre-wrap">{run.notes}</p>
            ) : (
              <p className="text-gray-600 italic">No notes for this run</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}