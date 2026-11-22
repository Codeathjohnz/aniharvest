import { useCallback, useEffect, useState } from 'react';
import { api, imageUrl } from '../api.js';
import { providerStyle } from './QrPayPanel.jsx';
import { toast } from './Toast.jsx';

const EMPTY = { provider: 'GCash', account_name: '', account_number: '', qr_image: '', instructions: '', is_active: true };
const SUGGESTIONS = ['GCash', 'Maya', 'GoTyme', 'BPI', 'BDO', 'UnionBank', 'Landbank'];

function MethodForm({ method, onClose, onSaved }) {
  const [form, setForm] = useState(method ? { ...EMPTY, ...method, qr_image: method.qr_image || '', instructions: method.instructions || '', is_active: Number(method.is_active) === 1 } : EMPTY);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const st = providerStyle(form.provider);

  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const upload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const d = await api('upload.php', { method: 'POST', form: fd });
      setForm((f) => ({ ...f, qr_image: d.path }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (method?.id) await api(`payment_methods.php?id=${method.id}`, { method: 'PUT', body: form });
      else await api('payment_methods.php', { method: 'POST', body: form });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <form className="modal card" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{method?.id ? '✏️ Edit Payment Method' : '💳 Add Payment Method'}</h2>
        <p className="muted">Buyers will see this QR code, name and number when they pay.</p>
        <div className="pm-form">
          <div className="pm-qr-upload" style={{ '--pm': st.color }}>
            <div className="pm-qr-box">
              {form.qr_image ? <img src={imageUrl(form.qr_image)} alt="QR code" /> : <span>{st.icon}<small>No QR yet</small></span>}
            </div>
            <label className="btn btn-outline btn-sm file-btn">
              {uploading ? 'Uploading…' : form.qr_image ? '🔁 Change QR' : '📷 Upload QR code'}
              <input type="file" accept="image/*" onChange={upload} hidden />
            </label>
            {form.qr_image && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm({ ...form, qr_image: '' })}>Remove</button>}
          </div>
          <div className="form" style={{ margin: 0 }}>
            <label>E-wallet / bank name
              <input name="provider" list="pm-suggestions" required value={form.provider} onChange={change} placeholder="GCash" />
              <datalist id="pm-suggestions">{SUGGESTIONS.map((s) => <option key={s} value={s} />)}</datalist>
            </label>
            <label>Account name<input name="account_name" required value={form.account_name} onChange={change} placeholder="e.g. Juan D." /></label>
            <label>Account / mobile number<input name="account_number" required value={form.account_number} onChange={change} placeholder="09XXXXXXXXX" /></label>
            <label>Note for buyers (optional)<input name="instructions" value={form.instructions} onChange={change} placeholder="e.g. Please put your name in the message" /></label>
            <label className="switch-row">
              <input type="checkbox" name="is_active" checked={form.is_active} onChange={change} />
              <span className="switch" /> Show to buyers
            </label>
          </div>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy || uploading}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}

export default function PaymentMethodsAdmin() {
  const [list, setList] = useState(null);
  const [editing, setEditing] = useState(null);

  const load = useCallback(() => {
    api('payment_methods.php?all=1').then(setList).catch((e) => toast(e.message, 'error'));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const del = async (m) => {
    if (!confirm(`Delete ${m.provider} (${m.account_number})?`)) return;
    await api(`payment_methods.php?id=${m.id}`, { method: 'DELETE' });
    toast('Payment method deleted');
    load();
  };

  return (
    <div>
      <div className="dash-head" style={{ marginBottom: 16 }}>
        <p className="muted" style={{ margin: 0 }}>Add your GCash, Maya or bank account with its QR code. Buyers pay to these accounts, then you verify in the <b>Payments</b> tab.</p>
        <button className="btn btn-primary" onClick={() => setEditing({})}>+ Add Payment Method</button>
      </div>
      {list && list.length === 0 && (
        <div className="empty"><div className="empty-icon">💳</div><h3>No payment methods yet</h3><p>Add your GCash number and QR code so buyers can pay you.</p></div>
      )}
      <div className="pm-grid">
        {(list || []).map((m) => {
          const st = providerStyle(m.provider);
          return (
            <div key={m.id} className={`pm-card pop-in ${Number(m.is_active) ? '' : 'inactive'}`} style={{ '--pm': st.color }}>
              <div className="pm-card-head"><span>{st.icon} {m.provider}</span>{!Number(m.is_active) && <small>Hidden</small>}</div>
              <div className="pm-card-qr">{m.qr_image ? <img src={imageUrl(m.qr_image)} alt="QR" /> : <span>No QR</span>}</div>
              <b>{m.account_name}</b>
              <span className="mono">{m.account_number}</span>
              {m.instructions && <small className="muted">📝 {m.instructions}</small>}
              <div className="pm-card-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(m)}>✏️ Edit</button>
                <button className="btn btn-ghost btn-sm" onClick={() => del(m)}>🗑️</button>
              </div>
            </div>
          );
        })}
      </div>
      {editing && (
        <MethodForm method={editing.id ? editing : null} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); toast('💳 Payment method saved'); load(); }} />
      )}
    </div>
  );
}
