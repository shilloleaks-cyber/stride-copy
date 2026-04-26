import React from 'react';
import { X, Download, CheckSquare } from 'lucide-react';

/**
 * Sticky bar shown when rows are selected.
 * Props:
 *   count         – number of selected rows
 *   onClear       – () => void   clear selection
 *   actions       – [{ label, icon, onClick, color, disabled }]
 *   exportLabel   – string (default 'Export selected')
 *   onExport      – () => void
 */
export default function SelectionBar({ count, onClear, actions = [], onExport, exportLabel = 'Export selected' }) {
  if (count === 0) return null;

  return (
    <div style={{
      margin: '0 16px',
      padding: '10px 14px',
      borderRadius: 14,
      background: 'rgba(138,43,226,0.12)',
      border: '1px solid rgba(138,43,226,0.3)',
      display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
    }}>
      {/* Count + clear */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <CheckSquare style={{ width: 14, height: 14, color: 'rgba(190,140,255,1)' }} />
        <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(190,140,255,1)' }}>
          {count} selected
        </span>
        <button onClick={onClear}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2 }}
          title="Clear selection"
        >
          <X style={{ width: 13, height: 13, color: 'rgba(190,140,255,0.6)' }} />
        </button>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 18, background: 'rgba(138,43,226,0.3)' }} />

      {/* Action buttons */}
      {actions.map((action, i) => (
        <button key={i} onClick={action.onClick} disabled={action.disabled}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 11px', borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: 'pointer',
            background: 'rgba(138,43,226,0.15)', border: '1px solid rgba(138,43,226,0.3)',
            color: action.color || 'rgba(190,140,255,1)',
            opacity: action.disabled ? 0.5 : 1,
          }}
        >
          {action.icon && <action.icon style={{ width: 11, height: 11 }} />}
          {action.label}
        </button>
      ))}

      {/* Export selected */}
      {onExport && (
        <button onClick={onExport}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 11px', borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: 'pointer',
            background: 'rgba(138,43,226,0.15)', border: '1px solid rgba(138,43,226,0.3)',
            color: 'rgba(190,140,255,0.85)',
          }}
        >
          <Download style={{ width: 11, height: 11 }} />
          {exportLabel}
        </button>
      )}
    </div>
  );
}