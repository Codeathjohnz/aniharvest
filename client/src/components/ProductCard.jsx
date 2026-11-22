import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lightbox } from './ImageZoom.jsx';
import { imageUrl, peso } from '../api.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export function ProductImage({ product, big = false }) {
  const src = imageUrl(product.image);
  return (
    <div className={`product-img ${big ? 'big' : ''}`}>
      {src ? <img src={src} alt={product.name} /> : <span className="product-emoji">{product.emoji || '🌱'}</span>}
    </div>
  );
}

export default function ProductCard({ product }) {
  const { add } = useCart();
  const { user } = useAuth();
  const canBuy = !user || user.role === 'buyer';
  const out = product.stock <= 0;
  const [zoom, setZoom] = useState(false);

  return (
    <div className="product-card">
      <button type="button" className="card-zoom-btn" title="Zoom picture" aria-label={`Zoom ${product.name} picture`} onClick={() => setZoom(true)}>🔍</button>
      {zoom && <Lightbox product={product} onClose={() => setZoom(false)} />}
      <Link to={`/product/${product.id}`} className="product-link">
        <ProductImage product={product} />
        <div className="badges">
          {Number(product.is_organic) === 1 && <span className="badge badge-organic">🌿 Organic</span>}
          {out && <span className="badge badge-out">Sold out</span>}
          {!out && product.stock < 10 && <span className="badge badge-low">Only {product.stock} left</span>}
        </div>
      </Link>
      <div className="product-body">
        <span className="product-cat">{product.category_name}</span>
        <Link to={`/product/${product.id}`}><h3>{product.name}</h3></Link>
        <Link to={`/farm/${product.farmer_id}`} className="product-farm">🏡 {product.farm_name || product.farmer_name}</Link>
        <div className="product-foot">
          <div className="price">{peso(product.price)}<small>/{product.unit}</small></div>
          {canBuy && (
            <button className="btn btn-primary btn-sm btn-add" disabled={out} onClick={() => add(product)}>
              {out ? 'Sold out' : '+ Basket'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
