import { useEffect, useState } from 'react';
import { api, imageUrl } from '../api.js';

const EMOJIS = ['🌱', '🥬', '🥦', '🥕', '🍅', '🌽', '🍆', '🥒', '🌶️', '🧅', '🧄', '🥔', '🍠', '🍎', '🥭', '🍌', '🍍', '🍓', '🍉', '🥥', '🍋', '🌾', '🥚', '🥛', '🐔', '🐟', '🌿', '🍄'];

const EMPTY = { name: '', category_id: '', description: '', price: '', unit: 'kg', stock: '', emoji: '🌱', image: '', is_organic: false, status: 'active' };

export default function ProductForm({ product, onSaved, onCancel }) {
  const [cats, setCats] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api('categories.php').then(setCats).catch(() => {});
  }, []);

  useEffect(() => {
    setForm(product ? { ...EMPTY, ...product, image: product.image || '', is_organic: Number(product.is_organic) === 1 } : EMPTY);
  }, [product]);

  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const upload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    try {
      const d = await api('upload.php', { method: 'POST', form: fd });
      setForm((f) => ({ ...f, image: d.path }));
    } catch (err) {
      setError(err.message);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (product?.id) await api(`products.php?id=${product.id}`, { method: 'PUT', body: form });
      else await api('products.php', { method: 'POST', body: form });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-bg" onClick={onCancel}>
      <form className="modal card" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{product?.id ? '✏️ Edit Product' : '🌱 Add New Harvest'}</h2>
        <div className="form">
          <label>Product name<input name="name" required value={form.name} onChange={change} /></label>
          <div className="form-2">
            <label>Category
              <select name="category_id" required value={form.category_id} onChange={change}>
                <option value="">Choose…</option>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </label>
            <label>Status
              <select name="status" value={form.status} onChange={change}>
                <option value="active">Active (visible)</option>
                <option value="inactive">Hidden</option>
              </select>
            </label>
          </div>
          <div className="form-3">
            <label>Price (₱)<input type="number" step="0.01" min="0.01" name="price" required value={form.price} onChange={change} /></label>
            <label>Unit<input name="unit" required value={form.unit} onChange={change} placeholder="kg, bundle, tray" /></label>
            <label>Stock<input type="number" min="0" name="stock" required value={form.stock} onChange={change} /></label>
          </div>
          <label>Description<textarea name="description" rows="3" value={form.description} onChange={change} /></label>

          <label>Icon (used when there is no photo)</label>
          <div className="emoji-pick">
            {EMOJIS.map((em) => (
              <button type="button" key={em} className={form.emoji === em ? 'active' : ''} onClick={() => setForm({ ...form, emoji: em })}>{em}</button>
            ))}
          </div>

          <div className="upload-row">
            <div className="upload-preview">
              {form.image ? <img src={imageUrl(form.image)} alt="" /> : <span>{form.emoji}</span>}
            </div>
            <div>
              <label className="btn btn-outline btn-sm file-btn">📷 Upload photo<input type="file" accept="image/*" onChange={upload} hidden /></label>
              {form.image && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm({ ...form, image: '' })}>Remove</button>}
            </div>
          </div>

          <label className="switch-row">
            <input type="checkbox" name="is_organic" checked={form.is_organic} onChange={change} />
            <span className="switch" /> Organically grown
          </label>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save Product'}</button>
        </div>
      </form>
    </div>
  );
}
