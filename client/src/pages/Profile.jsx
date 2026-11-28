import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from '../components/Toast.jsx';
import { usePageTour, useTour } from '../tour/Tour.jsx';
import { LocationPicker, hasPin } from '../components/MapPin.jsx';

export default function Profile() {
  usePageTour('profile');
  const tour = useTour();
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: user.name, phone: user.phone || '', address: user.address || '', farm_name: user.farm_name || '',
  });
  const [busy, setBusy] = useState(false);
  const [pin, setPin] = useState(hasPin(user.lat, user.lng) ? { lat: +user.lat, lng: +user.lng } : null);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await updateProfile({ ...form, lat: pin?.lat ?? null, lng: pin?.lng ?? null });
      toast('✅ Profile updated');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container page-pad narrow">
      <div className="card profile pop-in">
        <div className="profile-head">
          <div className="avatar avatar-lg">{user.name.charAt(0).toUpperCase()}</div>
          <div>
            <h2>{user.name}</h2>
            <span className={`role role-${user.role}`}>{user.role}</span> <small className="muted">{user.email}</small>
          </div>
        </div>
        <form className="form" onSubmit={submit}>
          <label>Full name<input name="name" required value={form.name} onChange={change} /></label>
          {user.role === 'farmer' && <label>Farm name<input name="farm_name" value={form.farm_name} onChange={change} /></label>}
          <label>Phone<input name="phone" value={form.phone} onChange={change} /></label>
          <label>{user.role === 'farmer' ? 'Farm location' : 'Delivery address'}<textarea name="address" rows="2" value={form.address} onChange={change} /></label>
          {user.role !== 'admin' && (
            <div className="pin-field">
              <div className="pay-label">{user.role === 'farmer' ? 'Farm location on the map' : 'Default delivery pin'} <span className="muted small">(used at checkout)</span></div>
              <LocationPicker value={pin} onChange={setPin} height={240} />
            </div>
          )}
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save Changes'}</button>
        </form>
        <div className="guide-reset">
          <div>
            <b>💡 Bubble guides</b>
            <small className="muted">Tips that introduce the buttons on each page. They show once per page.</small>
          </div>
          <button type="button" className="btn btn-outline btn-sm" data-tour="reset-guides"
            onClick={() => { tour.resetAll(); toast('💡 Guides will show again on every page'); }}>
            Show the guides again
          </button>
        </div>
      </div>
    </div>
  );
}
