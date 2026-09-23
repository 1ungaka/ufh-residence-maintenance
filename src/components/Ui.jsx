/** Shared presentational pieces: emblem, badges, stats, alerts, timeline. */
import { useEffect, useRef, useState } from 'react';
import { formatDateTime } from '../utils/format.js';

/** University crest, served from public/images/UFH-Logos.png (134x110). `size` is the rendered height. */
export function Emblem({ size = 36 }) {
  return (
    <img
      className="emblem"
      src="/images/UFH-Logos.png"
      width={Math.round((size * 134) / 110)}
      height={size}
      alt="University of Fort Hare"
      style={{ objectFit: 'contain' }}
    />
  );
}

const STATUS_CLASS = {
  Submitted: 'badge-submitted',
  Assigned: 'badge-assigned',
  'In Progress': 'badge-in-progress',
  Completed: 'badge-completed',
  Closed: 'badge-closed'
};

// Supabase stores lower-case status codes; show them with the labels students know.
const STATUS_LABEL = {
  logged: 'Submitted',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  resolved: 'Completed',
  closed: 'Closed'
};

export function statusLabel(status) {
  return STATUS_LABEL[status] || status;
}

export function StatusBadge({ status }) {
  const label = statusLabel(status);
  return (
    <span className={`badge ${STATUS_CLASS[label] || 'badge-submitted'}`}>
      <span className="dot" />
      {label}
    </span>
  );
}

export function UrgencyLabel({ urgency }) {
  if (!urgency) return <span className="urgency">-</span>;
  return <span className={`urgency urgency-${urgency.toLowerCase()}`}>{urgency}</span>;
}

export function Alert({ type = 'info', children }) {
  if (!children) return null;
  return (
    <div className={`alert alert-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

/** Confirmation that slides in from the corner and clears itself. */
export function Toast({ message, type = 'success', onDone }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => onDone && onDone(), 4200);
    return () => clearTimeout(timer);
  }, [message, onDone]);

  if (!message) return null;
  return (
    <div className={`toast ${type === 'error' ? 'is-error' : ''}`} role="status">
      <span>{message}</span>
    </div>
  );
}

export function Empty({ title, children }) {
  return (
    <div className="empty">
      {title && <h3>{title}</h3>}
      {children}
    </div>
  );
}

/** Counts up to the value once, so the dashboard feels alive on load. */
function useCountUp(target, duration = 650) {
  const [value, setValue] = useState(0);
  const frame = useRef();

  useEffect(() => {
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !target) {
      setValue(target || 0);
      return undefined;
    }
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration]);

  return value;
}

export function Stat({ value, label, tone = '' }) {
  const shown = useCountUp(Number(value) || 0);
  return (
    <div className={`stat ${tone}`}>
      <div className="value">{shown}</div>
      <div className="label">{label}</div>
    </div>
  );
}

export function SkeletonStats({ count = 4 }) {
  return (
    <div className="stat-grid">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton skeleton-stat" />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 4 }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="skeleton skeleton-row" />
      ))}
    </div>
  );
}

export function Loading({ label = 'Loading' }) {
  return <p className="hint">{label}...</p>;
}

/** Update history on the request page; entries fade in one after another. */
/**
 * Each update: { id, created_at, status (or null for a note), headline, text,
 * author_name, author_is_student }.
 */
export function Timeline({ updates }) {
  if (!updates || updates.length === 0) {
    return <p className="hint">No updates yet.</p>;
  }
  return (
    <ol className="timeline">
      {updates.map((update, index) => (
        <li
          key={update.id}
          className={[
            update.status ? `is-status status-${update.status}` : 'is-note',
            update.author_is_student ? 'from-student' : ''
          ].join(' ')}
          style={{ animationDelay: `${Math.min(index * 70, 420)}ms` }}
        >
          <div className="headline">{update.headline}</div>
          {update.text && <p className="what">{update.text}</p>}
          <div className="who">
            {update.author_name} &middot; {formatDateTime(update.created_at)}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ icons */

const iconProps = {
  width: 17,
  height: 17,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
};

export const Icons = {
  dashboard: () => (
    <svg {...iconProps}><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>
  ),
  list: () => (
    <svg {...iconProps}><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><circle cx="3.5" cy="6" r="1.2" /><circle cx="3.5" cy="12" r="1.2" /><circle cx="3.5" cy="18" r="1.2" /></svg>
  ),
  plus: () => (
    <svg {...iconProps}><circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
  ),
  tools: () => (
    <svg {...iconProps}><path d="M14.7 6.3a4 4 0 0 0 5 5L14 17l-3 3-3-3 3-3Z" /><path d="m7 7 3 3" /></svg>
  ),
  user: () => (
    <svg {...iconProps}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-3.6 3.6-6 8-6s8 2.4 8 6" /></svg>
  )
};