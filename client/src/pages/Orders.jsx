import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import OrderList from '../components/OrderList.jsx';
import { usePageTour } from '../tour/Tour.jsx';

export default function Orders() {
  usePageTour('orders');
  const { user } = useAuth();
  const [orders, setOrders] = useState(null);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api('orders.php').then(setOrders).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const shown = (orders || []).filter((o) => filter === 'all' || o.status === filter);

  return (
    <div className="container page-pad">
      <h1 className="page-title">📦 {user.role === 'buyer' ? 'My Orders' : 'Customer Orders'}</h1>
      <div className="tabs">
        {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
          <button key={s} className={filter === s ? 'active' : ''} onClick={() => setFilter(s)}>{s}</button>
        ))}
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {orders === null ? <div className="page-loader"><span className="sprout">🌱</span></div> : <OrderList orders={shown} reload={load} />}
    </div>
  );
}
