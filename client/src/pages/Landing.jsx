import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import Reveal from '../components/Reveal.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { usePageTour } from '../tour/Tour.jsx';

const WORDS = ['Vegetables', 'Fruits', 'Rice & Grains', 'Free-range Eggs', 'Root Crops'];

function RotatingWord() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % WORDS.length), 2400);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="rotating-word" key={i}>
      {WORDS[i]}
    </span>
  );
}

function Counter({ to, suffix = '' }) {
  const ref = useRef(null);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const el = ref.current;
    let raf;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / 1600, 1);
        setVal(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

function FarmScene() {
  const wheat = Array.from({ length: 26 });
  const leaves = ['🍃', '🌿', '🍂', '🍃', '🌾', '🍃', '🍂', '🌿'];
  return (
    <div className="farm-scene" aria-hidden="true">
      <div className="sun"><div className="sun-rays" /><div className="sun-core" /></div>
      <div className="cloud c1" /><div className="cloud c2" /><div className="cloud c3" />
      <div className="birds">
        <span>〰</span><span>〰</span><span>〰</span>
      </div>

      <svg className="hills" viewBox="0 0 1440 420" preserveAspectRatio="none">
        <path className="hill h1" d="M0,210 C220,120 420,170 620,150 C860,120 1080,60 1440,140 L1440,420 L0,420 Z" />
        <path className="hill h2" d="M0,270 C260,200 520,260 760,230 C1000,200 1200,250 1440,215 L1440,420 L0,420 Z" />
        <g className="crop-rows">
          {Array.from({ length: 9 }).map((_, i) => (
            <path key={i} d={`M${60 + i * 150},420 Q${240 + i * 120},300 ${420 + i * 110},262`} />
          ))}
        </g>
        <path className="hill h3" d="M0,330 C300,290 600,345 900,320 C1150,300 1300,330 1440,315 L1440,420 L0,420 Z" />
      </svg>

      <div className="barn">
        <div className="barn-roof" />
        <div className="barn-body"><div className="barn-door" /></div>
      </div>
      <div className="windmill">
        <div className="windmill-blades"><span /><span /><span /><span /></div>
        <div className="windmill-pole" />
      </div>

      <div className="tractor">🚜</div>

      <div className="wheat-field">
        {wheat.map((_, i) => (
          <svg key={i} className="wheat" viewBox="0 0 20 90" style={{ animationDelay: `${(i % 7) * -0.4}s`, left: `${i * 3.9}%`, height: `${70 + (i % 4) * 14}px` }}>
            <path d="M10,90 L10,30" />
            {[0, 1, 2, 3, 4].map((k) => (
              <g key={k}>
                <ellipse cx="6.5" cy={8 + k * 6} rx="3" ry="5" transform={`rotate(-25 6.5 ${8 + k * 6})`} />
                <ellipse cx="13.5" cy={8 + k * 6} rx="3" ry="5" transform={`rotate(25 13.5 ${8 + k * 6})`} />
              </g>
            ))}
          </svg>
        ))}
      </div>

      {leaves.map((l, i) => (
        <span key={i} className="leaf" style={{ left: `${8 + i * 12}%`, animationDelay: `${i * 1.3}s`, animationDuration: `${9 + (i % 3) * 3}s` }}>{l}</span>
      ))}
    </div>
  );
}

export default function Landing() {
  usePageTour('landing');
  const [stats, setStats] = useState({ farmers: 0, products: 0, buyers: 0, orders: 0 });
  const [cats, setCats] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api('stats.php').then(setStats).catch(() => {});
    api('categories.php').then(setCats).catch(() => {});
    api('products.php?limit=8').then(setProducts).catch(() => {});
  }, []);

  return (
    <div className="landing">
      {/* ===== HERO ===== */}
      <section className="hero">
        <FarmScene />
        <div className="container hero-content">
          <span className="hero-tag">🌱 Fresh from Filipino farms</span>
          <h1>
            <span className="rise" style={{ animationDelay: '0.1s' }}>Harvested today,</span>
            <span className="rise" style={{ animationDelay: '0.3s' }}>on your table</span>
            <span className="rise accent" style={{ animationDelay: '0.5s' }}>tomorrow.</span>
          </h1>
          <p className="hero-sub rise" style={{ animationDelay: '0.7s' }}>
            Shop farm-fresh <RotatingWord /> directly from local growers. No middlemen — fairer prices for farmers, fresher food for you.
          </p>
          <div className="hero-actions rise" style={{ animationDelay: '0.9s' }}>
            <Link to="/market" className="btn btn-primary btn-lg">🧺 Shop the Harvest</Link>
            <Link to="/register?role=farmer" className="btn btn-light btn-lg">👩‍🌾 Sell Your Produce</Link>
          </div>
        </div>
        <a href="#stats" className="scroll-hint" onClick={(e) => { e.preventDefault(); document.getElementById('stats')?.scrollIntoView({ behavior: 'smooth' }); }}>
          <span />
        </a>
      </section>

      {/* ===== STATS ===== */}
      <section id="stats" className="stats-band">
        <div className="container stats-grid">
          {[
            ['👩‍🌾', stats.farmers, 'Partner Farmers'],
            ['🥬', stats.products, 'Fresh Products'],
            ['🏡', stats.buyers, 'Happy Families'],
            ['📦', stats.orders, 'Orders Delivered'],
          ].map(([icon, n, label], i) => (
            <Reveal key={label} delay={i * 120} className="stat">
              <div className="stat-icon">{icon}</div>
              <div className="stat-num"><Counter to={n} suffix="+" /></div>
              <div className="stat-label">{label}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="section">
        <div className="container">
          <Reveal className="section-head">
            <span className="eyebrow">Browse the field</span>
            <h2>Shop by Category</h2>
            <p>Everything that grows, grazes or lays — all in one friendly market.</p>
          </Reveal>
          <div className="cat-grid">
            {cats.map((c, i) => (
              <Reveal key={c.id} delay={i * 70} from="zoom">
                <Link to={`/market?category=${c.slug}`} className="cat-card">
                  <span className="cat-icon">{c.icon}</span>
                  <h3>{c.name}</h3>
                  <small>{c.product_count} products</small>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== MARQUEE ===== */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {Array.from({ length: 2 }).map((_, k) => (
            <span key={k}>
              🥕 Carrots · 🍅 Tomatoes · 🌾 Rice · 🥭 Mangoes · 🥚 Eggs · 🥦 Broccoli · 🍓 Strawberries · 🍌 Bananas · 🧄 Garlic · 🥔 Potatoes · 🌿 Herbs · 🐔 Native Chicken ·&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ===== HOW IT WORKS ===== */}
      <section className="section how">
        <div className="container">
          <Reveal className="section-head">
            <span className="eyebrow">Simple as planting a seed</span>
            <h2>How AniHarvest Works</h2>
          </Reveal>
          <div className="steps">
            {[
              ['🌱', 'Farmers List', 'Local growers post their freshest harvest with fair, transparent prices.'],
              ['🧺', 'You Shop', 'Browse by category, fill your basket, and check out in seconds.'],
              ['🚚', 'Farm Delivers', 'Your order is packed at the farm and delivered straight to your door.'],
            ].map(([icon, title, text], i) => (
              <Reveal key={title} delay={i * 200} className="step">
                <div className="step-num">{i + 1}</div>
                <div className="step-icon">{icon}</div>
                <h3>{title}</h3>
                <p>{text}</p>
              </Reveal>
            ))}
            <svg className="steps-line" viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true">
              <path d="M80,20 C300,-10 400,50 500,20 C600,-10 700,50 920,20" />
            </svg>
          </div>
        </div>
      </section>

      {/* ===== FEATURED PRODUCTS ===== */}
      <section className="section featured">
        <div className="container">
          <Reveal className="section-head">
            <span className="eyebrow">Just harvested</span>
            <h2>Fresh Picks This Week</h2>
            <p>Straight from the soil, picked and packed by the hands that grew them.</p>
          </Reveal>
          {products.length === 0 ? (
            <p className="muted center">Start XAMPP (Apache + MySQL) to load the harvest 🌾</p>
          ) : (
            <div className="product-grid">
              {products.map((p, i) => (
                <Reveal key={p.id} delay={(i % 4) * 100}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          )}
          <div className="center" style={{ marginTop: 36 }}>
            <Link to="/market" className="btn btn-outline btn-lg">View the whole market →</Link>
          </div>
        </div>
      </section>

      {/* ===== WHY US ===== */}
      <section className="section why">
        <div className="container why-grid">
          <Reveal from="left" className="why-visual">
            <div className="plant-pot">
              <svg viewBox="0 0 200 260" className="growing-plant">
                <path className="stem" d="M100,200 C100,160 95,120 100,60" />
                <path className="leaf-l l1" d="M99,160 C70,150 55,125 60,110 C80,115 95,135 99,160 Z" />
                <path className="leaf-r l2" d="M101,130 C130,120 145,95 140,80 C120,85 105,105 101,130 Z" />
                <path className="leaf-l l3" d="M99,100 C75,92 65,72 70,60 C88,66 97,82 99,100 Z" />
                <circle className="bud" cx="100" cy="56" r="10" />
                <path className="pot" d="M55,200 L145,200 L135,255 L65,255 Z" />
                <rect className="pot-rim" x="48" y="192" width="104" height="16" rx="5" />
              </svg>
            </div>
            <div className="float-chip chip1">🌿 100% Traceable</div>
            <div className="float-chip chip2">💚 Fair Trade</div>
            <div className="float-chip chip3">⚡ Same-week Harvest</div>
          </Reveal>
          <div>
            <Reveal className="section-head left">
              <span className="eyebrow">Why AniHarvest</span>
              <h2>Rooted in fairness, grown with care</h2>
            </Reveal>
            {[
              ['🤝', 'Direct from farmers', 'Farmers keep more of every peso — no layers of middlemen between you.'],
              ['🌿', 'Fresh & organic options', 'Filter for organic produce and see exactly which farm it came from.'],
              ['💸', 'Fair, honest prices', 'Transparent pricing set by the growers themselves.'],
              ['📦', 'Track every order', 'Follow your basket from pending to delivered in real time.'],
            ].map(([icon, title, text], i) => (
              <Reveal key={title} delay={i * 120} from="right" className="why-item">
                <div className="why-icon">{icon}</div>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="section testimonials">
        <div className="container">
          <Reveal className="section-head">
            <span className="eyebrow">From our community</span>
            <h2>Stories from the Field</h2>
          </Reveal>
          <div className="testi-grid">
            {[
              ['👩‍🌾', 'Aling Rosa', 'Vegetable farmer, Benguet', 'Before AniHarvest, traders set my prices. Now I sell straight to families in the city and earn almost double.'],
              ['👨‍👩‍👧', 'The Reyes Family', 'Buyers, Quezon City', 'The vegetables arrive so fresh they last the whole week. My kids actually ask for broccoli now!'],
              ['👨‍🌾', 'Mang Pedro', 'Rice farmer, Nueva Ecija', 'Posting my harvest takes two minutes. The orders page tells me exactly what to pack each morning.'],
            ].map(([icon, name, role, quote], i) => (
              <Reveal key={name} delay={i * 150} from="zoom" className="testi">
                <div className="stars">★★★★★</div>
                <p>“{quote}”</p>
                <div className="testi-who">
                  <span className="testi-avatar">{icon}</span>
                  <div><b>{name}</b><small>{role}</small></div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="cta">
        <div className="cta-sprouts" aria-hidden="true">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} style={{ left: `${i * 8.5}%`, animationDelay: `${i * 0.25}s` }}>🌱</span>
          ))}
        </div>
        <Reveal className="container cta-inner" from="zoom">
          <h2>Got a harvest to share?</h2>
          <p>Open your free farm stall in minutes and reach thousands of buyers who value real, local food.</p>
          <div className="hero-actions center-actions">
            <Link to="/register?role=farmer" className="btn btn-gold btn-lg">👩‍🌾 Become a Seller</Link>
            <Link to="/market" className="btn btn-light btn-lg">Browse Products</Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
