import BrandLogo from './BrandLogo.jsx';
import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { peso } from '../api.js';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const nav = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // little bounce on the basket when the count changes
  useEffect(() => {
    if (!count) return;
    setBump(true);
    const t = setTimeout(() => setBump(false), 450);
    return () => clearTimeout(t);
  }, [count]);

  const close = () => setOpen(false);
  const doLogout = async () => {
    await logout();
    close();
    nav('/');
  };

  return (
    <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container nav-inner">
        <Link to="/" className="brand" onClick={close}>
          <BrandLogo />
          <span>Ani<b>Harvest</b></span>
        </Link>

        <button className={`burger ${open ? 'open' : ''}`} onClick={() => setOpen(!open)} aria-label="Menu">
          <span /><span /><span />
        </button>

        <nav className={`nav-links ${open ? 'open' : ''}`}>
          <NavLink to="/" end onClick={close}>{user?.role === 'farmer' ? '📊 Analytics' : 'Home'}</NavLink>
          <NavLink to="/market" onClick={close} data-tour="nav-market">Marketplace</NavLink>
          <NavLink to="/farms" onClick={close} data-tour="nav-farms">Farms</NavLink>
          {user?.role === 'farmer' && <NavLink to="/farmer" onClick={close} data-tour="nav-myfarm">My Farm</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin" onClick={close}>Admin</NavLink>}
          {user && <NavLink to="/orders" onClick={close} data-tour="nav-orders">Orders</NavLink>}

          <NavLink to="/cart" data-tour="cart" className={`cart-link ${bump ? 'bump' : ''}`} onClick={close}>
            🧺 <span className="cart-count">{count}</span>
          </NavLink>

          {user && user.role !== 'admin' && (
            <NavLink to="/wallet" onClick={close} data-tour="wallet" className="wallet-chip" title="My e-Wallet">
              👛 {peso(user.wallet_balance)}
            </NavLink>
          )}

          {user ? (
            <div className="nav-user">
              <NavLink to="/profile" onClick={close} data-tour="profile" className="avatar" title="My profile">
                {user.name.charAt(0).toUpperCase()}
              </NavLink>
              <button className="btn btn-ghost btn-sm" onClick={doLogout}>Logout</button>
            </div>
          ) : (
            <div className="nav-user">
              <NavLink to="/login" onClick={close}>Login</NavLink>
              <Link to="/register" data-tour="join" className="btn btn-primary btn-sm" onClick={close}>Join Free</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
