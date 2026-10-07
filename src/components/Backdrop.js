import React from 'react';
import { PATHS } from './Icon';

// Decorative, slowly floating education / attendance icons behind the app.
// Pure CSS transforms, very low opacity, disabled for prefers-reduced-motion.
const ICONS = ['qr', 'cap', 'book', 'clock', 'checkCircle', 'calendar', 'edit', 'scan', 'users', 'chart', 'pin', 'zap'];

// x / y in %, size in px, animation duration + delay in seconds, rotation in deg
const ITEMS = [
  { i: 'qr',          x: 4,  y: 14, s: 110, d: 16, dl: 0,  r: -12 },
  { i: 'cap',         x: 88, y: 10, s: 120, d: 18, dl: 2,  r: 10 },
  { i: 'book',        x: 14, y: 68, s: 90,  d: 14, dl: 4,  r: 8 },
  { i: 'clock',       x: 76, y: 60, s: 84,  d: 13, dl: 1,  r: -6 },
  { i: 'checkCircle', x: 52, y: 84, s: 72,  d: 12, dl: 3,  r: 0 },
  { i: 'calendar',    x: 38, y: 6,  s: 70,  d: 15, dl: 5,  r: 14 },
  { i: 'edit',        x: 93, y: 40, s: 64,  d: 17, dl: 2,  r: -18 },
  { i: 'scan',        x: 27, y: 38, s: 60,  d: 11, dl: 6,  r: 6 },
  { i: 'users',       x: 62, y: 28, s: 78,  d: 19, dl: 1,  r: -8 },
  { i: 'chart',       x: 6,  y: 90, s: 66,  d: 14, dl: 7,  r: 12 },
  { i: 'pin',         x: 84, y: 86, s: 58,  d: 12, dl: 4,  r: -14 },
  { i: 'zap',         x: 45, y: 52, s: 48,  d: 10, dl: 8,  r: 20 },
  { i: 'qr',          x: 70, y: 4,  s: 44,  d: 13, dl: 9,  r: 25 },
  { i: 'cap',         x: 30, y: 92, s: 52,  d: 16, dl: 3,  r: -22 },
];

// tone: 'brand' (coloured icons on the page background) or 'light' (white icons on a gradient).
// inset: position inside the parent panel instead of covering the whole viewport.
function Backdrop({ tone = 'brand', inset = false }) {
  return (
    <div className={`backdrop backdrop-${tone}${inset ? ' inset' : ''}`} aria-hidden="true">
      <div className="blob blob-a" />
      <div className="blob blob-b" />
      <div className="blob blob-c" />
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          {ICONS.map((name) => (
            <symbol key={name} id={`bd-${name}`} viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              {PATHS[name]}
            </symbol>
          ))}
        </defs>
      </svg>
      {ITEMS.map((it, idx) => (
        <svg
          key={idx} className="fl" width={it.s} height={it.s}
          style={{
            left: `${it.x}%`, top: `${it.y}%`,
            '--d': `${it.d}s`, '--dl': `-${it.dl}s`, '--r': `${it.r}deg`,
          }}
        >
          <use href={`#bd-${it.i}`} />
        </svg>
      ))}
      <div className="grid-lines" />
    </div>
  );
}

export default Backdrop;
