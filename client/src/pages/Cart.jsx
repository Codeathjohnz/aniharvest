import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, peso } from '../api.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { ProductImage } from '../components/ProductCard.jsx';
import { toast } from '../components/Toast.jsx';
import WalletModal from '../components/WalletModal.jsx';
import { LocationPicker, hasPin } from '../components/MapPin.jsx';
import QrPayPanel, { providerStyle } from '../components/QrPayPanel.jsx';
import { usePageTour } from '../tour/Tour.jsx';

const DELIVERY_FEE = 50;

export default function Cart() {
  usePageTour('cart');
  const { items, setQty, remove, clear, total } = useCart();
  const { user, refreshUser } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({
    shipping_address: user?.address || '',
    phone: user?.phone || '',
    payment_method: 'Cash on Delivery',
    notes: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [cashIn, setCashIn] = useState(false);

  // exact delivery spot on the map (required to order)
  const [pin, setPin] = useState(() => (user && hasPin(user.lat, user.lng) ? { lat: +user.lat, lng: +user.lng } : null));
  const [pinKey, setPinKey] = useState(0); // remounts the map when the saved pin arrives

  // fill in saved address/phone/pin once the logged-in user has loaded
  useEffect(() => {
    if (!user) return;
    setForm((f) => ({ ...f, shipping_address: f.shipping_address || user.address || '', phone: f.phone || user.phone || '' }));
    if (!pin && hasPin(user.lat, user.lng)) { setPin({ lat: +user.lat, lng: +user.lng }); setPinKey((k) => k + 1); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  // GCash / Maya accounts set up by the admin (pay by QR)
  const [methods, setMethods] = useState([]);
  const [qr, setQr] = useState({ methodId: '', reference: '', proof: '' });
  useEffect(() => {
    api('payment_methods.php').then(setMethods).catch(() => {});
  }, []);

  const balance = Number(user?.wallet_balance || 0);
  const payByWallet = form.payment_method === 'E-Wallet';
  const payByQr = form.payment_method === 'QR';
  const short = Math.max(0, Math.round((total - balance) * 100) / 100);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const chooseQr = (id) => {
    setForm({ ...form, payment_method: 'QR' });
    setQr((q) => ({ ...q, methodId: id }));
  };

  const checkout = async (e) => {
    e.preventDefault();
    if (!user) return nav('/login?next=cart');
    setBusy(true);
    setError('');
    try {
      const d = await api('orders.php', {
        method: 'POST',
        body: {
          ...form,
          items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
          delivery_lat: pin?.lat, delivery_lng: pin?.lng,
          ...(payByQr ? { payment_method_id: qr.methodId || methods[0]?.id, reference_no: qr.reference, proof_image: qr.proof } : {}),
        },
      });
      clear();
      await refreshUser(); // wallet balance and the saved delivery pin both changed
      toast(payByQr
        ? `🧾 Order #${d.id} placed! We'll confirm your payment shortly.`
        : `🎉 Order #${d.id} ${payByWallet ? 'paid' : 'placed'}! The farmers are packing it now.`);
      nav('/orders');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!items.length) {
    return (
      <div className="container page-pad">
        <div className="empty">
          <div className="empty-icon basket-bounce">🧺</div>
          <h3>Your basket is empty</h3>
          <p>Fill it with something fresh from our farmers.</p>
          <Link to="/market" className="btn btn-primary">Go to Marketplace</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-pad">
      <h1 className="page-title">🧺 Your Basket</h1>
      <div className="cart-layout">
        <div className="card">
          {items.map((i) => (
            <div key={i.id} className="cart-row">
              <ProductImage product={i} />
              <div className="cart-info">
                <Link to={`/product/${i.id}`}><b>{i.name}</b></Link>
                <small>🏡 {i.farm_name} · {peso(i.price)}/{i.unit}</small>
              </div>
              <div className="qty">
                <button onClick={() => setQty(i.id, i.quantity - 1)}>−</button>
                <span>{i.quantity}</span>
                <button onClick={() => setQty(i.id, i.quantity + 1)}>+</button>
              </div>
              <div className="cart-sub">{peso(i.price * i.quantity)}</div>
              <button className="icon-btn" title="Remove" onClick={() => remove(i.id)}>✕</button>
            </div>
          ))}
        </div>

        <form className="card checkout" onSubmit={checkout}>
          <h3>Delivery details</h3>
          {user && user.role !== 'buyer' && <div className="alert alert-error">Only buyer accounts can place orders.</div>}
          <label>Delivery address
            <textarea name="shipping_address" required rows="2" value={form.shipping_address} onChange={change} />
          </label>
          <label>Phone number
            <input name="phone" required value={form.phone} onChange={change} />
          </label>
          {user?.role === 'buyer' && (
            <div className="pin-field">
              <div className="pay-label">Pin your exact delivery location <span className="req">required</span></div>
              <LocationPicker key={pinKey} value={pin} onChange={setPin} height={260} />
            </div>
          )}
          <div className="pay-label">Payment method</div>
          <div className="pay-options">
            <button type="button" className={`pay-option ${form.payment_method === 'Cash on Delivery' ? 'active' : ''}`}
              onClick={() => setForm({ ...form, payment_method: 'Cash on Delivery' })}>
              <span>💵</span><div><b>Cash on Delivery</b><small>Pay the rider when it arrives</small></div>
            </button>
            <button type="button" className={`pay-option ${form.payment_method === 'E-Wallet' ? 'active' : ''}`}
              onClick={() => setForm({ ...form, payment_method: 'E-Wallet' })}>
              <span>👛</span><div><b>E-Wallet</b><small>{user ? `Balance: ${peso(balance)}` : 'Load via GCash / Maya'}</small></div>
            </button>
            {methods.map((m) => {
              const s = providerStyle(m.provider);
              const active = payByQr && String(qr.methodId || methods[0]?.id) === String(m.id);
              return (
                <button type="button" key={m.id} className={`pay-option ${active ? 'active' : ''}`} style={{ '--pm': s.color }} onClick={() => chooseQr(m.id)}>
                  <span>{s.icon}</span><div><b>{m.provider}</b><small>Scan QR · {m.account_name}</small></div>
                </button>
              );
            })}
          </div>
          {payByQr && user && (
            <QrPayPanel methods={methods.filter((m) => String(m.id) === String(qr.methodId || methods[0]?.id))} amount={total} value={qr} onChange={setQr} />
          )}
          {payByWallet && user?.role === 'buyer' && short > 0 && (
            <div className="wallet-short pop-in">
              <span>Your wallet is short by <b>{peso(short)}</b>.</span>
              <button type="button" className="btn btn-sm btn-gcash" onClick={() => setCashIn(true)}>📱 Cash in via GCash</button>
            </div>
          )}

          <div className="summary">
            <div><span>Subtotal</span><span>{peso(total)}</span></div>
            <div><span>Delivery</span><span>{peso(DELIVERY_FEE)}</span></div>
            <div className="summary-total"><span>Total</span><span>{peso(total + DELIVERY_FEE)}</span></div>
            <small className="muted">Delivery fee ({peso(DELIVERY_FEE)}) is paid to the rider on arrival.</small>
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          {user?.role === 'buyer' && !pin && <p className="muted small center">📍 Pin your delivery location on the map to place the order.</p>}
          <button className="btn btn-primary btn-lg btn-block" disabled={busy || (user && user.role !== 'buyer') || (user && payByWallet && short > 0) || (user?.role === 'buyer' && !pin)}>
            {busy ? 'Placing order…' : !user ? 'Log in to Checkout' : payByWallet ? `Pay ${peso(total)} with E-Wallet`
              : payByQr ? 'I have paid — Place Order' : 'Place Order'}
          </button>
        </form>
        {cashIn && <WalletModal mode="cash_in" suggested={short} onClose={() => setCashIn(false)} />}
      </div>
    </div>
  );
}
