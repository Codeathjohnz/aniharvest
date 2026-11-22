import { useMemo, useRef, useState } from 'react';

// Compact peso for axes/tiles: ₱950 · ₱12.9K · ₱1.2M
export const pesoShort = (n) => {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1e6) return `₱${(v / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
  if (Math.abs(v) >= 1e4) return `₱${(v / 1e3).toFixed(1).replace(/\.0$/, '')}K`;
  return `₱${Math.round(v).toLocaleString()}`;
};

const niceMax = (v) => {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
};

const fmtDate = (d, opts = { month: 'short', day: 'numeric' }) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, opts);

/** Stat tile: label · value · delta vs previous period (up = good unless invert) */
export function StatTile({ label, value, delta, invert = false, hint, icon }) {
  let deltaEl = null;
  if (delta !== undefined && delta !== null && Number.isFinite(delta)) {
    const up = delta > 0;
    const good = delta === 0 ? null : up !== invert;
    deltaEl = (
      <span className={`st-delta ${good === null ? '' : good ? 'good' : 'bad'}`}>
        {delta === 0 ? '→' : up ? '▲' : '▼'} {Math.abs(delta).toFixed(0)}% <small>vs previous</small>
      </span>
    );
  }
  return (
    <div className="stat-tile pop-in">
      <div className="st-label">{icon && <span aria-hidden="true">{icon}</span>} {label}</div>
      <div className="st-value">{value}</div>
      {deltaEl}
      {hint && <div className="st-hint">{hint}</div>}
    </div>
  );
}

/** Single-series line + area wash with crosshair tooltip. data: [{date, value, extra}] */
export function LineChart({ data, height = 260, valueFmt = pesoShort, tooltip }) {
  const wrap = useRef(null);
  const [hover, setHover] = useState(null);
  const W = 720; // viewBox width; scales to container
  const pad = { l: 52, r: 56, t: 16, b: 30 };
  const iw = W - pad.l - pad.r;
  const ih = height - pad.t - pad.b;

  const { max, pts, ticks, xTicks } = useMemo(() => {
    const m = niceMax(Math.max(...data.map((d) => d.value), 0));
    const p = data.map((d, i) => ({
      ...d,
      x: pad.l + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw),
      y: pad.t + ih - (d.value / m) * ih,
    }));
    const t = [0, 0.25, 0.5, 0.75, 1].map((f) => f * m);
    const step = Math.max(1, Math.ceil(data.length / 6));
    const xt = p.filter((_, i) => i % step === 0 || i === p.length - 1);
    return { max: m, pts: p, ticks: t, xTicks: xt };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, height]);

  if (!data.length) return null;
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('');
  const area = `${line}L${pts[pts.length - 1].x},${pad.t + ih}L${pts[0].x},${pad.t + ih}Z`;
  const last = pts[pts.length - 1];
  const peak = pts.reduce((a, b) => (b.value > a.value ? b : a), pts[0]);

  const onMove = (e) => {
    const r = wrap.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    let best = 0;
    pts.forEach((p, i) => { if (Math.abs(p.x - x) < Math.abs(pts[best].x - x)) best = i; });
    setHover(best);
  };
  const h = hover !== null ? pts[hover] : null;

  return (
    <div className="viz-line" ref={wrap} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${height}`} role="img" aria-label="Revenue per day line chart">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={pad.t + ih - (t / max) * ih} y2={pad.t + ih - (t / max) * ih} className={t === 0 ? 'viz-base' : 'viz-grid'} />
            <text x={pad.l - 8} y={pad.t + ih - (t / max) * ih + 4} className="viz-tick" textAnchor="end">{valueFmt(t)}</text>
          </g>
        ))}
        {xTicks.map((p) => (
          <text key={p.date} x={p.x} y={height - 8} className="viz-tick" textAnchor="middle">{fmtDate(p.date)}</text>
        ))}
        <path d={area} className="viz-area" />
        <path d={line} className="viz-stroke" />
        {/* selective direct labels: peak + latest */}
        {peak.value > 0 && peak !== last && (
          <g>
            <circle cx={peak.x} cy={peak.y} r="4.5" className="viz-dot" />
            <text x={peak.x} y={peak.y - 12} className="viz-label" textAnchor="middle">Peak {valueFmt(peak.value)}</text>
          </g>
        )}
        <circle cx={last.x} cy={last.y} r="5" className="viz-dot" />
        <text x={last.x + 9} y={last.y + 4} className="viz-label">{valueFmt(last.value)}</text>
        {h && (
          <g>
            <line x1={h.x} x2={h.x} y1={pad.t} y2={pad.t + ih} className="viz-cross" />
            <circle cx={h.x} cy={h.y} r="6" className="viz-dot viz-dot-hover" />
          </g>
        )}
      </svg>
      {h && (
        <div className="viz-tip" style={{ left: `${(h.x / W) * 100}%`, top: `${(h.y / height) * 100}%` }}>
          <b>{fmtDate(h.date, { weekday: 'short', month: 'short', day: 'numeric' })}</b>
          {tooltip ? tooltip(h) : <span>{valueFmt(h.value)}</span>}
        </div>
      )}
    </div>
  );
}

/** Horizontal bar list (single series). rows: [{label, value, icon, sub}] */
export function BarList({ rows, valueFmt = pesoShort, tipFmt }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(...rows.map((r) => Number(r.value)), 0) || 1;
  return (
    <div className="bar-list" role="list">
      {rows.map((r, i) => (
        <div
          key={r.label}
          className={`bl-row ${hover === i ? 'hover' : ''}`}
          role="listitem"
          tabIndex={0}
          onPointerEnter={() => setHover(i)}
          onPointerLeave={() => setHover(null)}
          onFocus={() => setHover(i)}
          onBlur={() => setHover(null)}
        >
          <div className="bl-label">{r.icon && <span className="bl-icon" aria-hidden="true">{r.icon}</span>}<span>{r.label}</span></div>
          <div className="bl-track">
            <div className="bl-bar" style={{ width: `${Math.max(2, (Number(r.value) / max) * 100)}%`, animationDelay: `${i * 70}ms` }} />
            <span className="bl-value">{valueFmt(r.value)}</span>
          </div>
          {hover === i && tipFmt && <div className="bl-tip">{tipFmt(r)}</div>}
        </div>
      ))}
    </div>
  );
}
