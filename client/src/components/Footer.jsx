import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <svg className="footer-wave" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0,40 C240,90 480,0 720,40 C960,80 1200,10 1440,45 L1440,90 L0,90 Z" />
      </svg>
      <div className="container footer-grid">
        <div>
          <div className="brand footer-brand"><span className="brand-icon">🌾</span><span>Ani<b>Harvest</b></span></div>
          <p>Connecting hardworking local farmers directly with families who love fresh, honest food. From the field to your table — fair for everyone.</p>
        </div>
        <div>
          <h4>Explore</h4>
          <Link to="/market">Marketplace</Link>
          <Link to="/market?category=vegetables">Vegetables</Link>
          <Link to="/market?category=fruits">Fruits</Link>
          <Link to="/market?organic=1">Organic Picks</Link>
        </div>
        <div>
          <h4>For Farmers</h4>
          <Link to="/register?role=farmer">Start Selling</Link>
          <Link to="/farmer">Farm Dashboard</Link>
          <Link to="/orders">Manage Orders</Link>
        </div>
        <div>
          <h4>Contact</h4>
          <p>📍 Nueva Ecija, Philippines</p>
          <p>📞 (044) 123-4567</p>
          <p>✉️ hello@aniharvest.com</p>
        </div>
      </div>
      <div className="footer-bottom">© {new Date().getFullYear()} AniHarvest Marketplace · Grown with 💚 for local farmers</div>
    </footer>
  );
}
