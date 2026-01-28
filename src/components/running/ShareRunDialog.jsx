import React, { useState, useRef } from 'react';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { Share2, Download, Link2, Facebook, Twitter, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import RunMap from './RunMap';

export default function ShareRunDialog({ run, trigger }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
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
          className="bg-gradient-to-br from-gray-950 to-gray-900 rounded-2xl p-6 mb-4"
        >
          {/* Header */}
          <div className="mb-4">
            <p className="text-emerald-400 text-xs uppercase tracking-widest mb-1">Completed Run</p>
            <h2 className="text-xl font-light">
              {run.start_time && format(new Date(run.start_time), 'EEEE, MMMM d')}
            </h2>
          </div>

          {/* Map Preview */}
          {run.route_points && run.route_points.length >= 2 && (
            <div className="h-32 rounded-xl overflow-hidden border border-white/10 mb-4">
              <RunMap 
                routeCoordinates={run.route_points}
                currentPosition={null}
                isActive={false}
                showFullRoute={true}
                enableZoom={false}
              />
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Distance</p>
              <p className="text-2xl font-light text-white">{run.distance_km?.toFixed(2) || '0.00'}</p>
              <p className="text-xs text-gray-500">km</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Duration</p>
              <p className="text-2xl font-light text-white">{formatDuration(run.duration_seconds)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Pace</p>
              <p className="text-2xl font-light text-white">{formatPace(run.pace_min_per_km)}</p>
              <p className="text-xs text-gray-500">/km</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-600">Powered by RunApp 🏃‍♂️</p>
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