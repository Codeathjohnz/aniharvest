import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { imageUrl } from '../api.js';

const MIN = 1;
const MAX = 5;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** Full-screen viewer: wheel / buttons / double-click / pinch to zoom, drag to pan. */
export function Lightbox({ product, onClose }) {
  const src = imageUrl(product.image);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const pointers = useRef(new Map());
  const last = useRef(null); // last drag point / pinch distance

  const zoomTo = (s) => {
    const n = clamp(Math.round(s * 100) / 100, MIN, MAX);
    setScale(n);
    if (n === 1) setPos({ x: 0, y: 0 });
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setScale((s) => clamp(s + 0.5, MIN, MAX));
      if (e.key === '-') setScale((s) => { const n = clamp(s - 0.5, MIN, MAX); if (n === 1) setPos({ x: 0, y: 0 }); return n; });
      if (e.key === '0') { setScale(1); setPos({ x: 0, y: 0 }); }
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const onWheel = (e) => zoomTo(scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15));

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    last.current = null;
  };
  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    if (pts.length === 2) {
      // pinch zoom
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (last.current?.dist) zoomTo(scale * (d / last.current.dist));
      last.current = { dist: d };
    } else if (pts.length === 1 && scale > 1) {
      // drag to pan
      if (last.current?.x !== undefined) {
        const dx = e.clientX - last.current.x;
        const dy = e.clientY - last.current.y;
        setPos((p) => ({ x: p.x + dx / scale, y: p.y + dy / scale }));
      }
      last.current = { x: e.clientX, y: e.clientY };
    }
  };
  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId);
    last.current = null;
  };

  // portal to <body> so animated/transformed parents (cards, reveals) can't trap the fixed overlay
  return createPortal(
    <div className="lightbox" onClick={onClose} role="dialog" aria-label={`${product.name} picture`}>
      <div className="lb-top" onClick={(e) => e.stopPropagation()}>
        <b>{product.name}</b>
        <div className="lb-controls">
          <button onClick={() => zoomTo(scale - 0.5)} disabled={scale <= MIN} title="Zoom out (−)">−</button>
          <span>{Math.round(scale * 100)}%</span>
          <button onClick={() => zoomTo(scale + 0.5)} disabled={scale >= MAX} title="Zoom in (+)">+</button>
          <button onClick={() => zoomTo(1)} title="Reset (0)">⟲</button>
          <button className="lb-close" onClick={onClose} title="Close (Esc)">✕</button>
        </div>
      </div>

      <div
        className={`lb-stage ${scale > 1 ? 'zoomed' : ''}`}
        onClick={(e) => e.stopPropagation()}
        onWheel={onWheel}
        onDoubleClick={() => zoomTo(scale > 1 ? 1 : 2.5)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="lb-content" style={{ transform: `scale(${scale}) translate(${pos.x}px, ${pos.y}px)` }}>
          {src ? <img src={src} alt={product.name} draggable="false" /> : <span className="lb-emoji">{product.emoji || '🌱'}</span>}
        </div>
      </div>

      <p className="lb-hint">Scroll, pinch or double-click to zoom · drag to move · Esc to close</p>
    </div>,
    document.body
  );
}

/** Product picture with hover magnifier; click opens the full-screen Lightbox. */
export default function ImageZoom({ product }) {
  const src = imageUrl(product.image);
  const [origin, setOrigin] = useState('50% 50%');
  const [hover, setHover] = useState(false);
  const [open, setOpen] = useState(false);

  const move = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
  };

  return (
    <>
      <button
        type="button"
        className={`zoom-box product-img big ${hover ? 'hovering' : ''}`}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onMouseMove={move}
        onClick={() => setOpen(true)}
        aria-label={`Zoom ${product.name} picture`}
      >
        <div className="zoom-inner" style={{ transformOrigin: origin }}>
          {src ? <img src={src} alt={product.name} draggable="false" /> : <span className="product-emoji">{product.emoji || '🌱'}</span>}
        </div>
        <span className="zoom-badge">🔍 Click to zoom</span>
      </button>
      {open && <Lightbox product={product} onClose={() => setOpen(false)} />}
    </>
  );
}
