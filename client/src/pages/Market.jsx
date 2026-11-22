import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { farmInitial } from '../components/FarmCard.jsx';
import { api } from '../api.js';
import ProductCard from '../components/ProductCard.jsx';
import { usePageTour } from '../tour/Tour.jsx';

export default function Market() {
  usePageTour('market');
  const [params, setParams] = useSearchParams();
  const [cats, setCats] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(params.get('q') || '');

  const category = params.get('category') || '';
  const sort = params.get('sort') || '';
  const organic = params.get('organic') === '1';
  const q = params.get('q') || '';

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next);
  };

  useEffect(() => {
    api('categories.php').then(setCats).catch(() => {});
  }, []);

  // debounce the search box
  useEffect(() => {
    const t = setTimeout(() => { if (search !== q) setParam('q', search.trim()); }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // farms whose name / location / crops match the search
  const [farms, setFarms] = useState([]);
  useEffect(() => {
    if (!q) return setFarms([]);
    api(`farmers.php?q=${encodeURIComponent(q)}&limit=4`).then(setFarms).catch(() => setFarms([]));
  }, [q]);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (category) qs.set('category', category);
    if (sort) qs.set('sort', sort);
    if (organic) qs.set('organic', '1');
    if (q) qs.set('q', q);
    api(`products.php?${qs}`)
      .then((d) => { setProducts(d); setError(''); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [category, sort, organic, q]);

  const active = cats.find((c) => c.slug === category);

  return (
    <div className="market">
      <section className="page-hero">
        <div className="container">
          <h1>{active ? `${active.icon} ${active.name}` : '🧺 The Marketplace'}</h1>
          <p>Fresh produce from {new Set(products.map((p) => p.farmer_id)).size || 'our'} local farms, ready for your basket.</p>
          <div className="search-bar">
            <span>🔍</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products, farms, farmers or places…" />
          </div>
        </div>
      </section>

      <div className="container market-layout">
        <aside className="filters">
          <h4>Categories</h4>
          <button className={`filter-chip ${!category ? 'active' : ''}`} onClick={() => setParam('category', '')}>🌾 All Products</button>
          {cats.map((c) => (
            <button key={c.id} className={`filter-chip ${category === c.slug ? 'active' : ''}`} onClick={() => setParam('category', c.slug)}>
              {c.icon} {c.name} <small>{c.product_count}</small>
            </button>
          ))}
          <h4>Options</h4>
          <label className="switch-row">
            <input type="checkbox" checked={organic} onChange={(e) => setParam('organic', e.target.checked ? '1' : '')} />
            <span className="switch" /> Organic only
          </label>
          <h4>Sort by</h4>
          <select value={sort} onChange={(e) => setParam('sort', e.target.value)}>
            <option value="">Newest harvest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="name">Name A–Z</option>
          </select>
        </aside>

        <section>
          {error && <div className="alert alert-error">{error}</div>}
          {farms.length > 0 && (
            <div className="farm-matches pop-in">
              <div className="farm-matches-head">
                <h3>🏡 Farms matching “{q}”</h3>
                <Link to={`/farms?q=${encodeURIComponent(q)}`}>See all farms →</Link>
              </div>
              <div className="farm-chips">
                {farms.map((f) => (
                  <Link key={f.id} to={`/farm/${f.id}`} className="farm-chip">
                    <span className="farm-logo sm">{farmInitial(f)}</span>
                    <span><b>{f.farm_name || f.name}</b><small>{f.address || f.name} · {f.product_count} products</small></span>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {loading ? (
            <div className="product-grid">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton-card" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">🌾</div>
              <h3>Nothing growing here yet</h3>
              <p>Try another category or search term.</p>
            </div>
          ) : (
            <>
              <p className="muted result-count">{products.length} product{products.length > 1 ? 's' : ''} found</p>
              <div className="product-grid">
                {products.map((p, i) => (
                  <div key={p.id} className="pop-in" style={{ animationDelay: `${Math.min(i, 12) * 50}ms` }}>
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
