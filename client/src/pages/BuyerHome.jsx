import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, imageUrl, peso, firstName } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import ProductCard from '../components/ProductCard.jsx';
import FarmCard from '../components/FarmCard.jsx';
import { usePageTour } from '../tour/Tour.jsx';

const THEMES = ['ad-leaf', 'ad-wheat', 'ad-sky', 'ad-soil', 'ad-berry'];

/** Rotating product ad banner */
function AdCarousel({ slides }) {
  const { add } = useCart();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const startX = useRef(null);
  const n = slides.length;
  const go = (k) => setI(((k % n) + n) % n);

  useEffect(() => {
    if (paused || n < 2) return undefined;
    const t = setTimeout(() => setI((x) => (x + 1) % n), 5000);
    return () => clearTimeout(t);
  }, [i, paused, n]);

  if (!n) return <div className="ad-carousel skeleton-card" style={{ height: 340 }} />;

  return (
    <div
      className="ad-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onPointerDown={(e) => { startX.current = e.clientX; }}
      onPointerUp={(e) => {
        if (startX.current === null) return;
        const dx = e.clientX - startX.current;
        if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1));
        startX.current = null;
      }}
      aria-roledescription="carousel"
    >
      {slides.map((s, k) => {
        const src = imageUrl(s.p.image);
        return (
          <div key={s.p.id + s.tag} className={`ad-slide ${THEMES[k % THEMES.length]} ${k === i ? 'active' : ''}`} aria-hidden={k !== i}>
            <div className="ad-text">
              <span className="ad-tag">{s.tag}</span>
              <h2>{s.p.name}</h2>
              <p>{s.line}</p>
              <div className="ad-price">{peso(s.p.price)}<small>/{s.p.unit}</small></div>
              <div className="ad-cta">
                <button className="btn btn-gold" tabIndex={k === i ? 0 : -1} onClick={() => add(s.p)} disabled={s.p.stock <= 0}>🧺 Add to basket</button>
                <Link className="btn btn-light" tabIndex={k === i ? 0 : -1} to={`/product/${s.p.id}`}>View details</Link>
              </div>
              <Link className="ad-farm" tabIndex={k === i ? 0 : -1} to={`/farm/${s.p.farmer_id}`}>🏡 {s.p.farm_name}</Link>
            </div>
            <div className="ad-visual">
              <div className="ad-sun" />
              {src ? <img src={src} alt={s.p.name} /> : <span className="ad-emoji">{s.p.emoji || '🌱'}</span>}
              {Number(s.p.is_organic) === 1 && <span className="ad-stamp">🌿 100% Organic</span>}
            </div>
          </div>
        );
      })}
      {n > 1 && (
        <>
          <button className="ad-arrow prev" onClick={() => go(i - 1)} aria-label="Previous ad">‹</button>
          <button className="ad-arrow next" onClick={() => go(i + 1)} aria-label="Next ad">›</button>
          <div className="ad-dots">
            {slides.map((s, k) => (
              <button key={k} className={k === i ? 'active' : ''} onClick={() => go(k)} aria-label={`Show ad ${k + 1}`}>
                {k === i && !paused && <span className="ad-progress" key={i} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Horizontal scrolling shelf of product cards */
function Shelf({ title, sub, link, products }) {
  const ref = useRef(null);
  if (!products.length) return null;
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' });
  return (
    <section className="shelf">
      <div className="shelf-head">
        <div><h2>{title}</h2>{sub && <p className="muted">{sub}</p>}</div>
        <div className="shelf-nav">
          {link && <Link to={link} className="shelf-all">See all →</Link>}
          <button onClick={() => scroll(-1)} aria-label="Scroll left">‹</button>
          <button onClick={() => scroll(1)} aria-label="Scroll right">›</button>
        </div>
      </div>
      <div className="shelf-track" ref={ref}>
        {products.map((p, i) => (
          <div key={p.id} className="shelf-item pop-in" style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}

/** Buyer's home: product ads + shelves */
export default function BuyerHome() {
  usePageTour('buyer-home');
  const { user } = useAuth();
  const [all, setAll] = useState([]);
  const [popular, setPopular] = useState([]);
  const [cats, setCats] = useState([]);
  const [farms, setFarms] = useState([]);

  useEffect(() => {
    api('products.php').then(setAll).catch(() => {});
    api('products.php?sort=popular&limit=12').then(setPopular).catch(() => {});
    api('categories.php').then(setCats).catch(() => {});
    api('farmers.php?limit=4').then(setFarms).catch(() => {});
  }, []);

  const inStock = (list) => list.filter((p) => p.stock > 0);
  const organic = useMemo(() => inStock(all).filter((p) => Number(p.is_organic) === 1), [all]);
  const fresh = useMemo(() => inStock(all).slice(0, 10), [all]);
  const budget = useMemo(() => [...inStock(all)].sort((a, b) => a.price - b.price).slice(0, 10), [all]);

  // ads: top sellers, an organic pick, the newest harvest, a budget find (no duplicates)
  const slides = useMemo(() => {
    const out = [];
    const seen = new Set();
    const push = (p, tag, line) => { if (p && !seen.has(p.id)) { seen.add(p.id); out.push({ p, tag, line }); } };
    inStock(popular).slice(0, 2).forEach((p) => push(p, '🔥 Best seller', p.description || 'Loved by families across the country.'));
    push(organic[0], '🌿 Organic pick', organic[0]?.description);
    push(fresh[0], '✨ Just harvested', fresh[0]?.description);
    push(budget[0], '💸 Budget find', `Only ${budget[0] ? peso(budget[0].price) : ''} — fresh and affordable.`);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popular, organic, fresh, budget]);

  const cheapestIn = (slug) => {
    const list = all.filter((p) => p.category_slug === slug);
    return list.length ? Math.min(...list.map((p) => Number(p.price))) : null;
  };

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Maayong buntag' : hour < 18 ? 'Maayong hapon' : 'Maayong gabii';

  return (
    <div className="container page-pad buyer-home">
      <div className="bh-greet">
        <h1>{greet}, {firstName(user.name)}! 👋</h1>
        <p className="muted">What's fresh for your table today?</p>
      </div>

      <AdCarousel slides={slides} />

      <div className="cat-strip">
        {cats.map((c) => (
          <Link key={c.id} to={`/market?category=${c.slug}`} className="cat-pill">
            <span>{c.icon}</span>{c.name}
          </Link>
        ))}
      </div>

      <Shelf title="🔥 Best sellers" sub="What other families are buying most" link="/market" products={inStock(popular)} />

      <div className="promo-grid">
        <Link to="/market?organic=1" className="promo promo-leaf">
          <span className="promo-emoji">🌿</span>
          <div><small>Organic week</small><b>{organic.length} chemical-free picks</b><span>Shop organic →</span></div>
        </Link>
        <Link to="/market?category=dairy" className="promo promo-wheat">
          <span className="promo-emoji">🥚</span>
          <div><small>Farm-fresh eggs & dairy</small><b>{cheapestIn('dairy') ? `From ${peso(cheapestIn('dairy'))}` : 'Fresh daily'}</b><span>Shop now →</span></div>
        </Link>
        <Link to="/market?category=grains" className="promo promo-soil">
          <span className="promo-emoji">🌾</span>
          <div><small>Rice straight from the field</small><b>{cheapestIn('grains') ? `From ${peso(cheapestIn('grains'))}/kg` : 'Fresh milled'}</b><span>Stock up →</span></div>
        </Link>
      </div>

      <Shelf title="✨ Fresh arrivals" sub="Newly listed by our farmers" link="/market" products={fresh} />
      <Shelf title="🌿 Organic picks" sub="Grown without synthetic pesticides" link="/market?organic=1" products={organic.slice(0, 10)} />
      <Shelf title="💸 Budget finds" sub="Fresh food that's easy on the wallet" link="/market?sort=price_asc" products={budget} />

      {farms.length > 0 && (
        <section className="shelf">
          <div className="shelf-head">
            <div><h2>🏡 Meet the farmers</h2><p className="muted">Buy directly from the people who grow it</p></div>
            <div className="shelf-nav"><Link to="/farms" className="shelf-all">All farms →</Link></div>
          </div>
          <div className="farm-grid">{farms.map((f) => <FarmCard key={f.id} farm={f} />)}</div>
        </section>
      )}
    </div>
  );
}
