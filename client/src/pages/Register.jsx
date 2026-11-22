import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { AuthShell } from './Login.jsx';
import { toast } from '../components/Toast.jsx';
import PasswordInput from '../components/PasswordInput.jsx';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    role: params.get('role') === 'farmer' ? 'farmer' : 'buyer',
    name: '', email: '', password: '', phone: '', address: '', farm_name: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const u = await register(form);
      toast(`🌱 Welcome to AniHarvest, ${u.name.split(' ')[0]}!`);
      nav('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Join AniHarvest" subtitle="Create a free account — it takes less than a minute.">
      <div className="role-pick">
        {[['buyer', '🛒', 'I want to buy'], ['farmer', '👩‍🌾', 'I want to sell']].map(([r, icon, label]) => (
          <button type="button" key={r} className={form.role === r ? 'active' : ''} onClick={() => setForm({ ...form, role: r })}>
            <span>{icon}</span>{label}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="form">
        <label>Full name<input name="name" required value={form.name} onChange={change} /></label>
        {form.role === 'farmer' && (
          <label className="pop-in">Farm name<input name="farm_name" required value={form.farm_name} onChange={change} placeholder="e.g. Sunrise Valley Farm" /></label>
        )}
        <label>Email<input type="email" name="email" required value={form.email} onChange={change} /></label>
        <label>Password<PasswordInput name="password" required minLength={6} value={form.password} onChange={change} autoComplete="new-password" /></label>
        <div className="form-2">
          <label>Phone<input name="phone" value={form.phone} onChange={change} /></label>
          <label>{form.role === 'farmer' ? 'Farm location' : 'Address'}<input name="address" value={form.address} onChange={change} /></label>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? 'Creating account…' : 'Create Account'}</button>
      </form>
      <p className="center">Already have an account? <Link to="/login">Log in</Link></p>
    </AuthShell>
  );
}
