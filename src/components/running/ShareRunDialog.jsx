import React, { useState, useRef } from 'react';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { Share2, Download, Link2, Facebook, Twitter, Check, Coins } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import RunMap from './RunMap';

// Funny motivational slogans
const RUN_SLOGANS = [
  "I run therefore I eat.",
  "Run now, regret tomorrow.",
  "Slow pace, strong mindset.",
  "Chasing coins, not people.",
  "Running for coins, not cardio.",
  "Legs tired, wallet happy.",
  "Not fast, just consistent.",
  "Earned this sweat.",
  "Run. Earn. Repeat.",
  "My legs hate me but my coins love me."
];

export default function ShareRunDialog({ run, trigger }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [slogan] = useState(() => RUN_SLOGANS[Math.floor(Math.random() * RUN_SLOGANS.length)]);
  const shareCardRef = useRef(null);

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

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShareFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const handleShareTwitter = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Just completed a ${run.distance_km?.toFixed(2)}km run! 🏃‍♂️💪`);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
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
            url: window.location.href,
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
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Share Your Run</DialogTitle>
        </DialogHeader>

        {/* Share Preview Card */}
        <div 
          ref={shareCardRef}
          className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-3xl p-8 mb-4"
        >
          {/* Header - App branding */}
          <div className="text-center mb-6">
            <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest">
              {run.start_time && format(new Date(run.start_time), 'MMM d, yyyy')}
            </p>
          </div>

          {/* Map Preview - Larger */}
          {run.route_points && run.route_points.length >= 2 && (
            <div className="h-64 rounded-2xl overflow-hidden mb-6">
              <RunMap 
                routeCoordinates={run.route_points}
                currentPosition={null}
                isActive={false}
                showFullRoute={true}
                enableZoom={false}
              />
            </div>
          )}

          {/* Stats Grid - 2x2 Layout */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Distance - Very Large */}
            <div className="bg-white/5 rounded-2xl p-5 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Distance</p>
              <p className="text-5xl font-bold text-white">{run.distance_km?.toFixed(2) || '0.00'}</p>
              <p className="text-sm text-gray-400 mt-1">km</p>
            </div>

            {/* Coins - Glowing */}
            <div className="bg-emerald-500/10 rounded-2xl p-5 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent"></div>
              <div className="relative">
                <p className="text-xs text-emerald-400 uppercase tracking-wider mb-2">Coins</p>
                <div className="flex items-center justify-center gap-2">
                  <Coins className="w-8 h-8 text-[#BFFF00]" />
                  <p className="text-5xl font-bold text-[#BFFF00]" style={{ textShadow: '0 0 20px rgba(191, 255, 0, 0.5)' }}>
                    {Math.round((run.distance_km || 0) * 10)}
                  </p>
                </div>
              </div>
            </div>

            {/* Pace */}
            <div className="bg-white/5 rounded-2xl p-5 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Pace</p>
              <p className="text-3xl font-light text-white">{formatPace(run.pace_min_per_km)}</p>
              <p className="text-sm text-gray-400 mt-1">/km</p>
            </div>

            {/* Time */}
            <div className="bg-white/5 rounded-2xl p-5 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Time</p>
              <p className="text-3xl font-light text-white">{formatDuration(run.duration_seconds)}</p>
            </div>
          </div>

          {/* Funny Slogan */}
          <div className="text-center">
            <p className="text-gray-400 text-sm italic">"{slogan}"</p>
          </div>
        </div>

        {/* Share Actions */}
        <div className="space-y-2">
          {navigator.share && (
            <Button 
              onClick={handleWebShare}
              disabled={isGenerating}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              <Share2 className="w-4 h-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Share'}
            </Button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={handleDownload}
              disabled={isGenerating}
              variant="outline"
              className="border-gray-700 hover:bg-gray-800"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button 
              onClick={handleCopyLink}
              variant="outline"
              className="border-gray-700 hover:bg-gray-800"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4 mr-2" />
                  Copy Link
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={handleShareFacebook}
              variant="outline"
              className="border-gray-700 hover:bg-gray-800"
            >
              <Facebook className="w-4 h-4 mr-2" />
              Facebook
            </Button>
            <Button 
              onClick={handleShareTwitter}
              variant="outline"
              className="border-gray-700 hover:bg-gray-800"
            >
              <Twitter className="w-4 h-4 mr-2" />
              Twitter
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}