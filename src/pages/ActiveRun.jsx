import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, Zap, Heart, Flame, Timer } from 'lucide-react';
import RunTimer from '@/components/running/RunTimer';
import RunControls from '@/components/running/RunControls';
import MetricDisplay from '@/components/running/MetricDisplay';
import HeartRateMonitor from '@/components/running/HeartRateMonitor';
import RunMap from '@/components/running/RunMap';

export default function ActiveRun() {
  const navigate = useNavigate();
  const [runStatus, setRunStatus] = useState('idle'); // idle, active, paused
  const [seconds, setSeconds] = useState(0);
  const [distance, setDistance] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [heartRate, setHeartRate] = useState(72);
  const [maxHeartRate, setMaxHeartRate] = useState(72);
  const [calories, setCalories] = useState(0);
  const [runId, setRunId] = useState(null);
  const [routePoints, setRoutePoints] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('Not tested');
  const [currentLat, setCurrentLat] = useState(null);
  const [currentLng, setCurrentLng] = useState(null);
  const [gpsAccuracyM, setGpsAccuracyM] = useState(null);
  
  // Pre-run location tracking
  const [preRunLat, setPreRunLat] = useState(null);
  const [preRunLng, setPreRunLng] = useState(null);
  const [preRunAccuracyM, setPreRunAccuracyM] = useState(null);
  const [locationStatus, setLocationStatus] = useState('loading');
  const [lastLocationTime, setLastLocationTime] = useState(null);
  
  const timerRef = useRef(null);
  const watchIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const lastPositionRef = useRef(null);
  const lastCaptureTimeRef = useRef(0);
  const autoRefreshIntervalRef = useRef(null);

  // Get initial location on page load
  useEffect(() => {
    setLocationStatus('loading');
    
    if (!('geolocation' in navigator)) {
      setLocationStatus('error');
      setGpsError('เบราว์เซอร์ของคุณไม่รองรับ GPS');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPreRunLat(position.coords.latitude);
        setPreRunLng(position.coords.longitude);
        setPreRunAccuracyM(position.coords.accuracy);
        setLastLocationTime(new Date());
        setLocationStatus('ready');
        setCurrentPosition({ 
          lat: position.coords.latitude, 
          lng: position.coords.longitude 
        });
        setGpsError(null);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus('denied');
          setGpsError('กรุณาอนุญาตการเข้าถึงตำแหน่ง');
        } else {
          setLocationStatus('error');
          setGpsError('ไม่สามารถรับตำแหน่งได้');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Auto-refresh location every 5 seconds while idle
  useEffect(() => {
    if (runStatus === 'idle' && locationStatus === 'ready') {
      autoRefreshIntervalRef.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newAccuracy = position.coords.accuracy;
            // Only update if accuracy improves
            if (!preRunAccuracyM || newAccuracy < preRunAccuracyM) {
              setPreRunLat(position.coords.latitude);
              setPreRunLng(position.coords.longitude);
              setPreRunAccuracyM(newAccuracy);
              setLastLocationTime(new Date());
              setCurrentPosition({ 
                lat: position.coords.latitude, 
                lng: position.coords.longitude 
              });
            }
          },
          () => {
            // Ignore errors during auto-refresh
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      }, 5000);
    }

    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, [runStatus, locationStatus, preRunAccuracyM]);

  // Simulated heart rate (in real app, would connect to Bluetooth device)
  useEffect(() => {
    if (runStatus === 'active') {
      const hrInterval = setInterval(() => {
        // Simulate heart rate based on activity
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

  // Calculate calories (simplified formula)
  useEffect(() => {
    if (runStatus === 'active' && seconds > 0) {
      // MET value for running: ~8-12 depending on speed
      const met = 8 + (currentSpeed / 5);
      const weight = 70; // Default weight in kg
      const caloriesPerMinute = (met * weight * 3.5) / 200;
      setCalories(Math.round(caloriesPerMinute * (seconds / 60)));
    }
  }, [seconds, currentSpeed, runStatus]);

  // Timer
  useEffect(() => {
    if (runStatus === 'active') {
      timerRef.current = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [runStatus]);

  // GPS tracking
  const startGPSTracking = useCallback(() => {
    if ('geolocation' in navigator) {
      // Request permission first
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'denied') {
          setGpsError('กรุณาเปิดการเข้าถึงตำแหน่งในการตั้งค่าเบราว์เซอร์');
          return;
        }
      });

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, speed } = position.coords;
          const now = Date.now();
          
          // Update current position for map
          setCurrentPosition({ lat: latitude, lng: longitude });
          setGpsError(null);
          
          // Capture point every 3 seconds
          if (now - lastCaptureTimeRef.current >= 3000) {
            const routePoint = {
              lat: latitude,
              lng: longitude,
              time: new Date().toISOString()
            };
            
            setRoutePoints(prev => [...prev, routePoint]);
            lastCaptureTimeRef.current = now;
            
            // Calculate distance if we have a previous position
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
          
          // Update speed (convert m/s to km/h)
          const speedKmh = speed ? speed * 3.6 : 0;
          setCurrentSpeed(speedKmh);
          if (speedKmh > maxSpeed) setMaxSpeed(speedKmh);
        },
        (error) => {
          console.log('GPS error:', error);
          if (error.code === error.PERMISSION_DENIED) {
            setGpsError('คุณไม่ได้อนุญาตให้เข้าถึงตำแหน่ง GPS กรุณาเปิดการเข้าถึงในการตั้งค่า');
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            setGpsError('ไม่สามารถรับสัญญาณ GPS ได้ กรุณาลองอีกครั้ง');
          } else {
            setGpsError('เกิดข้อผิดพลาดในการติดตาม GPS');
          }
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );
    } else {
      setGpsError('เบราว์เซอร์ของคุณไม่รองรับ GPS');
    }
  }, [maxSpeed]);



  const stopGPSTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
  };

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

  const handleCenterMap = () => {
    if (currentPosition) {
      setCurrentPosition({ ...currentPosition });
    }
  };

  const handleStart = async () => {
    startTimeRef.current = new Date().toISOString();
    setRunStatus('active');

    // Stop auto-refresh
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
    }

    // Start continuous GPS tracking
    startGPSTracking();

    // Create run record
    const run = await base44.entities.Run.create({
      start_time: startTimeRef.current,
      status: 'active',
    });
    setRunId(run.id);
  };

  const handlePause = () => {
    setRunStatus('paused');
    stopGPSTracking();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleResume = () => {
    setRunStatus('active');
    startGPSTracking();
  };

  const handleStop = async () => {
    stopGPSTracking();
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

  const handleTestGPS = () => {
    setGpsStatus('Testing...');
    
    if (!('geolocation' in navigator)) {
      setGpsStatus('ERROR: Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsStatus('OK');
        setCurrentLat(position.coords.latitude);
        setCurrentLng(position.coords.longitude);
        setGpsAccuracyM(position.coords.accuracy);
      },
      (error) => {
        setGpsStatus(`ERROR: ${error.code} - ${error.message}`);
        setCurrentLat(null);
        setCurrentLng(null);
        setGpsAccuracyM(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
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
            'bg-red-500/20 text-red-400'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              locationStatus === 'loading' ? 'bg-yellow-400 animate-pulse' :
              locationStatus === 'ready' ? 'bg-emerald-400' :
              'bg-red-400'
            }`} />
            {locationStatus === 'loading' && 'Locating...'}
            {locationStatus === 'ready' && `GPS Ready (±${preRunAccuracyM?.toFixed(0)}m)`}
            {(locationStatus === 'denied' || locationStatus === 'error') && 'Location Off'}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs uppercase tracking-wider ${
            runStatus === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
            runStatus === 'paused' ? 'bg-amber-500/20 text-amber-400' :
            'bg-white/10 text-gray-400'
          }`}>
            {runStatus}
          </span>
        </div>
      </div>

      {/* GPS Error Message */}
      {gpsError && locationStatus !== 'ready' && (
        <div className="px-6 pt-4">
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
            <p className="text-red-400 text-sm">{gpsError}</p>
            {locationStatus === 'denied' && (
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-1 bg-red-500/30 hover:bg-red-500/40 rounded-lg text-xs text-red-300 transition-colors"
              >
                Retry
              </button>
            )}
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
            isActive={runStatus === 'active'}
            preRunPosition={runStatus === 'idle' && preRunLat && preRunLng ? { lat: preRunLat, lng: preRunLng } : null}
            onCenterClick={handleCenterMap}
          />
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-purple-400">GPS Debug</h3>
            <button
              onClick={handleTestGPS}
              className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 rounded-lg text-xs text-purple-300 transition-colors"
            >
              Test GPS
            </button>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">GPS Status:</span>
              <span className={`font-mono ${gpsStatus.includes('OK') ? 'text-green-400' : gpsStatus.includes('ERROR') ? 'text-red-400' : 'text-gray-400'}`}>
                {gpsStatus}
              </span>
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
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-950 via-gray-950 to-transparent pt-8 pb-12">
        <RunControls
          status={runStatus}
          onStart={handleStart}
          onPause={handlePause}
          onResume={handleResume}
          onStop={handleStop}
        />
      </div>
    </div>
  );
}