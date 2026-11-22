import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import FarmCard from '../components/FarmCard.jsx';
import { usePageTour } from '../tour/Tour.jsx';

export default function Farms() {
  usePageTour('farms');
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const [search, setSearch] = useState(q);
  const [farms, setFarms] = useState(null);
  const [error, setError] = useState('');

  // debounce typing into the URL (?q=) so results are shareable
  useEffect(() => {
    const t = setTimeout(() => {
      if (search.trim() !== q) setParams(search.trim() ? { q: search.trim() } : {});
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    setFarms(null);
    api(`farmers.php${q ? `?q=${encodeURIComponent(q)}` : ''}`)
      .then((d) => { setFarms(d); setError(''); })
      .catch((e) => setError(e.message));
  }, [q]);

  return (
    <div className="farms-page">
      <section className="page-hero">
        <div className="container">
          <h1>🏡 Our Partner Farms</h1>
          <p>Meet the growers behind your food — search by farm, farmer, place, or what they grow.</p>
          <div className="search-bar">
            <span>🔍</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g. Benguet, mango, Santos Family Farm…" autoFocus />
            {search && <button className="icon-btn" onClick={() => setSearch('')} title="Clear">✕</button>}
          </div>
        </div>
      </section>

      <div className="container page-section">
        {error && <div className="alert alert-error">{error}</div>}
        {farms === null ? (
          <div className="farm-grid">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton-card" />)}</div>
        ) : farms.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🚜</div>
            <h3>No farms found for “{q}”</h3>
            <p>Try a different name, province, or crop.</p>
          </div>
        ) : (
          <>
            <p className="muted result-count">{farms.length} farm{farms.length > 1 ? 's' : ''}{q ? ` matching “${q}”` : ''}</p>
            <div className="farm-grid">
              {farms.map((f, i) => (
                <div key={f.id} className="pop-in" style={{ animationDelay: `${Math.min(i, 12) * 60}ms` }}>
                  <FarmCard farm={f} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
