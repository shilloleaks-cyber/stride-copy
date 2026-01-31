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
import GhostRunner from '@/components/running/GhostRunner';
import LevelUpModal from '@/components/running/LevelUpModal';
import FriendGhostSelector from '@/components/ghost/FriendGhostSelector';

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
  
  // Ghost run state
  const [ghostEnabled, setGhostEnabled] = useState(false);
  const [ghostRun, setGhostRun] = useState(null);
  const [ghostFriend, setGhostFriend] = useState(null);
  const [timeDifference, setTimeDifference] = useState(0); // seconds ahead/behind
  const [showFriendSelector, setShowFriendSelector] = useState(false);
  
  // Level up state
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [levelUpData, setLevelUpData] = useState(null);
  
  // User state
  const [user, setUser] = useState(null);
  
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

  // Load user and potential ghost run on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        const userLevel = userData.current_level || 0;
        
        // Ghost run unlocked at level 3
        if (userLevel < 3) return;
        
        const allRuns = await base44.entities.Run.filter({ 
          created_by: userData.email,
          status: 'completed'
        });
        
        const completedRuns = allRuns.filter(r => 
          r.route_points && 
          r.route_points.length > 5 &&
          r.distance_km > 0.5
        );
        
        if (completedRuns.length > 0) {
          // Find best run (fastest pace)
          const bestRun = completedRuns.reduce((best, run) => 
            (!best || run.pace_min_per_km < best.pace_min_per_km) ? run : best
          );
          setGhostRun(bestRun);
        }
      } catch (error) {
        console.log('Could not load data:', error);
      }
    };
    
    loadData();
  }, []);

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

  // Calculate ghost time difference
  useEffect(() => {
    if (!ghostEnabled || !ghostRun || runStatus !== 'RUNNING' || !routePoints.length) {
      setTimeDifference(0);
      return;
    }
    
    // Find equivalent ghost time at current distance
    const currentDist = distance;
    let ghostTimeAtDist = 0;
    let accumulatedDist = 0;
    
    for (let i = 1; i < ghostRun.route_points.length; i++) {
      const prevPoint = ghostRun.route_points[i - 1];
      const currPoint = ghostRun.route_points[i];
      
      const segmentDist = calculateDistance(
        prevPoint.lat, prevPoint.lng,
        currPoint.lat, currPoint.lng
      );
      
      accumulatedDist += segmentDist;
      
      if (accumulatedDist >= currentDist) {
        const segmentTime = (new Date(currPoint.time) - new Date(ghostRun.route_points[0].time)) / 1000;
        ghostTimeAtDist = segmentTime;
        break;
      }
    }
    
    if (ghostTimeAtDist > 0) {
      setTimeDifference(ghostTimeAtDist - seconds);
    }
  }, [ghostEnabled, ghostRun, distance, seconds, runStatus, routePoints]);

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

    // Calculate coins earned (1 coin per km)
    const coinsEarned = Math.floor(distance);
    
    if (coinsEarned > 0) {
      try {
        const user = await base44.auth.me();
        const oldTotalCoins = user.total_coins || 0;
        const newTotalCoins = oldTotalCoins + coinsEarned;
        
        // Calculate levels
        const oldLevel = Math.floor(Math.sqrt(oldTotalCoins / 10));
        const newLevel = Math.floor(Math.sqrt(newTotalCoins / 10));
        const leveledUp = newLevel > oldLevel;
        
        // Update user
        await base44.auth.updateMe({
          total_coins: newTotalCoins,
          current_level: newLevel
        });
        
        // Show level modal
        setLevelUpData({
          coinsEarned,
          newLevel,
          leveledUp
        });
        setShowLevelModal(true);
        
        // Log to wallet
        await base44.entities.WalletLog.create({
          user: user.email,
          amount: coinsEarned,
          type: 'run',
          note: `Run: ${distance.toFixed(2)}km`
        });
      } catch (error) {
        console.log('Could not update coins:', error);
      }
    }

    // Check if beat ghost
    if (ghostEnabled && ghostRun && timeDifference < 0) {
      // User beat ghost! (timeDifference is negative = ahead)
      if (ghostFriend) {
        localStorage.setItem('beat_friend_ghost', ghostFriend.full_name || ghostFriend.email);
      } else {
        localStorage.setItem('beat_ghost', 'true');
      }
    }

    navigate(createPageUrl(`RunDetails?id=${runId}`));
  };

  const pace = distance > 0 ? (seconds / 60) / distance : 0;
  const formatPace = (pace) => {
    // Show "--:--" for very short distances
    if (!pace || pace === Infinity || pace === 0 || distance < 0.05) return '--:--';
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Hold to finish state
  const [holdProgress, setHoldProgress] = useState(0);
  const holdIntervalRef = useRef(null);
  
  const handleFinishHold = () => {
    setHoldProgress(0);
    holdIntervalRef.current = setInterval(() => {
      setHoldProgress(prev => {
        const next = prev + 5;
        if (next >= 100) {
          clearInterval(holdIntervalRef.current);
          handleStop();
          return 100;
        }
        return next;
      });
    }, 100);
  };
  
  const handleFinishRelease = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
    }
    setHoldProgress(0);
  };
  
  const currentPosition = currentLat && currentLng ? { lat: currentLat, lng: currentLng } : null;

  return (
    <div className="activeRunPage">
      <style>{styles}</style>
      {/* Header */}
      <div className="header">
        <button onClick={() => navigate(createPageUrl('Home'))} className="backBtn">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className={`statusChip ${locationStatus === 'ready' ? 'ready' : ''}`}>
          <div className="statusDot" />
          {locationStatus === 'loading' && 'Locating...'}
          {locationStatus === 'ready' && gpsAccuracyM && `GPS (±${gpsAccuracyM.toFixed(0)}m)`}
          {locationStatus === 'denied' && 'Location Off'}
          {locationStatus === 'error' && 'GPS Error'}
        </span>
      </div>
      
      {/* Game HUD - Top Right */}
      {runStatus === 'RUNNING' && (
        <FloatingGameHUD distance={distance} seconds={seconds} />
      )}

      {/* Ghost Run Options */}
      {user && user.current_level >= 3 && runStatus === 'IDLE' && (
        <div className="px-6 pt-4 space-y-3">
          {/* Personal Best Ghost */}
          {ghostRun && !ghostFriend && (
            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setGhostEnabled(!ghostEnabled)}
              className={`w-full p-4 rounded-2xl border transition-all ${
                ghostEnabled
                  ? 'bg-white/10 border-white/30'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-xl">👻</span>
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">Your Ghost</p>
                    <p className="text-xs text-gray-400">
                      Best: {ghostRun.distance_km.toFixed(2)}km
                    </p>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full transition-colors ${
                  ghostEnabled ? 'bg-emerald-500' : 'bg-gray-600'
                }`}>
                  <motion.div
                    animate={{ x: ghostEnabled ? 24 : 2 }}
                    className="w-5 h-5 bg-white rounded-full mt-0.5"
                  />
                </div>
              </div>
            </motion.button>
          )}
          
          {/* Friend Ghost */}
          {ghostFriend && ghostRun && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-500/20 border border-blue-500/30 rounded-2xl p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                    {ghostFriend.full_name?.[0] || '?'}
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">Racing {ghostFriend.full_name}</p>
                    <p className="text-xs text-blue-400">
                      {ghostRun.distance_km.toFixed(2)}km • {Math.floor(ghostRun.duration_seconds / 60)}min
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setGhostFriend(null);
                    setGhostRun(null);
                    setGhostEnabled(false);
                  }}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          )}
          
          {/* Friend Ghost Selector Button */}
          {!ghostFriend && (
            <button
              onClick={() => setShowFriendSelector(true)}
              className="w-full p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-2xl transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <span className="text-xl">👥</span>
                </div>
                <div>
                  <p className="text-white font-medium">Race Friend Ghost</p>
                  <p className="text-xs text-blue-400">Challenge your friends</p>
                </div>
              </div>
            </button>
          )}
        </div>
      )}

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
      <div className="timerSection">
        <div className="timerValue">{formatTime(seconds)}</div>
      </div>

      {/* Map */}
      <div className="mapSection">
        <div className="mapOverlay" />
        <div className="mapWrap">
          <RunMap 
            routeCoordinates={routePoints}
            currentPosition={currentPosition}
            isActive={runStatus === 'RUNNING'}
            preRunPosition={runStatus === 'IDLE' && currentPosition ? currentPosition : null}
            mapCenter={mapCenter}
            mapZoom={mapZoom}
          >
            {ghostEnabled && ghostRun && (
              <GhostRunner 
                ghostRoute={ghostRun.route_points}
                currentSeconds={seconds}
                isActive={runStatus === 'RUNNING'}
              />
            )}
          </RunMap>
          
          {/* Ghost Status */}
          {ghostEnabled && runStatus === 'RUNNING' && timeDifference !== 0 && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full">
              <p className={`text-sm font-medium ${timeDifference < 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
                {timeDifference < 0 ? (ghostFriend ? '🏆 Ahead' : '👻 Ahead') : (ghostFriend ? '😅 Behind' : '👻 Behind')} {Math.abs(Math.round(timeDifference))}s
              </p>
            </div>
          )}
          
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

      {/* Metrics Grid */}
      <div className="metricsGrid">
        <div className="metricCard">
          <div className="metricLabel">DISTANCE</div>
          <div className="metricValue">{distance.toFixed(2)} <span className="metricUnit">km</span></div>
        </div>
        <div className="metricCard">
          <div className="metricLabel">PACE</div>
          <div className="metricValue">{formatPace(pace)} <span className="metricUnit">/km</span></div>
        </div>
        <div className="metricCard">
          <div className="metricLabel">SPEED</div>
          <div className="metricValue">{currentSpeed.toFixed(1)} <span className="metricUnit">km/h</span></div>
        </div>
        <div className="metricCard heartCard">
          <div className="heartTop">
            <Heart className="heartIcon" fill="currentColor" />
            <div className="metricLabel">HEART RATE</div>
          </div>
          <div className="metricValue">{heartRate} <span className="metricUnit">bpm</span></div>
          <div className="heartPulseBar">
            <div className="heartPulse" style={{ width: `${(heartRate / 200) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls">
        {runStatus === 'IDLE' && (
          <button className="ctrlBtn startBtn" onClick={handleStart}>
            <span className="ctrlIcon">▶</span>
          </button>
        )}
        
        {runStatus === 'RUNNING' && (
          <>
            <button className="ctrlBtn pauseBtn" onClick={handlePause}>
              <span className="ctrlIcon">⏸</span>
            </button>
            <button 
              className="ctrlBtn finishBtn"
              onMouseDown={handleFinishHold}
              onMouseUp={handleFinishRelease}
              onTouchStart={handleFinishHold}
              onTouchEnd={handleFinishRelease}
            >
              <span className="ctrlIcon">■</span>
              {holdProgress > 0 && (
                <div className="holdProgress" style={{ width: `${holdProgress}%` }} />
              )}
            </button>
          </>
        )}
        
        {runStatus === 'PAUSED' && (
          <>
            <button className="ctrlBtn resumeBtn" onClick={handleResume}>
              <span className="ctrlIcon">▶</span>
            </button>
            <button 
              className="ctrlBtn finishBtn"
              onMouseDown={handleFinishHold}
              onMouseUp={handleFinishRelease}
              onTouchStart={handleFinishHold}
              onTouchEnd={handleFinishRelease}
            >
              <span className="ctrlIcon">■</span>
              {holdProgress > 0 && (
                <div className="holdProgress" style={{ width: `${holdProgress}%` }} />
              )}
            </button>
          </>
        )}
      </div>

      {/* Level Up Modal */}
      {levelUpData && (
        <LevelUpModal
          isOpen={showLevelModal}
          onClose={() => setShowLevelModal(false)}
          newLevel={levelUpData.newLevel}
          coinsEarned={levelUpData.coinsEarned}
          leveledUp={levelUpData.leveledUp}
        />
      )}

      {/* Friend Ghost Selector */}
      <FriendGhostSelector
        isOpen={showFriendSelector}
        onClose={() => setShowFriendSelector(false)}
        onSelect={(run, friend) => {
          setGhostRun(run);
          setGhostFriend(friend);
          setGhostEnabled(true);
        }}
        user={user}
      />
    </div>
  );
}

function FloatingGameHUD({ distance, seconds }) {
  const [notifications, setNotifications] = useState([]);
  const notifIdRef = useRef(0);
  
  useEffect(() => {
    if (seconds === 0) return;
    
    // Show notification every 20-30 seconds
    const interval = setInterval(() => {
      const id = ++notifIdRef.current;
      const coinGain = Math.floor(Math.random() * 3) + 1;
      
      const messages = [
        { icon: '🪙', text: `+${coinGain} coins`, type: 'coin' },
        { icon: '🔥', text: 'streak', type: 'streak' },
        { icon: '⚡', text: 'combo', type: 'combo' },
      ];
      
      const msg = messages[Math.floor(Math.random() * messages.length)];
      
      setNotifications(prev => [...prev, { ...msg, id }]);
      
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 3000);
    }, Math.random() * 10000 + 20000); // 20-30 seconds
    
    return () => clearInterval(interval);
  }, [seconds]);
  
  return (
    <div className="gameHud">
      <AnimatePresence>
        {notifications.map(notif => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, y: -10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            className="hudItem"
          >
            <span className="hudIcon">{notif.icon}</span>
            <span className="hudVal">{notif.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function formatTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const styles = `
  :root {
    --neon: #BFFF00;
    --purple: #8A2BE2;
    --bg: #0A0A0A;
    --glass: rgba(255,255,255,0.08);
    --stroke: rgba(255,255,255,0.12);
  }
  
  .activeRunPage {
    min-height: 100vh;
    background: 
      radial-gradient(1200px 800px at 50% 0%, rgba(138,43,226,0.25), transparent 60%),
      radial-gradient(900px 600px at 80% 100%, rgba(191,255,0,0.12), transparent 55%),
      var(--bg);
    color: rgba(255,255,255,0.92);
    padding-bottom: 140px;
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
    animation: backgroundShift 30s ease-in-out infinite;
  }
  
  @keyframes backgroundShift {
    0%, 100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }
  
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 16px;
  }
  
  .backBtn {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    border: 1px solid var(--stroke);
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(10px);
    color: rgba(255,255,255,0.92);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  
  .statusChip {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 999px;
    border: 1px solid var(--stroke);
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(10px);
    font-size: 12px;
    color: rgba(255,255,255,0.62);
  }
  
  .statusChip.ready {
    border-color: rgba(191,255,0,0.25);
    background: rgba(191,255,0,0.08);
    color: var(--neon);
  }
  
  .statusDot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }
  
  .statusChip.ready .statusDot {
    animation: pulse 2s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  
  .gameHud {
    position: fixed;
    top: 80px;
    right: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 100;
  }
  
  .hudItem {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 14px;
    border-radius: 999px;
    background: rgba(10,10,10,0.85);
    border: 1px solid rgba(191,255,0,0.30);
    backdrop-filter: blur(20px);
    box-shadow: 0 0 24px rgba(191,255,0,0.35), 0 0 0 1px rgba(191,255,0,0.15) inset;
  }
  
  .hudIcon {
    filter: drop-shadow(0 0 10px rgba(191,255,0,0.5));
    font-size: 16px;
  }
  
  .hudVal {
    font-weight: 900;
    color: var(--neon);
    font-size: 13px;
    text-shadow: 0 0 12px rgba(191,255,0,0.6);
  }
  
  .timerSection {
    padding: 16px 16px 8px;
    text-align: center;
  }
  
  .timerValue {
    font-size: 56px;
    font-weight: 900;
    color: var(--neon);
    text-shadow: 0 0 30px rgba(191,255,0,0.5);
    animation: timerPulse 2s ease-in-out infinite;
  }
  
  @keyframes timerPulse {
    0%, 100% { text-shadow: 0 0 30px rgba(191,255,0,0.5); }
    50% { text-shadow: 0 0 50px rgba(191,255,0,0.7); }
  }
  
  .mapSection {
    position: relative;
    padding: 0 16px;
    margin-bottom: 14px;
  }
  
  .mapOverlay {
    position: absolute;
    inset: 16px;
    background: rgba(10,10,10,0.30);
    z-index: 1;
    pointer-events: none;
    border-radius: 24px;
  }
  
  .mapWrap {
    height: 220px;
    border-radius: 24px;
    overflow: hidden;
    border: 1px solid rgba(191,255,0,0.20);
    box-shadow: 
      0 0 0 1px rgba(138,43,226,0.12) inset,
      0 0 30px rgba(191,255,0,0.15),
      0 8px 32px rgba(0,0,0,0.40);
    position: relative;
    filter: saturate(0.75);
  }
  
  .metricsGrid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    padding: 0 16px;
    margin-bottom: 12px;
  }
  
  .metricCard {
    background: rgba(255,255,255,0.10);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 16px;
    padding: 12px 14px;
    min-height: 75px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    box-shadow: 
      0 0 0 1px rgba(191,255,0,0.12) inset,
      0 0 20px rgba(191,255,0,0.08),
      0 8px 24px rgba(0,0,0,0.35);
  }
  
  .heartCard {
    grid-column: 1 / -1;
    min-height: 85px;
  }
  
  .heartTop {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  
  .heartIcon {
    width: 18px;
    height: 18px;
    color: var(--neon);
    animation: heartbeat 0.9s ease-in-out infinite;
    filter: drop-shadow(0 0 8px rgba(191,255,0,0.4));
  }
  
  @keyframes heartbeat {
    0%, 100% { transform: scale(1); }
    7% { transform: scale(1.15); }
    14% { transform: scale(1); }
    21% { transform: scale(1.08); }
    28% { transform: scale(1); }
  }
  
  .metricLabel {
    font-size: 10px;
    letter-spacing: 0.14em;
    color: rgba(255,255,255,0.45);
    margin-bottom: 6px;
  }
  
  .metricValue {
    font-size: 28px;
    font-weight: 900;
    color: var(--neon);
    line-height: 1;
  }
  
  .metricUnit {
    font-size: 13px;
    font-weight: 700;
    color: rgba(255,255,255,0.55);
    margin-left: 3px;
  }
  
  .heartPulseBar {
    margin-top: 10px;
    height: 5px;
    border-radius: 999px;
    background: rgba(255,255,255,0.08);
    overflow: hidden;
  }
  
  .heartPulse {
    height: 100%;
    background: linear-gradient(90deg, var(--neon), var(--purple));
    border-radius: 999px;
    box-shadow: 0 0 14px rgba(191,255,0,0.6);
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    animation: pulseGlow 2s ease-in-out infinite;
  }
  
  @keyframes pulseGlow {
    0%, 100% { box-shadow: 0 0 14px rgba(191,255,0,0.6); }
    50% { box-shadow: 0 0 20px rgba(191,255,0,0.8); }
  }
  
  .controls {
    display: flex;
    gap: 16px;
    justify-content: center;
    padding: 0 16px 100px;
    margin-top: 16px;
  }
  
  .ctrlBtn {
    position: relative;
    width: 68px;
    height: 68px;
    border-radius: 50%;
    border: 2px solid var(--stroke);
    background: rgba(10,10,10,0.85);
    backdrop-filter: blur(20px);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    cursor: pointer;
    transition: all 0.2s ease;
    overflow: hidden;
  }
  
  .ctrlIcon {
    position: relative;
    z-index: 2;
  }
  
  .pauseBtn {
    border-color: rgba(255,255,255,0.20);
    color: rgba(255,255,255,0.72);
  }
  
  .pauseBtn:active {
    transform: scale(0.95);
  }
  
  .resumeBtn, .startBtn {
    border-color: rgba(191,255,0,0.40);
    background: linear-gradient(135deg, rgba(191,255,0,0.18), rgba(138,43,226,0.12));
    color: var(--neon);
    box-shadow: 
      0 0 40px rgba(191,255,0,0.4),
      0 0 0 0 rgba(191,255,0,0.6);
    animation: buttonPulse 2.5s ease-in-out infinite, buttonScale 3s ease-in-out infinite;
  }
  
  @keyframes buttonPulse {
    0%, 100% {
      box-shadow: 
        0 0 40px rgba(191,255,0,0.4),
        0 0 0 0 rgba(191,255,0,0.6);
    }
    50% {
      box-shadow: 
        0 0 50px rgba(191,255,0,0.5),
        0 0 0 12px rgba(191,255,0,0);
    }
  }
  
  @keyframes buttonScale {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.03); }
  }
  
  .resumeBtn:active, .startBtn:active {
    transform: scale(0.95);
    animation: none;
  }
  
  .finishBtn {
    border-color: rgba(255,50,50,0.45);
    background: rgba(255,50,50,0.15);
    color: rgba(255,90,90,1);
    box-shadow: 
      0 0 35px rgba(255,50,50,0.35),
      0 4px 16px rgba(0,0,0,0.40);
  }
  
  .holdProgress {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 100%;
    background: linear-gradient(180deg, rgba(255,50,50,0.40), rgba(255,80,80,0.60));
    transition: width 0.1s linear;
    z-index: 1;
  }
  
  .pauseBtn {
    border-color: rgba(255,255,255,0.25);
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.82);
  }
  
  @media (max-width: 420px) {
    .timerValue { font-size: 48px; }
    .metricValue { font-size: 24px; }
    .ctrlBtn { width: 62px; height: 62px; }
    .metricsGrid { gap: 8px; }
    .metricCard { padding: 10px 12px; min-height: 70px; }
  }
`;