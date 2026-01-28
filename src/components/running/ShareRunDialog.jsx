import React, { useState, useRef, useMemo } from 'react';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { Share2, Download, Coins } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import RunMap from './RunMap';

const motivationalQuotes = [
  "Every mile is a victory! 🏆",
  "You're unstoppable! 💪",
  "Running on pure determination! ⚡",
  "Fitness level: Legendary! 🔥",
  "Another day, another PR! 🚀",
  "Born to run, forced to work! 😅",
  "Legs are tired, but spirits high! ✨",
  "Running circles around yesterday! 🌟",
  "Crushing goals, one step at a time! 💥",
  "Sleep? Nah, more running! 😴➡️🏃",
];

export default function ShareRunDialog({ run, trigger }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const shareCardRef = useRef(null);
  
  const randomQuote = useMemo(() => 
    motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)],
    [run.id]
  );
  
  const coinsEarned = Math.floor((run.distance_km || 0) * 10);

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

  const generateShareImage = async () => {
    if (!shareCardRef.current) return null;
    
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: '#030712',
        scale: 2,
        logging: false,
      });
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      setIsGenerating(false);
      return blob;
    } catch (error) {
      console.error('Error generating image:', error);
      setIsGenerating(false);
      return null;
    }
  };

  const handleDownload = async () => {
    const blob = await generateShareImage();
    if (!blob) return;
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `run-${format(new Date(run.start_time), 'yyyy-MM-dd')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        const blob = await generateShareImage();
        if (blob) {
          const file = new File([blob], `run-${format(new Date(run.start_time), 'yyyy-MM-dd')}.png`, { type: 'image/png' });
          await navigator.share({
            title: 'My Run',
            text: `Just completed a ${run.distance_km?.toFixed(2)}km run!`,
            files: [file],
          });
        }
      } catch (error) {
        console.log('Share cancelled or failed:', error);
      }
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="border-0 text-white max-w-md p-0" style={{ backgroundColor: '#0A0A0A' }}>
        {/* Share Preview Card */}
        <div 
          ref={shareCardRef}
          className="rounded-2xl p-6"
          style={{ backgroundColor: '#0A0A0A' }}
        >
          {/* Map Preview - Larger */}
          {run.route_points && run.route_points.length >= 2 && (
            <div className="h-48 rounded-xl overflow-hidden mb-6">
              <RunMap 
                routeCoordinates={run.route_points}
                currentPosition={null}
                isActive={false}
                showFullRoute={true}
                enableZoom={false}
              />
            </div>
          )}

          {/* Stats - Two Rows */}
          <div className="space-y-4 mb-6">
            {/* Top Row - Large Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Distance</p>
                <p className="text-4xl font-light" style={{ color: '#BFFF00' }}>
                  {run.distance_km?.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-gray-500">km</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Time</p>
                <p className="text-4xl font-light" style={{ color: '#BFFF00' }}>
                  {formatDuration(run.duration_seconds)}
                </p>
              </div>
            </div>

            {/* Bottom Row - Smaller Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Pace</p>
                <p className="text-2xl font-light" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  {formatPace(run.pace_min_per_km)}
                </p>
                <p className="text-xs text-gray-500">/km</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Coins</p>
                <div className="flex items-center justify-center gap-1">
                  <Coins className="w-5 h-5" style={{ color: '#BFFF00' }} />
                  <p className="text-2xl font-light" style={{ color: '#BFFF00' }}>
                    {coinsEarned}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Motivational Quote */}
          <div className="text-center py-3 rounded-lg" style={{ backgroundColor: 'rgba(138, 43, 226, 0.1)', border: '1px solid rgba(138, 43, 226, 0.3)' }}>
            <p className="text-sm italic" style={{ color: '#8A2BE2' }}>
              {randomQuote}
            </p>
          </div>
        </div>

        {/* Action Buttons - Minimal Outline */}
        <div className="grid grid-cols-2 gap-3 px-6 pb-6">
          {navigator.share && (
            <Button 
              onClick={handleWebShare}
              disabled={isGenerating}
              variant="outline"
              className="border hover:bg-white/5"
              style={{ borderColor: '#8A2BE2', color: '#8A2BE2' }}
            >
              <Share2 className="w-4 h-4 mr-2" />
              {isGenerating ? 'Loading...' : 'Share'}
            </Button>
          )}
          <Button 
            onClick={handleDownload}
            disabled={isGenerating}
            variant="outline"
            className="border hover:bg-white/5"
            style={{ borderColor: '#8A2BE2', color: '#8A2BE2' }}
          >
            <Download className="w-4 h-4 mr-2" />
            Save Image
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}