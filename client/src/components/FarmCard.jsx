import { Link } from 'react-router-dom';
import { peso } from '../api.js';

// split a string of emojis into whole emoji (handles 🌶️ / joined emoji) and remove duplicates
export const uniqueEmojis = (s = '') => {
  const parts = typeof Intl !== 'undefined' && Intl.Segmenter
    ? [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s || '')].map((x) => x.segment)
    : Array.from(s || '');
  return [...new Set(parts.filter((ch) => ch.trim()))];
};

export const farmInitial = (f) => (f.farm_name || f.name || '?').trim().charAt(0).toUpperCase();

export default function FarmCard({ farm }) {
  const emojis = uniqueEmojis(farm.product_emojis).slice(0, 6);
  return (
    <Link to={`/farm/${farm.id}`} className="farm-card">
      <div className="farm-card-banner">
        <div className="farm-card-emojis">{emojis.length ? emojis.map((e, i) => <span key={i} style={{ animationDelay: `${i * 0.3}s` }}>{e}</span>) : <span>🌱</span>}</div>
      </div>
      <div className="farm-card-body">
        <div className="farm-logo">{farmInitial(farm)}</div>
        <h3>{farm.farm_name || `${farm.name}'s Farm`}</h3>
        <p className="farm-owner">👩‍🌾 {farm.name}</p>
        {farm.address && <p className="farm-loc">📍 {farm.address}</p>}
        <div className="farm-stats">
          <span><b>{farm.product_count}</b> products</span>
          {Number(farm.organic_count) > 0 && <span className="badge badge-organic">🌿 {farm.organic_count} organic</span>}
          {farm.min_price && <span className="muted">from {peso(farm.min_price)}</span>}
        </div>
      </div>
    </Link>
  );
}
