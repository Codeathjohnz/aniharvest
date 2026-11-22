import { api, peso } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from './Toast.jsx';

const FLOW = ['pending', 'processing', 'shipped', 'delivered'];
const ICONS = { pending: '🕒', processing: '📦', shipped: '🚚', delivered: '✅', cancelled: '❌' };

export default function OrderList({ orders, reload }) {
  const { user, refreshUser } = useAuth();

  const setStatus = async (id, status) => {
    if (status === 'cancelled' && !confirm('Cancel this order? Stock will be returned to the farm and wallet payments refunded.')) return;
    try {
      await api(`orders.php?id=${id}`, { method: 'PUT', body: { status } });
      toast(`${ICONS[status]} Order #${id} is now ${status}`);
      reload();
      refreshUser(); // wallet may have changed (refund / earnings)
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  if (!orders.length) {
    return (
      <div className="empty">
        <div className="empty-icon">📦</div>
        <h3>No orders yet</h3>
        <p>{user.role === 'buyer' ? 'Your orders will appear here after checkout.' : 'Orders for your produce will show up here.'}</p>
      </div>
    );
  }

  return (
    <div className="orders">
      {orders.map((o, idx) => {
        const step = FLOW.indexOf(o.status);
        const shownTotal = user.role === 'farmer' ? o.items.reduce((s, i) => s + Number(i.subtotal), 0) : o.total;
        return (
          <div key={o.id} className="card order pop-in" style={{ animationDelay: `${Math.min(idx, 10) * 60}ms` }}>
            <div className="order-head">
              <div>
                <b>Order #{o.id}</b>
                <small className="muted"> · {new Date(o.created_at.replace(' ', 'T')).toLocaleString()}</small>
                {user.role !== 'buyer' && <div className="muted small">👤 {o.buyer_name} · 📞 {o.phone} · 📍 {o.shipping_address}</div>}
              </div>
              <span className={`status status-${o.status}`}>{ICONS[o.status]} {o.status}</span>
            </div>

            {o.status !== 'cancelled' && (
              <div className="tracker">
                {FLOW.map((s, i) => (
                  <div key={s} className={`track-step ${i <= step ? 'done' : ''}`}>
                    <span className="dot">{ICONS[s]}</span>
                    <small>{s}</small>
                  </div>
                ))}
                <div className="track-bar"><div style={{ width: `${(step / (FLOW.length - 1)) * 100}%` }} /></div>
              </div>
            )}

            <div className="order-items">
              {o.items.map((it) => (
                <div key={it.id} className="order-item">
                  <span className="oi-emoji">{it.emoji || '🌱'}</span>
                  <span className="oi-name">{it.product_name} <small className="muted">× {it.quantity} {it.unit || ''}</small>
                    {user.role !== 'farmer' && <small className="muted"> · 🏡 {it.farm_name || it.farmer_name}</small>}
                  </span>
                  <span>{peso(it.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="order-foot">
              <span className="muted small">
                {o.payment_method === 'E-Wallet' ? '👛' : o.payment_method === 'Cash on Delivery' ? '💵' : '📱'} {o.payment_method}{' '}
                <span className={`pay-status pay-${o.payment_status}`}>{o.payment_status.replace('_', ' ')}</span>
                {o.notes ? ` · 📝 ${o.notes}` : ''}
              </span>
              <div className="order-actions">
                <b>{user.role === 'farmer' ? 'Your share: ' : 'Total: '}{peso(shownTotal)}</b>
                {user.role === 'buyer' && o.status === 'pending' && (
                  <button className="btn btn-danger btn-sm" onClick={() => setStatus(o.id, 'cancelled')}>Cancel</button>
                )}
                {user.role !== 'buyer' && o.status !== 'cancelled' && o.status !== 'delivered' && (
                  <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)}>
                    {[...FLOW, 'cancelled'].map((s) => <option key={s} value={s}>{ICONS[s]} {s}</option>)}
                  </select>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
