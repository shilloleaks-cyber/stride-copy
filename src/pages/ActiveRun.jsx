import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, Zap, Heart, Flame, Timer } from 'lucide-react';
import RunTimer from '@/components/running/RunTimer';
import StravaRunControls from '@/components/running/StravaRunControls';
import MetricDisplay from '@/components/running/MetricDisplay';
import HeartRateMonitor from '@/components/running/HeartRateMonitor';
import RunMap from '@/components/running/RunMap';

export default function ActiveRun() {
  const navigate = useNavigate();
  // Run state
  const [runStatus, setRunStatus] = useState('IDLE'); // IDLE, RUNNING, PAUSED
  const [seconds, setSeconds] = useState(0);
  const [distance, setDistance] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [heartRate, setHeartRate] = useState(72);
  const [maxHeartRate, setMaxHeartRate] = useState(72);
  const [calories, setCalories] = useState(0);
  const [runId, setRunId] = useState(null);
  const [routePoints, setRoutePoints] = useState([]);
  
  // GPS state
  const [currentLat, setCurrentLat] = useState(null);
  const [currentLng, setCurrentLng] = useState(null);
  const [gpsAccuracyM, setGpsAccuracyM] = useState(null);
  const [locationStatus, setLocationStatus] = useState('loading'); // loading, ready, denied, error
  
  // Smart centering state
  const [hasCentered, setHasCentered] = useState(false);
  const [bestAccuracyM, setBestAccuracyM] = useState(9999);
  const [lastCenterTimeMs, setLastCenterTimeMs] = useState(0);
  const [mapCenter, setMapCenter] = useState([13.7563, 100.5018]);
  const [mapZoom, setMapZoom] = useState(16);
  
  // Refs
  const timerRef = useRef(null);
  const idleWatchIdRef = useRef(null);
  const runningWatchIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const lastPositionRef = useRef(null);
  const lastCaptureTimeRef = useRef(0);

  // IDLE MODE: Auto GPS tracking on page load
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('error');
      return;
    }

    // Start IDLE watchPosition
    idleWatchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        setLocationStatus('ready');
        setCurrentLat(latitude);
        setCurrentLng(longitude);
        setGpsAccuracyM(accuracy);
        
        // Track best accuracy
        if (accuracy < bestAccuracyM) {
          setBestAccuracyM(accuracy);
        }
        
        // SMART AUTO-CENTER LOGIC
        const now = Date.now();
        
        // A) First time center (when accuracy is good enough)
        if (!hasCentered && accuracy <= 50) {
          setMapCenter([latitude, longitude]);
          setMapZoom(16);
          setHasCentered(true);
          setLastCenterTimeMs(now);
        }
        // B) Smart re-center when accuracy improves significantly
        else if (hasCentered) {
          const accuracyImprovement = bestAccuracyM - accuracy;
          const timeSinceLastCenter = now - lastCenterTimeMs;
          
          if (
            accuracy <= 20 &&
            accuracyImprovement >= 15 &&
            timeSinceLastCenter >= 8000
          ) {
            setMapCenter([latitude, longitude]);
            setLastCenterTimeMs(now);
          }
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus('denied');
        } else {
          setLocationStatus('error');
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    // Cleanup on unmount
    return () => {
      if (idleWatchIdRef.current) {
        navigator.geolocation.clearWatch(idleWatchIdRef.current);
      }
    };
  }, []);

  // Simulated heart rate
  useEffect(() => {
    if (runStatus === 'RUNNING') {
      const hrInterval = setInterval(() => {
        const baseHR = 72;
        const activityBonus = Math.min(seconds / 10, 80);
        const variation = Math.random() * 10 - 5;
        const newHR = Math.round(baseHR + activityBonus + variation);
        setHeartRate(prev => {
          const smoothed = Math.round((prev * 0.7) + (newHR * 0.3));
          return Math.max(60, Math.min(200, smoothed));
        });
      }, 1000);
      return () => clearInterval(hrInterval);
    }
  }, [runStatus, seconds]);

  // Update max heart rate
  useEffect(() => {
    if (heartRate > maxHeartRate) {
      setMaxHeartRate(heartRate);
    }
  }, [heartRate, maxHeartRate]);

  // Calculate calories
  useEffect(() => {
    if (runStatus === 'RUNNING' && seconds > 0) {
      const met = 8 + (currentSpeed / 5);
      const weight = 70;
      const caloriesPerMinute = (met * weight * 3.5) / 200;
      setCalories(Math.round(caloriesPerMinute * (seconds / 60)));
    }
  }, [seconds, currentSpeed, runStatus]);

  // Timer
  useEffect(() => {
    if (runStatus === 'RUNNING') {
      timerRef.current = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [runStatus]);

  // RUNNING MODE: GPS tracking with route capture
  const startRunningGPSTracking = useCallback(() => {
    runningWatchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed } = position.coords;
        const now = Date.now();

        // Update current position
        setCurrentLat(latitude);
        setCurrentLng(longitude);
        setGpsAccuracyM(position.coords.accuracy);

        // Auto-center map on current position during run
        setMapCenter([latitude, longitude]);

        // Capture route point every 3 seconds
        if (now - lastCaptureTimeRef.current >= 3000) {
          const routePoint = {
            lat: latitude,
            lng: longitude,
            time: new Date().toISOString()
          };

          setRoutePoints(prev => [...prev, routePoint]);
          lastCaptureTimeRef.current = now;

          // Calculate distance
          if (lastPositionRef.current) {
            const dist = calculateDistance(
              lastPositionRef.current.lat,
              lastPositionRef.current.lng,
              latitude,
              longitude
            );
            setDistance(d => d + dist);
          }

          lastPositionRef.current = { lat: latitude, lng: longitude };
        }

        // Update speed (m/s to km/h)
        const speedKmh = speed ? speed * 3.6 : 0;
        setCurrentSpeed(speedKmh);
        if (speedKmh > maxSpeed) setMaxSpeed(speedKmh);
      },
      (error) => {
        console.log('Running GPS error:', error);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  }, [maxSpeed]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Re-center button handler
  const handleRecenter = () => {
    if (currentLat && currentLng) {
      setMapCenter([currentLat, currentLng]);
      setMapZoom(16);
      setLastCenterTimeMs(Date.now());
      setHasCentered(true);
    }
  };

  const handleStart = async () => {
    startTimeRef.current = new Date().toISOString();
    setRunStatus('RUNNING');

    // Stop IDLE tracking
    if (idleWatchIdRef.current) {
      navigator.geolocation.clearWatch(idleWatchIdRef.current);
    }

    // Reset route data
    setRoutePoints([]);
    setDistance(0);
    lastPositionRef.current = null;
    lastCaptureTimeRef.current = 0;

    // Start RUNNING GPS tracking
    startRunningGPSTracking();

    // Create run record
    const run = await base44.entities.Run.create({
      start_time: startTimeRef.current,
      status: 'active',
    });
    setRunId(run.id);
  };

  const handlePause = () => {
    setRunStatus('PAUSED');
    if (runningWatchIdRef.current) {
      navigator.geolocation.clearWatch(runningWatchIdRef.current);
    }
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleResume = () => {
    setRunStatus('RUNNING');
    startRunningGPSTracking();
  };

  const handleStop = async () => {
    if (runningWatchIdRef.current) {
      navigator.geolocation.clearWatch(runningWatchIdRef.current);
    }
    if (timerRef.current) clearInterval(timerRef.current);

    const pace = distance > 0 ? (seconds / 60) / distance : 0;
    const avgSpeed = seconds > 0 ? (distance / seconds) * 3600 : 0;
    const avgHR = Math.round((72 + maxHeartRate) / 2);

    const startPoint = routePoints.length > 0 ? routePoints[0] : null;
    const endPoint = routePoints.length > 0 ? routePoints[routePoints.length - 1] : null;

    if (runId) {
      await base44.entities.Run.update(runId, {
        end_time: new Date().toISOString(),
        duration_seconds: seconds,
        distance_km: parseFloat(distance.toFixed(3)),
        avg_speed_kmh: parseFloat(avgSpeed.toFixed(2)),
        max_speed_kmh: parseFloat(maxSpeed.toFixed(2)),
        calories_burned: calories,
        avg_heart_rate: avgHR,
        max_heart_rate: maxHeartRate,
        pace_min_per_km: parseFloat(pace.toFixed(2)),
        status: 'completed',
        route_points: routePoints,
        start_lat: startPoint?.lat,
        start_lng: startPoint?.lng,
        end_lat: endPoint?.lat,
        end_lng: endPoint?.lng,
      });
    }

    navigate(createPageUrl(`RunDetails?id=${runId}`));
  };

  const pace = distance > 0 ? (seconds / 60) / distance : 0;
  const formatPace = (pace) => {
    if (!pace || pace === Infinity || pace === 0) return '--:--';
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const currentPosition = currentLat && currentLng ? { lat: currentLat, lng: currentLng } : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-32">
      {/* Header */}
      <div className="px-6 pt-6 flex items-center justify-between">
        <button 
          onClick={() => navigate(createPageUrl('Home'))}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          {/* Location Status Chip */}
          <span className={`px-3 py-1 rounded-full text-xs flex items-center gap-2 ${
            locationStatus === 'loading' ? 'bg-yellow-500/20 text-yellow-400' :
            locationStatus === 'ready' ? 'bg-emerald-500/20 text-emerald-400' :
            locationStatus === 'denied' ? 'bg-red-500/20 text-red-400' :
            'bg-orange-500/20 text-orange-400'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              locationStatus === 'loading' ? 'bg-yellow-400 animate-pulse' :
              locationStatus === 'ready' ? 'bg-emerald-400' :
              locationStatus === 'denied' ? 'bg-red-400' :
              'bg-orange-400'
            }`} />
            {locationStatus === 'loading' && 'Locating...'}
            {locationStatus === 'ready' && gpsAccuracyM && `GPS Ready (±${gpsAccuracyM.toFixed(0)}m)`}
            {locationStatus === 'denied' && 'Location Off'}
            {locationStatus === 'error' && 'GPS Error'}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs uppercase tracking-wider ${
            runStatus === 'RUNNING' ? 'bg-emerald-500/20 text-emerald-400' :
            runStatus === 'PAUSED' ? 'bg-amber-500/20 text-amber-400' :
            'bg-white/10 text-gray-400'
          }`}>
            {runStatus}
          </span>
        </div>
      </div>

      {/* GPS Error Message */}
      {locationStatus === 'denied' && (
        <div className="px-6 pt-4">
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
            <p className="text-red-400 text-sm mb-2">กรุณาอนุญาตการเข้าถึงตำแหน่ง GPS</p>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 bg-red-500/30 hover:bg-red-500/40 rounded-lg text-xs text-red-300 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      )}
      {locationStatus === 'error' && (
        <div className="px-6 pt-4">
          <div className="bg-orange-500/20 border border-orange-500/30 rounded-xl p-4">
            <p className="text-orange-400 text-sm">ไม่สามารถรับสัญญาณ GPS ได้</p>
          </div>
        </div>
      )}

      {/* Timer */}
      <RunTimer seconds={seconds} isActive={runStatus === 'active'} />

      {/* Map */}
      <div className="px-6 mb-6">
        <div className="h-64 rounded-2xl overflow-hidden border border-white/10 relative">
          <RunMap 
            routeCoordinates={routePoints}
            currentPosition={currentPosition}
            isActive={runStatus === 'RUNNING'}
            preRunPosition={runStatus === 'IDLE' && currentPosition ? currentPosition : null}
            mapCenter={mapCenter}
            mapZoom={mapZoom}
          />
          {/* Re-center Button */}
          {currentPosition && (
            <button
              onClick={handleRecenter}
              className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white p-3 rounded-full hover:bg-black/80 transition-colors shadow-lg"
              aria-label="Re-center map"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Main Metrics */}
      <div className="px-6 mb-6">
        <div className="grid grid-cols-3 gap-6">
          <MetricDisplay label="Distance" value={distance.toFixed(2)} unit="km" />
          <MetricDisplay label="Pace" value={formatPace(pace)} unit="/km" />
          <MetricDisplay label="Speed" value={currentSpeed.toFixed(1)} unit="km/h" />
        </div>
      </div>

      {/* Heart Rate */}
      <div className="px-6 mb-6">
        <HeartRateMonitor bpm={heartRate} isActive={runStatus === 'active'} />
      </div>

      {/* Additional Stats */}
      <div className="px-6 mb-8">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
            <div className="p-2 rounded-xl bg-orange-500/20">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Calories</p>
              <p className="text-2xl font-light text-white">{calories}</p>
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
            <div className="p-2 rounded-xl bg-blue-500/20">
              <Zap className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Max Speed</p>
              <p className="text-2xl font-light text-white">{maxSpeed.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* GPS Debug Card */}
      <div className="px-6 mb-8">
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4">
          <h3 className="text-sm font-medium text-purple-400 mb-3">GPS Debug</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Status:</span>
              <span className="font-mono text-white">{locationStatus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Latitude:</span>
              <span className="font-mono text-white">{currentLat !== null ? currentLat.toFixed(6) : '--'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Longitude:</span>
              <span className="font-mono text-white">{currentLng !== null ? currentLng.toFixed(6) : '--'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Accuracy:</span>
              <span className="font-mono text-white">{gpsAccuracyM !== null ? `${gpsAccuracyM.toFixed(1)} m` : '--'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Best Accuracy:</span>
              <span className="font-mono text-emerald-400">{bestAccuracyM < 9999 ? `${bestAccuracyM.toFixed(1)} m` : '--'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Has Centered:</span>
              <span className="font-mono text-white">{hasCentered ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Route Points:</span>
              <span className="font-mono text-white">{routePoints.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Strava-Style Controls */}
      <StravaRunControls
        status={runStatus}
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onStop={handleStop}
      />
      </div>
      );
      }