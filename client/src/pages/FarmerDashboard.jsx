import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, peso, firstName } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import ProductForm from '../components/ProductForm.jsx';
import OrderList from '../components/OrderList.jsx';
import { ProductImage } from '../components/ProductCard.jsx';
import { toast } from '../components/Toast.jsx';
import { usePageTour } from '../tour/Tour.jsx';

export function StatCard({ icon, label, value, tone = '' }) {
  return (
    <div className={`dash-stat pop-in ${tone}`}>
      <span className="dash-stat-icon">{icon}</span>
      <div><small>{label}</small><b>{value}</b></div>
    </div>
  );
}

export function ProductTable({ products, onEdit, onDelete, showFarm = false }) {
  if (!products.length) return <div className="empty"><div className="empty-icon">🌱</div><h3>No products yet</h3><p>Add your first harvest to start selling.</p></div>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>Product</th>{showFarm && <th>Farm</th>}<th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th /></tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td className="td-product"><ProductImage product={p} /> <b>{p.name}</b></td>
              {showFarm && <td>{p.farm_name || p.farmer_name}</td>}
              <td>{p.category_name}</td>
              <td>{peso(p.price)}/{p.unit}</td>
              <td className={p.stock < 10 ? 'text-warn' : ''}>{p.stock}</td>
              <td><span className={`status status-${p.status === 'active' ? 'delivered' : 'cancelled'}`}>{p.status}</span></td>
              <td className="td-actions">
                {onEdit && <button className="icon-btn" title="Edit" onClick={() => onEdit(p)}>✏️</button>}
                <button className="icon-btn" title="Delete" onClick={() => onDelete(p)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function FarmerDashboard() {
  usePageTour('farmer-dashboard');
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') === 'orders' ? 'orders' : 'products');
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, product = edit

  const load = useCallback(() => {
    api('stats.php?scope=me').then(setStats).catch(() => {});
    api('products.php?mine=1').then(setProducts).catch(() => {});
    api('orders.php').then(setOrders).catch(() => {});
  }, []);
  useEffect(load, [load]);

  const del = async (p) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    try {
      await api(`products.php?id=${p.id}`, { method: 'DELETE' });
      toast('🗑️ Product deleted');
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const pending = orders.filter((o) => o.status === 'pending').length;

  return (
    <div className="container page-pad">
      <div className="dash-head">
        <div>
          <h1 className="page-title">👩‍🌾 {user.farm_name || 'My Farm'}</h1>
          <p className="muted">Magandang araw, {firstName(user.name)}! Here's how your farm stall is doing.</p>
        </div>
        <button className="btn btn-primary" data-tour="add-product" onClick={() => setEditing({})}>+ Add Product</button>
      </div>

      {stats && (
        <div className="dash-stats">
          <StatCard icon="🥬" label="Products" value={stats.products} />
          <StatCard icon="📦" label="Orders" value={stats.orders} />
          <StatCard icon="💰" label="Revenue" value={peso(stats.revenue)} tone="gold" />
          <StatCard icon="⚠️" label="Low stock" value={stats.low_stock} tone={stats.low_stock ? 'warn' : ''} />
        </div>
      )}

      <div className="tabs">
        <button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>🌱 My Products</button>
        <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>📦 Orders {pending > 0 && <span className="pill">{pending}</span>}</button>
      </div>

      {tab === 'products'
        ? <ProductTable products={products} onEdit={setEditing} onDelete={del} />
        : <OrderList orders={orders} reload={load} />}

      {editing && (
        <ProductForm
          product={editing.id ? editing : null}
          onCancel={() => setEditing(null)}
          onSaved={() => { setEditing(null); toast('🌾 Product saved!'); load(); }}
        />
      )}
    </div>
  );
}
