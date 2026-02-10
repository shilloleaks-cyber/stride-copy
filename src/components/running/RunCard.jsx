import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';

export default function RunCard({ run, onOpen }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onOpen) {
      onOpen(run);
    } else {
      navigate(createPageUrl(`RunDetails?id=${run.id}`));
    }
  };

  // Helper: format duration
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper: calculate pace from duration + distance
  const calcPaceMinPerKm = (run) => {
    const dist = Number(run?.distance_km);
    const secs = Number(run?.duration_seconds);

    if (Number.isFinite(dist) && dist > 0 && Number.isFinite(secs) && secs > 0) {
      return (secs / 60) / dist;
    }

    const pace = Number(run?.pace_min_per_km);
    if (Number.isFinite(pace) && pace > 0) return pace;

    return null;
  };

  // Helper: format pace
  const formatPace = (paceMinPerKm) => {
    const p = Number(paceMinPerKm);
    if (!Number.isFinite(p) || p <= 0) return '--:--';

    let mins = Math.floor(p);
    let secs = Math.round((p - mins) * 60);

    if (secs === 60) { mins += 1; secs = 0; }

    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const pace = calcPaceMinPerKm(run);

  return (
    <button className="runCard" onClick={handleClick}>
      <div className="runHeader">
        <div>
          <div className="runDate">{format(new Date(run.start_time), 'EEEE, MMMM d')}</div>
          <div className="runTime">{format(new Date(run.start_time), 'h:mm a')}</div>
        </div>
        <div className="chev">›</div>
      </div>

      <div className="runStats">
        <div className="miniStat">
          <span className="miniIcon green">📍</span>
          <div>
            <div className="miniVal">{(run.distance_km || 0).toFixed(2)}</div>
            <div className="miniLbl">km</div>
          </div>
        </div>
        <div className="miniStat">
          <span className="miniIcon blue">⏱</span>
          <div>
            <div className="miniVal">{formatDuration(run.duration_seconds)}</div>
            <div className="miniLbl">time</div>
          </div>
        </div>
        <div className="miniStat">
          <span className="miniIcon purple">⚡</span>
          <div>
            <div className="miniVal">{formatPace(pace)}</div>
            <div className="miniLbl">/km</div>
          </div>
        </div>
        <div className="miniStat">
          <span className="miniIcon red">❤</span>
          <div>
            <div className="miniVal">{run.avg_heart_rate || 0}</div>
            <div className="miniLbl">bpm</div>
          </div>
        </div>
      </div>
    </button>
  );
}