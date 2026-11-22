import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, peso, firstName } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { StatTile, LineChart, BarList, pesoShort } from '../components/charts.jsx';
import { usePageTour } from '../tour/Tour.jsx';

const RANGES = [[7, 'Last 7 days'], [30, 'Last 30 days'], [90, 'Last 90 days']];
const STATUS = {
  pending: ['🕒', 'Pending'], processing: ['📦', 'Processing'], shipped: ['🚚', 'Shipped'],
  delivered: ['✅', 'Delivered'], cancelled: ['❌', 'Cancelled'],
};
const pct = (cur, prev) => (prev > 0 ? ((cur - prev) / prev) * 100 : cur > 0 ? 100 : 0);

/** Farmer's home: sales analytics */
export default function FarmerHome() {
  usePageTour('farmer-home');
  const { user } = useAuth();
  const [days, setDays] = useState(30);
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    api(`analytics.php?days=${days}`).then((r) => { setD(r); setError(''); }).catch((e) => setError(e.message));
  }, [days]);

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Maayong buntag' : hour < 18 ? 'Maayong hapon' : 'Maayong gabii';

  return (
    <div className="container page-pad analytics">
      <div className="dash-head">
        <div>
          <h1 className="page-title">📊 {user.farm_name || 'My Farm'} Analytics</h1>
          <p className="muted">{greet}, {firstName(user.name)}! Here's how your harvest is selling.</p>
        </div>
        <div className="an-actions">
          <Link to="/farmer" className="btn btn-outline btn-sm">🌱 Manage products</Link>
          <Link to="/farmer?tab=orders" className="btn btn-primary btn-sm">📦 Orders{d?.to_pack ? ` · ${d.to_pack} to pack` : ''}</Link>
        </div>
      </div>

      {/* filters: one row above the charts */}
      <div className="tabs an-range">
        {RANGES.map(([v, l]) => <button key={v} className={days === v ? 'active' : ''} onClick={() => setDays(v)}>{l}</button>)}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {!d ? (
        <div className="page-loader" style={{ minHeight: 300, paddingTop: 0 }}><span className="sprout">🌱</span></div>
      ) : (
        <>
          <div className="an-hero card">
            <div>
              <div className="st-label">Revenue · {RANGES.find((r) => r[0] === days)[1].toLowerCase()}</div>
              <div className="an-hero-value">{peso(d.current.revenue)}</div>
              <StatDelta cur={d.current.revenue} prev={d.previous.revenue} />
            </div>
            <div className="an-hero-side">
              <div><small>To pack now</small><b>{d.to_pack}</b></div>
              <div><small>Wallet</small><b>{peso(d.wallet)}</b></div>
              <div><small>Active products</small><b>{d.products.active || 0}</b></div>
            </div>
          </div>

          <div className="an-tiles">
            <StatTile icon="🧾" label="Orders" value={d.current.orders.toLocaleString()} delta={pct(d.current.orders, d.previous.orders)} />
            <StatTile icon="📦" label="Units sold" value={d.current.units.toLocaleString()} delta={pct(d.current.units, d.previous.units)} />
            <StatTile icon="🧺" label="Avg. order value" value={pesoShort(d.current.aov)} delta={pct(d.current.aov, d.previous.aov)} />
            <StatTile icon="👥" label="Customers" value={d.current.customers.toLocaleString()} delta={pct(d.current.customers, d.previous.customers)} />
          </div>

          <div className="card an-card">
            <div className="an-card-head">
              <div>
                <h3>Revenue per day</h3>
                <p className="muted small">Excludes cancelled orders · hover the chart for daily details</p>
              </div>
              <button className="btn btn-ghost btn-sm" data-tour="table-toggle" onClick={() => setShowTable(!showTable)}>{showTable ? 'Show chart' : 'View as table'}</button>
            </div>
            {d.current.revenue === 0 ? (
              <Empty text="No sales in this period yet." />
            ) : showTable ? (
              <div className="table-wrap an-table">
                <table>
                  <thead><tr><th>Date</th><th>Orders</th><th>Revenue</th></tr></thead>
                  <tbody>
                    {[...d.daily].reverse().map((r) => (
                      <tr key={r.date}><td>{new Date(`${r.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</td><td className="num">{r.orders}</td><td className="num">{peso(r.revenue)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <LineChart
                data={d.daily.map((r) => ({ date: r.date, value: r.revenue, orders: r.orders }))}
                tooltip={(p) => <span>{peso(p.value)} · {p.orders} order{p.orders === 1 ? '' : 's'}</span>}
              />
            )}
          </div>

          <div className="an-grid">
            <div className="card an-card">
              <h3>🏆 Best-selling products</h3>
              <p className="muted small">By revenue</p>
              {d.top_products.length ? (
                <BarList
                  rows={d.top_products.map((p) => ({ label: p.name, icon: p.emoji, value: Number(p.revenue), units: p.units, unit: p.unit }))}
                  tipFmt={(r) => <>{peso(r.value)} · {r.units} {r.unit || 'units'} sold</>}
                />
              ) : <Empty text="No products sold yet." />}
            </div>

            <div className="card an-card">
              <h3>🗂️ Revenue by category</h3>
              <p className="muted small">Where your sales come from</p>
              {d.by_category.length ? (
                <BarList
                  rows={d.by_category.map((c) => ({ label: c.name, value: Number(c.revenue) }))}
                  tipFmt={(r) => <>{peso(r.value)} · {((r.value / d.current.revenue) * 100).toFixed(0)}% of revenue</>}
                />
              ) : <Empty text="No category sales yet." />}
            </div>

            <div className="card an-card">
              <h3>📦 Orders by status</h3>
              <p className="muted small">Orders placed in this period</p>
              {d.by_status.length ? (
                <BarList
                  valueFmt={(v) => Number(v).toLocaleString()}
                  rows={['pending', 'processing', 'shipped', 'delivered', 'cancelled']
                    .map((s) => ({ s, c: d.by_status.find((x) => x.status === s) }))
                    .filter((x) => x.c)
                    .map(({ s, c }) => ({ label: STATUS[s][1], icon: STATUS[s][0], value: Number(c.count) }))}
                  tipFmt={(r) => <>{r.value} order{r.value === 1 ? '' : 's'} {r.label.toLowerCase()}</>}
                />
              ) : <Empty text="No orders in this period." />}
            </div>

            <div className="card an-card">
              <h3>⚠️ Running low on stock</h3>
              <p className="muted small">Active products with fewer than 15 left</p>
              {d.low_stock.length ? (
                <div className="low-list">
                  {d.low_stock.map((p) => (
                    <div key={p.id} className="low-row">
                      <span className="bl-icon">{p.emoji}</span>
                      <span className="low-name">{p.name}</span>
                      <div className="meter" aria-label={`${p.stock} ${p.unit} left`}>
                        <div className={p.stock < 5 ? 'crit' : 'warn'} style={{ width: `${Math.max(4, (p.stock / 15) * 100)}%` }} />
                      </div>
                      <span className="low-val">{p.stock < 5 ? '⛔' : '⚠️'} {p.stock} {p.unit}</span>
                    </div>
                  ))}
                  <Link to="/farmer" className="btn btn-outline btn-sm" style={{ marginTop: 10 }}>Restock products →</Link>
                </div>
              ) : <Empty text="✅ All products are well stocked." />}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatDelta({ cur, prev }) {
  const p = pct(cur, prev);
  if (!prev && !cur) return null;
  const up = p > 0;
  return (
    <span className={`st-delta ${p === 0 ? '' : up ? 'good' : 'bad'}`}>
      {p === 0 ? '→' : up ? '▲' : '▼'} {Math.abs(p).toFixed(0)}% vs previous period ({pesoShort(prev)})
    </span>
  );
}

function Empty({ text }) {
  return <div className="an-empty">🌾 {text}</div>;
}
