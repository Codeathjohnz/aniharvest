import BrandLogo from '../components/BrandLogo.jsx';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from '../components/Toast.jsx';
import PasswordInput from '../components/PasswordInput.jsx';

export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="auth">
      <div className="auth-art" aria-hidden="true">
        <div className="auth-sun" />
        <div className="auth-field" />
        <span className="auth-veg v1">🥕</span>
        <span className="auth-veg v2">🍅</span>
        <span className="auth-veg v3">🌽</span>
        <span className="auth-veg v4">🥬</span>
        <span className="auth-veg v5">🍆</span>
        <div className="auth-quote">
          <h2>“The ultimate goal of farming is not the growing of crops, but the cultivation of people.”</h2>
        </div>
      </div>
      <div className="auth-form-wrap">
        <div className="auth-card">
          <Link to="/" className="brand"><BrandLogo /><span>Ani<b>Harvest</b></span></Link>
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

// farmers land on their analytics, buyers on the product ads (both are "/")
const home = (role) => (role === 'admin' ? '/admin' : '/');

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const u = await login(form.email, form.password);
      toast(`👋 Welcome back, ${u.name.split(' ')[0]}!`);
      nav(params.get('next') === 'cart' ? '/cart' : home(u.role));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const demo = (email, password) => setForm({ email, password });

  return (
    <AuthShell title="Welcome back" subtitle="Log in to your AniHarvest account.">
      <form onSubmit={submit} className="form">
        <label>Email<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>Password<PasswordInput required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        {error && <div className="alert alert-error">{error}</div>}
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? 'Logging in…' : 'Log In'}</button>
      </form>
      <div className="demo-box">
        <small>Try a demo account:</small>
        <div>
          <button type="button" onClick={() => demo('buyer@aniharvest.com', 'buyer123')}>🛒 Buyer</button>
          <button type="button" onClick={() => demo('farmer@aniharvest.com', 'farmer123')}>👩‍🌾 Farmer</button>
          {/* the demo admin password only exists locally; online the admin password comes from ADMIN_PASSWORD */}
          {import.meta.env.DEV && <button type="button" onClick={() => demo('admin@aniharvest.com', 'admin123')}>🛡️ Admin</button>}
        </div>
      </div>
      <p className="center">New here? <Link to="/register">Create an account</Link></p>
    </AuthShell>
  );
}
