import React, { useState, useRef, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { Share2, Download, Coins, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';

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
  const [routeImageUrl, setRouteImageUrl] = useState(null);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const shareCardRef = useRef(null);
  const mapPreviewRef = useRef(null);
  
  const currentQuote = motivationalQuotes[currentQuoteIndex];
  const coinsEarned = Math.floor((run.distance_km || 0) * 10);

  const cycleQuote = () => {
    setCurrentQuoteIndex((prev) => (prev + 1) % motivationalQuotes.length);
  };

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

  // Generate static route image
  useEffect(() => {
    if (!run.route_points || run.route_points.length < 2) return;
    
    const generateStaticMap = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      
      // Calculate bounds
      const lats = run.route_points.map(p => p.lat);
      const lngs = run.route_points.map(p => p.lng);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      
      const padding = 0.002;
      const latRange = maxLat - minLat + padding * 2;
      const lngRange = maxLng - minLng + padding * 2;
      
      // Draw grayscale background
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Convert coordinates to canvas positions
      const toCanvasCoords = (lat, lng) => {
        const x = ((lng - minLng + padding) / lngRange) * canvas.width;
        const y = canvas.height - ((lat - minLat + padding) / latRange) * canvas.height;
        return [x, y];
      };
      
      // Draw purple glow
      ctx.strokeStyle = '#8A2BE2';
      ctx.lineWidth = 20;
      ctx.globalAlpha = 0.3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      run.route_points.forEach((point, i) => {
        const [x, y] = toCanvasCoords(point.lat, point.lng);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      
      // Draw neon green route
      ctx.strokeStyle = '#BFFF00';
      ctx.lineWidth = 8;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      run.route_points.forEach((point, i) => {
        const [x, y] = toCanvasCoords(point.lat, point.lng);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      
      // Start dot (white)
      const [startX, startY] = toCanvasCoords(run.route_points[0].lat, run.route_points[0].lng);
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(startX, startY, 8, 0, Math.PI * 2);
      ctx.fill();
      
      // Finish dot (purple)
      const lastPoint = run.route_points[run.route_points.length - 1];
      const [endX, endY] = toCanvasCoords(lastPoint.lat, lastPoint.lng);
      ctx.fillStyle = '#8A2BE2';
      ctx.beginPath();
      ctx.arc(endX, endY, 8, 0, Math.PI * 2);
      ctx.fill();
      
      setRouteImageUrl(canvas.toDataURL('image/png'));
    };
    
    generateStaticMap();
  }, [run.route_points]);

  const generateShareImage = async () => {
    if (!shareCardRef.current) return null;
    
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: '#0A0A0A',
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
      <DialogContent 
        className="border-0 text-white max-w-md p-0 overflow-hidden"
        style={{ 
          backgroundColor: '#0A0A0A',
          maxHeight: '90dvh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Scrollable Content Area */}
        <div className="overflow-y-auto flex-1">
          {/* Share Preview Card */}
          <div 
            ref={shareCardRef}
            className="p-4"
            style={{ backgroundColor: '#0A0A0A' }}
          >
            {/* Static Route Image - Top 60% */}
            {routeImageUrl ? (
              <div className="rounded-xl overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
                <img 
                  src={routeImageUrl} 
                  alt="Route preview" 
                  className="w-full h-full object-cover"
                  style={{ filter: 'contrast(1.1)' }}
                />
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden mb-4 bg-gray-900 flex items-center justify-center" style={{ aspectRatio: '4/3' }}>
                <p className="text-gray-600 text-sm">Generating route...</p>
              </div>
            )}

            {/* Performance Strip - 4 Stats */}
            <div className="grid grid-cols-4 gap-2 mb-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-1 uppercase">Distance</p>
                <p className="text-lg font-light text-white">
                  {run.distance_km?.toFixed(1) || '0.0'}
                </p>
                <p className="text-xs text-gray-600">km</p>
              </div>
              <div className="text-center border-x" style={{ borderColor: 'rgba(138, 43, 226, 0.3)' }}>
                <p className="text-xs text-gray-600 mb-1 uppercase">Pace</p>
                <p className="text-xl font-medium" style={{ color: '#BFFF00' }}>
                  {formatPace(run.pace_min_per_km)}
                </p>
                <p className="text-xs text-gray-600">/km</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-1 uppercase">Time</p>
                <p className="text-lg font-light text-white">
                  {formatDuration(run.duration_seconds)}
                </p>
              </div>
              <div className="text-center border-l" style={{ borderColor: 'rgba(138, 43, 226, 0.3)' }}>
                <p className="text-xs text-gray-600 mb-1 uppercase">Coins</p>
                <div className="flex items-center justify-center gap-0.5">
                  <Coins className="w-4 h-4" style={{ color: '#BFFF00' }} />
                  <p className="text-lg font-medium" style={{ color: '#BFFF00' }}>
                    {coinsEarned}
                  </p>
                </div>
              </div>
            </div>

            {/* Quote Box - Tap to Change */}
            <button
              onClick={cycleQuote}
              className="w-full text-center py-3 rounded-lg transition-all active:scale-98"
              style={{ 
                backgroundColor: 'rgba(138, 43, 226, 0.1)', 
                border: '1px solid rgba(138, 43, 226, 0.3)' 
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <p className="text-sm italic" style={{ color: '#8A2BE2' }}>
                  {currentQuote}
                </p>
                <RefreshCw className="w-3 h-3 opacity-50" style={{ color: '#8A2BE2' }} />
              </div>
            </button>
          </div>
        </div>

        {/* Fixed Bottom Action Bar */}
        <div 
          className="grid grid-cols-2 gap-3 px-4 py-3 border-t"
          style={{ 
            borderColor: 'rgba(138, 43, 226, 0.3)',
            paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))',
            backgroundColor: '#0A0A0A'
          }}
        >
          <Button 
            onClick={handleWebShare}
            disabled={isGenerating}
            className="h-11 text-black font-medium border-0"
            style={{ backgroundColor: '#BFFF00' }}
          >
            <Share2 className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Share'}
          </Button>
          <Button 
            onClick={handleDownload}
            disabled={isGenerating}
            variant="outline"
            className="h-11 border-2 hover:bg-white/5"
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