import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, peso } from '../api.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import ProductCard from '../components/ProductCard.jsx';
import ImageZoom from '../components/ImageZoom.jsx';
import { usePageTour } from '../tour/Tour.jsx';

export default function ProductDetail() {
  usePageTour('product');
  const { id } = useParams();
  const { add } = useCart();
  const { user } = useAuth();
  const [p, setP] = useState(null);
  const [related, setRelated] = useState([]);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    setP(null);
    setQty(1);
    api(`products.php?id=${id}`)
      .then((d) => {
        setP(d);
        return api(`products.php?category=${d.category_slug}&limit=5`);
      })
      .then((list) => setRelated(list.filter((x) => String(x.id) !== String(id)).slice(0, 4)))
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="container page-pad"><div className="alert alert-error">{error}</div></div>;
  if (!p) return <div className="page-loader"><span className="sprout">🌱</span></div>;

  const canBuy = !user || user.role === 'buyer';
  const out = p.stock <= 0;

  return (
    <div className="container page-pad">
      <p className="crumbs"><Link to="/market">Marketplace</Link> / <Link to={`/market?category=${p.category_slug}`}>{p.category_name}</Link> / {p.name}</p>
      <div className="detail">
        <div className="detail-img slide-in-left">
          <ImageZoom product={p} />
          {Number(p.is_organic) === 1 && <span className="badge badge-organic detail-badge">🌿 Certified Organic</span>}
        </div>
        <div className="detail-info slide-in-right">
          <span className="product-cat">{p.category_name}</span>
          <h1>{p.name}</h1>
          <div className="price big-price">{peso(p.price)}<small>/{p.unit}</small></div>
          <p className="detail-desc">{p.description || 'Freshly harvested and carefully packed by the farm.'}</p>

          <Link to={`/farm/${p.farmer_id}`} className="farm-box">
            <div className="farm-avatar">👩‍🌾</div>
            <div>
              <b>{p.farm_name || p.farmer_name}</b>
              <small>Grown by {p.farmer_name}{p.farm_location ? ` · 📍 ${p.farm_location}` : ''}</small>
            </div>
            <span className="farm-box-go">Visit farm →</span>
          </Link>

          <p className={`stock ${out ? 'out' : p.stock < 10 ? 'low' : ''}`}>
            {out ? '❌ Sold out for this season' : `✅ ${p.stock} ${p.unit} available`}
          </p>

          {canBuy && !out && (
            <div className="buy-row">
              <div className="qty">
                <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                <span>{qty}</span>
                <button onClick={() => setQty(Math.min(p.stock, qty + 1))}>+</button>
              </div>
              <button className="btn btn-primary btn-lg" onClick={() => add(p, qty)}>🧺 Add to Basket · {peso(p.price * qty)}</button>
            </div>
          )}
          {!canBuy && <p className="muted">Log in as a buyer to purchase products.</p>}
        </div>
      </div>

      {related.length > 0 && (
        <>
          <h2 className="related-title">More {p.category_name}</h2>
          <div className="product-grid">
            {related.map((r) => <ProductCard key={r.id} product={r} />)}
          </div>
        </>
      )}
    </div>
  );
}
