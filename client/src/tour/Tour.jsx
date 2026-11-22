import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext.jsx';
import TOURS from './tours.js';

/*
  Bubble guide ("coach marks").
  - Each page calls usePageTour('<id>') → that page's tour starts automatically the first time
    this user (or a guest) visits it, and the floating "?" button can replay it anytime.
  - Steps point at elements by CSS selector; steps whose element is missing or hidden
    (e.g. inside the closed mobile menu) are skipped automatically.
*/

const TourCtx = createContext(null);
const seenKey = (uid, id) => `ah_tour_${uid || 'guest'}_${id}`;
const safeGet = (k) => { try { return localStorage.getItem(k); } catch { return '1'; } };
const safeSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };

// checkOpacity=false ignores fade-in state (hover-only buttons are revealed once the tour starts)
const isVisible = (el, checkOpacity = true) => {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return false;
  const st = getComputedStyle(el);
  return st.visibility !== 'hidden' && st.display !== 'none' && (!checkOpacity || Number(st.opacity) > 0.05);
};

export function TourProvider({ children }) {
  const { user, ready } = useAuth();
  const [pageTour, setPageTour] = useState(null); // tour id registered by the current page
  const [active, setActive] = useState(null);     // { id, steps }
  const uid = user?.id;
  const role = user?.role || 'guest';

  const stepsFor = useCallback((id) => (TOURS[id] || []).filter((s) => !s.roles || s.roles.includes(role)), [role]);

  const start = useCallback((id) => {
    // drop steps whose element is on the page but hidden for this screen size
    // (☰ on a computer, menu items on a phone) so "Next (2/7)" counts are exact.
    // Elements not rendered yet (still loading) are kept; the bubble waits for them.
    const steps = stepsFor(id).filter((s) => {
      if (!s.target) return true;
      const all = [...document.querySelectorAll(s.target)];
      return !all.length || all.some((el) => isVisible(el, false));
    });
    if (steps.length) setActive({ id, steps });
  }, [stepsFor]);

  const finish = useCallback(() => {
    if (active) safeSet(seenKey(uid, active.id), '1');
    setActive(null);
  }, [active, uid]);

  // auto-start a page's tour the first time it's seen
  useEffect(() => {
    if (!ready || !pageTour || active) return undefined;
    if (safeGet(seenKey(uid, pageTour))) return undefined;
    const t = setTimeout(() => start(pageTour), 900); // let the page render/load first
    return () => clearTimeout(t);
    // `active` is a dependency so a page's tour still starts after a previous page's tour closes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageTour, ready, uid, active]);

  // while touring, reveal hover-only controls (e.g. the 🔍 zoom button) so bubbles can point at them
  useEffect(() => {
    document.body.classList.toggle('touring', !!active);
    return () => document.body.classList.remove('touring');
  }, [active]);

  // close a running tour when the user navigates to another page
  useEffect(() => { setActive((a) => (a && a.id !== pageTour ? null : a)); }, [pageTour]);

  const resetAll = useCallback(() => {
    try {
      Object.keys(localStorage).filter((k) => k.startsWith(`ah_tour_${uid || 'guest'}_`)).forEach((k) => localStorage.removeItem(k));
    } catch { /* ignore */ }
  }, [uid]);

  return (
    <TourCtx.Provider value={{ pageTour, setPageTour, start, resetAll, active }}>
      {children}
      {pageTour && TOURS[pageTour] && (
        <button className="tour-help" data-tour="help" onClick={() => start(pageTour)} title="Show me around this page" aria-label="Show the guide for this page">
          <span>?</span>
        </button>
      )}
      {active && <TourBubbles key={active.id} steps={active.steps} user={user} onClose={finish} />}
    </TourCtx.Provider>
  );
}

export const useTour = () => useContext(TourCtx);

/** Call at the top of a page component to give that page a guide. */
export function usePageTour(id) {
  const ctx = useContext(TourCtx);
  useEffect(() => {
    ctx?.setPageTour(id);
    return () => ctx?.setPageTour((cur) => (cur === id ? null : cur));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
}

function TourBubbles({ steps, user, onClose }) {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);   // which way we're moving (for skipping missing targets)
  const [rect, setRect] = useState(null);
  const [pos, setPos] = useState(null);
  const bubble = useRef(null);
  const step = steps[i];
  const centered = !step.target;

  // find the target (wait briefly for data to load), skip it if it never shows up
  const [el, setEl] = useState(null);
  useEffect(() => {
    setEl(null);
    setRect(null);
    if (centered) return undefined;
    let tries = 0;
    let timer;
    const skip = () => {
      // not on screen for this user → skip in the direction we were going
      const next = i + dir;
      if (next >= 0 && next < steps.length) setI(next);
      else onClose();
    };
    const look = () => {
      const all = [...document.querySelectorAll(step.target)];
      const found = all.find(isVisible);
      if (found) {
        found.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
        timer = setTimeout(() => setEl(found), 380);
      } else if (all.length && tries >= 1) {
        skip(); // exists but hidden (e.g. ☰ on desktop, menu items on a phone) → skip right away
      } else if (tries++ < 12) {
        timer = setTimeout(look, 150); // not rendered yet (data loading) → wait a moment
      } else {
        skip();
      }
    };
    look();
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  // keep spotlight + bubble glued to the element while scrolling/resizing
  const measure = useCallback(() => {
    if (centered) return;
    if (!el || !el.isConnected) return;
    const r = el.getBoundingClientRect();
    const pad = 6;
    setRect({ top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 });
  }, [el, centered]);

  useEffect(() => {
    measure();
    let raf;
    const on = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure); };
    window.addEventListener('resize', on);
    window.addEventListener('scroll', on, true);
    return () => { window.removeEventListener('resize', on); window.removeEventListener('scroll', on, true); cancelAnimationFrame(raf); };
  }, [measure]);

  // place the bubble below/above/beside the spotlight, clamped to the screen
  useLayoutEffect(() => {
    const b = bubble.current;
    if (!b) return;
    const bw = b.offsetWidth;
    const bh = b.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gap = 14;
    if (centered || !rect) { setPos({ top: vh / 2 - bh / 2, left: vw / 2 - bw / 2, place: 'center' }); return; }
    const space = { bottom: vh - (rect.top + rect.height), top: rect.top, right: vw - (rect.left + rect.width), left: rect.left };
    let place = step.place || (space.bottom >= bh + gap ? 'bottom' : space.top >= bh + gap ? 'top' : space.right >= bw + gap ? 'right' : space.left >= bw + gap ? 'left' : 'bottom');
    if (place === 'bottom' && space.bottom < bh + gap && space.top >= bh + gap) place = 'top';
    if (place === 'top' && space.top < bh + gap && space.bottom >= bh + gap) place = 'bottom';
    let top;
    let left;
    if (place === 'bottom' || place === 'top') {
      top = place === 'bottom' ? rect.top + rect.height + gap : rect.top - bh - gap;
      left = rect.left + rect.width / 2 - bw / 2;
    } else {
      top = rect.top + rect.height / 2 - bh / 2;
      left = place === 'right' ? rect.left + rect.width + gap : rect.left - bw - gap;
    }
    left = Math.max(12, Math.min(left, vw - bw - 12));
    top = Math.max(12, Math.min(top, vh - bh - 12));
    // arrow points at the element's centre
    const arrow = place === 'bottom' || place === 'top'
      ? Math.max(18, Math.min(rect.left + rect.width / 2 - left, bw - 18))
      : Math.max(18, Math.min(rect.top + rect.height / 2 - top, bh - 18));
    setPos({ top, left, place, arrow });
  }, [rect, centered, i, step.place]);

  const go = (d) => {
    const n = i + d;
    if (n < 0) return;
    if (n >= steps.length) { onClose(); return; }
    setDir(d);
    setI(n);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === 'Enter') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const ready = centered || rect;
  const text = typeof step.text === 'function' ? step.text(user) : step.text;
  const title = typeof step.title === 'function' ? step.title(user) : step.title;

  return createPortal(
    <div className="tour-layer" role="dialog" aria-modal="true" aria-label="Guide">
      {centered || !rect ? (
        <div className="tour-dim" onClick={() => {}} />
      ) : (
        <div className="tour-spot" style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }} />
      )}
      <div
        ref={bubble}
        className={`tour-bubble place-${pos?.place || 'center'} ${ready && pos ? 'show' : ''}`}
        style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, '--arrow': `${pos?.arrow ?? 0}px` }}
        key={i}
      >
        {step.emoji && <div className="tb-emoji">{step.emoji}</div>}
        <div className="tb-title">{title}</div>
        <div className="tb-text">{text}</div>
        <div className="tb-foot">
          <div className="tb-dots" aria-label={`Step ${i + 1} of ${steps.length}`}>
            {steps.map((_, k) => <span key={k} className={k === i ? 'on' : k < i ? 'done' : ''} />)}
          </div>
          <div className="tb-btns">
            {i === 0
              ? <button className="tb-skip" onClick={onClose}>Skip tour</button>
              : <button className="tb-back" onClick={() => go(-1)}>Back</button>}
            <button className="tb-next" onClick={() => go(1)} autoFocus>
              {i === steps.length - 1 ? 'Got it! 🎉' : `Next (${i + 1}/${steps.length})`}
            </button>
          </div>
        </div>
        {i > 0 && <button className="tb-close" onClick={onClose} aria-label="Close guide">✕</button>}
      </div>
    </div>,
    document.body
  );
}
