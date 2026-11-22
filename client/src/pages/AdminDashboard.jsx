import { useCallback, useEffect, useState } from 'react';
import { api, peso } from '../api.js';
import OrderList from '../components/OrderList.jsx';
import ProductForm from '../components/ProductForm.jsx';
import { StatCard, ProductTable } from './FarmerDashboard.jsx';
import { toast } from '../components/Toast.jsx';
import PaymentsAdmin from '../components/PaymentsAdmin.jsx';
import PaymentMethodsAdmin from '../components/PaymentMethodsAdmin.jsx';
import { usePageTour } from '../tour/Tour.jsx';

const STATUS_COLORS = { pending: '#e9b949', processing: '#5b9bd5', shipped: '#8e6cc4', delivered: '#3f8f4a', cancelled: '#c6544b' };

export default function AdminDashboard() {
  usePageTour('admin');
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editing, setEditing] = useState(null);
  const [pendingPays, setPendingPays] = useState(0);
  const [userQ, setUserQ] = useState('');
  const [userRole, setUserRole] = useState('all');
  const uq = userQ.trim().toLowerCase();
  const shownUsers = users.filter((u) =>
    (userRole === 'all' || u.role === userRole) &&
    (!uq || [u.name, u.email, u.phone, u.farm_name, u.address].some((v) => (v || '').toLowerCase().includes(uq))));

  const load = useCallback(() => {
    api('stats.php?scope=admin').then(setStats).catch(() => {});
    api('stats.php?scope=admin&list=users').then(setUsers).catch(() => {});
    api('products.php?mine=1').then(setProducts).catch(() => {});
    api('orders.php').then(setOrders).catch(() => {});
    api('payments.php?status=pending').then((d) => setPendingPays(d.length)).catch(() => {});
  }, []);
  useEffect(load, [load]);

  const delUser = async (u) => {
    if (!confirm(`Delete ${u.name}? Their products and orders will be removed too.`)) return;
    try {
      await api(`stats.php?scope=admin&user=${u.id}`, { method: 'DELETE' });
      toast('User deleted');
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const delProduct = async (p) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    try {
      await api(`products.php?id=${p.id}`, { method: 'DELETE' });
      toast('Product deleted');
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const maxStatus = Math.max(1, ...(stats?.by_status || []).map((s) => Number(s.count)));

  return (
    <div className="container page-pad">
      <h1 className="page-title">🛡️ Admin Dashboard</h1>
      {stats && (
        <div className="dash-stats">
          <StatCard icon="👥" label="Users" value={stats.users} />
          <StatCard icon="👩‍🌾" label="Farmers" value={stats.farmers} />
          <StatCard icon="🥬" label="Products" value={stats.products} />
          <StatCard icon="💰" label="Sales" value={peso(stats.revenue)} tone="gold" />
        </div>
      )}

      <div className="tabs">
        {[['overview', '📊 Overview'], ['payments', '🧾 Payments'], ['methods', '💳 Payment Methods'], ['users', '👥 Users'], ['products', '🥬 Products'], ['orders', '📦 Orders']].map(([k, l]) => (
          <button key={k} data-tour={`tab-${k}`} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>
            {l}{k === 'payments' && pendingPays > 0 && <span className="pill">{pendingPays}</span>}
          </button>
        ))}
      </div>

      {tab === 'overview' && stats && (
        <div className="card">
          <h3>Orders by status</h3>
          {stats.by_status.length === 0 && <p className="muted">No orders yet.</p>}
          <div className="bars">
            {stats.by_status.map((s) => (
              <div key={s.status} className="bar-row">
                <span className="bar-label">{s.status}</span>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${(s.count / maxStatus) * 100}%`, background: STATUS_COLORS[s.status] }} /></div>
                <b>{s.count}</b>
              </div>
            ))}
          </div>
          <p className="muted small">Total orders: {stats.orders}</p>
        </div>
      )}

      {tab === 'users' && (
        <>
        <div className="user-filters">
          <div className="search-bar small">
            <span>🔍</span>
            <input value={userQ} onChange={(e) => setUserQ(e.target.value)} placeholder="Search name, email, phone, farm or address…" />
            {userQ && <button className="icon-btn" onClick={() => setUserQ('')}>✕</button>}
          </div>
          <div className="tabs" style={{ margin: 0 }}>
            {[['all', 'All'], ['buyer', '🛒 Buyers'], ['farmer', '👩‍🌾 Farmers'], ['admin', '🛡️ Admins']].map(([k, l]) => (
              <button key={k} className={userRole === k ? 'active' : ''} onClick={() => setUserRole(k)}>
                {l} <small>{k === 'all' ? users.length : users.filter((u) => u.role === k).length}</small>
              </button>
            ))}
          </div>
        </div>
        <p className="muted result-count">{shownUsers.length} user{shownUsers.length === 1 ? '' : 's'} found</p>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>Wallet</th><th>Joined</th><th /></tr></thead>
            <tbody>
              {shownUsers.length === 0 && (
                <tr><td colSpan="7" className="center muted">No users match your search.</td></tr>
              )}
              {shownUsers.map((u) => (
                <tr key={u.id}>
                  <td><b>{u.name}</b>{u.farm_name && <div className="muted small">🏡 {u.farm_name}</div>}</td>
                  <td>{u.email}</td>
                  <td><span className={`role role-${u.role}`}>{u.role}</span></td>
                  <td>{u.phone || '—'}</td>
                  <td>{u.role === 'admin' ? '—' : peso(u.wallet_balance)}</td>
                  <td>{new Date(u.created_at.replace(' ', 'T')).toLocaleDateString()}</td>
                  <td className="td-actions">{u.role !== 'admin' && <button className="icon-btn" onClick={() => delUser(u)}>🗑️</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {tab === 'payments' && <PaymentsAdmin onChange={load} />}
      {tab === 'methods' && <PaymentMethodsAdmin />}
      {tab === 'products' && <ProductTable products={products} onEdit={setEditing} onDelete={delProduct} showFarm />}
      {tab === 'orders' && <OrderList orders={orders} reload={load} />}

      {editing && (
        <ProductForm product={editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); toast('Product saved'); load(); }} />
      )}
    </div>
  );
}
