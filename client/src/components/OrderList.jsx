import { api, peso } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PinMap, directionsUrl, hasPin } from './MapPin.jsx';
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
              </div>
              <span className={`status status-${o.status}`}>{ICONS[o.status]} {o.status}</span>
            </div>

            {/* sellers and admin need to know where (and to whom) to deliver */}
            {user.role !== 'buyer' && (
              <div className="deliver-to">
                <div className="dt-label">📦 Deliver to</div>
                <div className="dt-grid">
                  <div><small>Buyer</small><b>{o.buyer_name}</b></div>
                  <div>
                    <small>Phone</small>
                    <a href={`tel:${(o.phone || '').replace(/[^\d+]/g, '')}`}><b>📞 {o.phone}</b></a>
                  </div>
                  <div className="dt-address">
                    <small>Delivery address</small>
                    <b>📍 {o.shipping_address}</b>
                    {!hasPin(o.delivery_lat, o.delivery_lng) && (
                      <a className="dt-map" target="_blank" rel="noopener noreferrer"
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.shipping_address || '')}`}>
                        Search this address in Google Maps ↗
                      </a>
                    )}
                  </div>
                </div>
                {hasPin(o.delivery_lat, o.delivery_lng) ? (
                  <div className="dt-pin">
                    <PinMap lat={+o.delivery_lat} lng={+o.delivery_lng} />
                    <div className="dt-pin-actions">
                      <a className="btn btn-primary btn-sm" target="_blank" rel="noopener noreferrer" href={directionsUrl(o.delivery_lat, o.delivery_lng)}>
                        🧭 Get directions
                      </a>
                      <span className="muted small">GPS pin: {Number(o.delivery_lat).toFixed(5)}, {Number(o.delivery_lng).toFixed(5)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="dt-note">🗺️ No map pin on this order (placed before pins were required). Use the address above.</div>
                )}
                {o.notes && o.notes !== '[sample]' && <div className="dt-note">📝 Buyer’s note: {o.notes}</div>}
              </div>
            )}

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
