import { useState } from 'react';
import { api, imageUrl, peso } from '../api.js';

export function providerStyle(name = '') {
  const n = name.toLowerCase();
  if (n.includes('gcash')) return { icon: '📱', color: '#0a5bd9' };
  if (n.includes('maya') || n.includes('paymaya')) return { icon: '💳', color: '#11a36b' };
  if (n.includes('gotyme')) return { icon: '💠', color: '#00a4b4' };
  return { icon: '🏦', color: '#6b4a2b' };
}

/**
 * Shows the admin's payment account (QR code, name, number) and collects the buyer's
 * reference number + screenshot. Controlled by the parent through `value` / `onChange`.
 * value = { methodId, reference, proof }
 */
export default function QrPayPanel({ methods, amount, value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(false);

  const m = methods.find((x) => String(x.id) === String(value.methodId)) || methods[0];
  if (!m) return <div className="alert alert-error">No payment accounts have been set up yet. Please choose another payment method.</div>;
  const st = providerStyle(m.provider);
  const set = (patch) => onChange({ ...value, methodId: m.id, ...patch });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(m.account_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked */ }
  };

  const upload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setErr('');
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const d = await api('upload.php', { method: 'POST', form: fd });
      set({ proof: d.path });
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="qr-panel pop-in" style={{ '--pm': st.color }}>
      {methods.length > 1 && (
        <div className="qr-tabs">
          {methods.map((x) => {
            const s = providerStyle(x.provider);
            return (
              <button type="button" key={x.id} className={x.id === m.id ? 'active' : ''} style={{ '--pm': s.color }}
                onClick={() => onChange({ ...value, methodId: x.id })}>
                {s.icon} {x.provider}
              </button>
            );
          })}
        </div>
      )}

      <div className="qr-body">
        <button type="button" className="qr-img" onClick={() => m.qr_image && setZoom(true)} title="Tap to enlarge">
          {m.qr_image ? <img src={imageUrl(m.qr_image)} alt={`${m.provider} QR code`} /> : <span className="qr-none">{st.icon}<small>No QR uploaded</small></span>}
        </button>
        <div className="qr-info">
          <span className="qr-provider" style={{ background: st.color }}>{st.icon} {m.provider}</span>
          <div className="qr-row"><small>Account name</small><b>{m.account_name}</b></div>
          <div className="qr-row">
            <small>Account number</small>
            <b className="mono">{m.account_number}
              <button type="button" className="copy-btn" onClick={copy}>{copied ? '✓ Copied' : 'Copy'}</button>
            </b>
          </div>
          <div className="qr-row"><small>Amount to send</small><b className="qr-amount">{peso(amount)}</b></div>
        </div>
      </div>

      <ol className="qr-steps">
        <li>Open your <b>{m.provider}</b> app and scan the QR code (or send to the number above).</li>
        <li>Send exactly <b>{peso(amount)}</b>.</li>
        <li>Enter the <b>reference number</b> and upload a screenshot of the receipt.</li>
      </ol>
      {m.instructions && <p className="qr-note">📝 {m.instructions}</p>}

      <div className="form qr-form">
        <label>{m.provider} reference number
          <input required value={value.reference || ''} onChange={(e) => set({ reference: e.target.value })} placeholder="e.g. 1012 345 678901" />
        </label>
        <div className="upload-row">
          <div className="upload-preview proof-preview">
            {value.proof ? <img src={imageUrl(value.proof)} alt="Payment proof" /> : <span>🧾</span>}
          </div>
          <div>
            <label className="btn btn-outline btn-sm file-btn">
              {uploading ? 'Uploading…' : value.proof ? '🔁 Change screenshot' : '📷 Upload receipt screenshot'}
              <input type="file" accept="image/*" onChange={upload} hidden />
            </label>
            <small className="muted d-block">Optional but speeds up verification.</small>
          </div>
        </div>
        {err && <div className="alert alert-error">{err}</div>}
      </div>

      {zoom && (
        <div className="modal-bg qr-zoom" onClick={() => setZoom(false)}>
          <img src={imageUrl(m.qr_image)} alt={`${m.provider} QR code`} />
        </div>
      )}
    </div>
  );
}
