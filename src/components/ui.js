import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Icon from './Icon';
import { subscribeStatus } from '../api/axios';

// ---------- formatting helpers ----------
export const THRESHOLD = 75;

export function pctTone(p, hasSessions = true) {
  if (!hasSessions || p === null || p === undefined) return 'muted';
  const n = Number(p);
  if (n >= THRESHOLD) return 'success';
  if (n >= 50) return 'warning';
  return 'danger';
}

export function fmtPct(p) {
  if (p === null || p === undefined) return '—';
  const n = Number(p);
  return `${Number.isInteger(n) ? n : n.toFixed(1)}%`;
}

export function fmtDate(d, opts) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, opts || { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function fmtDateTime(d) {
  if (!d) return '—';
  return `${fmtDate(d, { day: 'numeric', month: 'short' })}, ${fmtTime(d)}`;
}

export function timeAgo(d) {
  if (!d) return '';
  const s = Math.round((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 45) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const days = Math.round(h / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return fmtDate(d);
}

export function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
}

// First name for greetings, skipping titles like "Dr." / "Md." / "Prof."
const TITLES = /^(dr|md|mr|mrs|ms|miss|prof|professor|engr|eng|sk|sheikh|hon|sir|mohd|mohammad|muhammad)\.?$/i;
export function firstName(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const pick = parts.find((p) => !TITLES.test(p.replace(/[.,]/g, '')));
  return (pick || parts[0] || '').replace(/[.,]+$/, '');
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ---------- small components ----------
export function Spinner({ large }) {
  return <span className={`spinner${large ? ' lg' : ''}`} />;
}

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="center-load">
      <Spinner large />
      <span className="small">{label}</span>
    </div>
  );
}

export function Empty({ icon = 'info', title, text, action }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon name={icon} size={26} /></div>
      {title && <h4>{title}</h4>}
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function Stat({ icon, tone = 'brand', value, label }) {
  return (
    <div className="stat">
      <div className={`stat-icon tone-${tone}`}><Icon name={icon} size={22} /></div>
      <div>
        <div className="stat-value">{value ?? '—'}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

const TONE_COLOR = {
  success: 'var(--success)', warning: 'var(--warning)', danger: 'var(--danger)',
  brand: 'var(--brand)', muted: 'var(--muted)',
};

export function Progress({ value, tone = 'brand' }) {
  const w = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="progress">
      <span style={{ width: `${w}%`, background: tone === 'brand' ? 'var(--gradient)' : TONE_COLOR[tone] }} />
    </div>
  );
}

export function PctCell({ value, total }) {
  const has = Number(total) > 0;
  const tone = pctTone(value, has);
  return (
    <div className="pct-cell">
      <Progress value={has ? value : 0} tone={tone} />
      <b style={{ color: TONE_COLOR[tone] }}>{has ? fmtPct(value) : '—'}</b>
    </div>
  );
}

export function PctPill({ value, total }) {
  const has = Number(total) > 0;
  return <span className={`pct-pill ${pctTone(value, has)}`}>{has ? fmtPct(value) : '—'}</span>;
}

export function Ring({ value, size = 120, stroke = 11, label, tone }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const t = tone || pctTone(value);
  const color = TONE_COLOR[t] || 'var(--brand)';
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-soft)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (v / 100) * c}
          style={{ transition: 'stroke-dashoffset .8s ease' }}
        />
      </svg>
      <div className="ring-label">
        <b>{value === null || value === undefined ? '—' : fmtPct(value)}</b>
        {label && <span>{label}</span>}
      </div>
    </div>
  );
}

export function Alert({ type = 'error', children }) {
  if (!children) return null;
  const icon = { error: 'alert', success: 'checkCircle', info: 'info', warning: 'alert' }[type];
  return <div className={`alert alert-${type}`}><Icon name={icon} /> <div>{children}</div></div>;
}

export function Modal({ title, onClose, children, footer, wide }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal${wide ? ' wide' : ''}`} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmModal({ title, text, confirmLabel = 'Confirm', danger, busy, onConfirm, onClose }) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={(
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={busy}>
            {busy && <Spinner />} {confirmLabel}
          </button>
        </>
      )}
    >
      <p className="text-2">{text}</p>
    </Modal>
  );
}

// ---------- toasts ----------
const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <Icon name={t.type === 'error' ? 'xCircle' : t.type === 'info' ? 'info' : 'checkCircle'} />
            <div>{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

// ---------- server status banner ----------
export function ServerBanner() {
  const [status, setStatus] = useState('online');
  useEffect(() => subscribeStatus(setStatus), []);
  if (status === 'online') return null;
  if (status === 'waking') {
    return (
      <div className="server-banner">
        <Spinner /> Connecting to the server… this can take a few seconds the first time.
      </div>
    );
  }
  return (
    <div className="server-banner offline">
      <Icon name="wifiOff" /> Can’t reach the server right now. Retrying automatically…
    </div>
  );
}

// ---------- CSV ----------
export function downloadCSV(filename, headers, rows) {
  const esc = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------- data hook ----------
export function useFetch(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fn();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
}
