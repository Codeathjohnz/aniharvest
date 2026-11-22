import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import ProductCard from '../components/ProductCard.jsx';
import { farmInitial, uniqueEmojis } from '../components/FarmCard.jsx';
import { usePageTour } from '../tour/Tour.jsx';

export default function FarmStore() {
  usePageTour('store');
  const { id } = useParams();
  const [farm, setFarm] = useState(null);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setFarm(null);
    Promise.all([api(`farmers.php?id=${id}`), api(`products.php?farmer=${id}`)])
      .then(([f, p]) => { setFarm(f); setProducts(p); })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="container page-pad"><div className="alert alert-error">{error}</div></div>;
  if (!farm) return <div className="page-loader"><span className="sprout">🌱</span></div>;

  const s = search.trim().toLowerCase();
  const shown = products.filter((p) => !s || p.name.toLowerCase().includes(s) || p.category_name.toLowerCase().includes(s));
  const since = new Date(farm.created_at.replace(' ', 'T')).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div>
      <section className="store-hero">
        <div className="store-hero-emojis" aria-hidden="true">
          {uniqueEmojis(farm.product_emojis).slice(0, 8).map((e, i) => <span key={i} style={{ animationDelay: `${i * 0.4}s`, left: `${8 + i * 11}%` }}>{e}</span>)}
        </div>
        <div className="container store-head">
          <div className="store-logo">{farmInitial(farm)}</div>
          <div>
            <p className="crumbs light"><Link to="/farms">Farms</Link> / {farm.farm_name}</p>
            <h1>{farm.farm_name || `${farm.name}'s Farm`}</h1>
            <div className="store-meta">
              <span>👩‍🌾 {farm.name}</span>
              {farm.address && <span>📍 {farm.address}</span>}
              <span>🗓️ Selling since {since}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container page-section">
        <div className="store-stats">
          <div><b>{farm.product_count}</b><small>Products</small></div>
          <div><b>{farm.organic_count || 0}</b><small>Organic</small></div>
          <div className="store-cats"><small>Grows</small><b>{farm.category_names || '—'}</b></div>
        </div>

        <div className="store-toolbar">
          <h2>Products from this farm</h2>
          <div className="search-bar small">
            <span>🔍</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search this farm…" />
          </div>
        </div>

        {shown.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🌾</div>
            <h3>{products.length ? 'No matching products' : 'No products listed yet'}</h3>
          </div>
        ) : (
          <div className="product-grid">
            {shown.map((p, i) => (
              <div key={p.id} className="pop-in" style={{ animationDelay: `${Math.min(i, 12) * 50}ms` }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
