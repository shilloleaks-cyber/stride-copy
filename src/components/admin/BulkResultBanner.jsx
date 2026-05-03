import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export default function BulkResultBanner({ result, onClose, autoDismissMs = 6000 }) {
  useEffect(() => {
    if (!result) return;
    const t = setTimeout(onClose, autoDismissMs);
    return () => clearTimeout(t);
  }, [result, onClose, autoDismissMs]);

  if (!result) return null;

  const isError = result.isError;
  const accent  = isError ? 'rgba(255,120,50,1)' : '#B6FF00';
  const bg      = isError ? 'rgba(255,80,0,0.09)'  : 'rgba(182,255,0,0.07)';
  const border  = isError ? 'rgba(255,80,0,0.28)'  : 'rgba(182,255,0,0.25)';
  const Icon    = isError ? AlertTriangle : CheckCircle2;

  return (
    <div style={{
      margin: '0 16px',
      padding: '14px 16px',
      borderRadius: 16,
      background: bg,
      border: `1px solid ${border}`,
      display: 'flex', alignItems: 'flex-start', gap: 12,
    }}>
      <Icon style={{ width: 18, height: 18, color: accent, flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {result.lines.map((line, i) => (
          <p key={i} style={{
            margin: i === 0 ? 0 : '4px 0 0',
            fontSize: i === 0 ? 13 : 12,
            fontWeight: i === 0 ? 800 : 500,
            color: i === 0 ? accent : 'rgba(255,255,255,0.45)',
            lineHeight: 1.4,
          }}>{line}</p>
        ))}
      </div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0 }}>
        <X style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.3)' }} />
      </button>
    </div>
  );
}