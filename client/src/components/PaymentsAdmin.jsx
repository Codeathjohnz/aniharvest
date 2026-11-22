import { useCallback, useEffect, useState } from 'react';
import { api, imageUrl, peso } from '../api.js';
import { providerStyle } from './QrPayPanel.jsx';
import { toast } from './Toast.jsx';

/** Admin verification queue for GCash/Maya payments submitted by buyers. */
export default function PaymentsAdmin({ onChange }) {
  const [filter, setFilter] = useState('pending');
  const [list, setList] = useState(null);
  const [zoom, setZoom] = useState(null);

  const load = useCallback(() => {
    api(`payments.php?status=${filter}`).then(setList).catch((e) => toast(e.message, 'error'));
  }, [filter]);
  useEffect(() => {
    load();
  }, [load]);

  const decide = async (s, status) => {
    let note = '';
    if (status === 'rejected') {
      note = prompt('Reason for rejecting (the buyer will see this):', 'Payment not found in our account');
      if (note === null) return;
    } else if (!confirm(`Confirm you received ${peso(s.amount)} via ${s.provider} (ref ${s.reference_no})?`)) {
      return;
    }
    try {
      await api(`payments.php?id=${s.id}`, { method: 'PUT', body: { status, note } });
      toast(status === 'approved' ? `✅ Payment approved — ${peso(s.amount)}` : '❌ Payment rejected');
      load();
      onChange?.();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  return (
    <div>
      <div className="tabs">
        {['pending', 'approved', 'rejected'].map((s) => (
          <button key={s} className={filter === s ? 'active' : ''} onClick={() => setFilter(s)}>
            {{ pending: '⏳', approved: '✅', rejected: '❌' }[s]} {s}
          </button>
        ))}
      </div>
      {list && list.length === 0 && (
        <div className="empty"><div className="empty-icon">🧾</div><h3>No {filter} payments</h3>
          <p>{filter === 'pending' ? 'All caught up! New GCash/Maya payments will appear here.' : 'Nothing here yet.'}</p></div>
      )}
      <div className="pay-queue">
        {(list || []).map((s, i) => {
          const st = providerStyle(s.provider);
          return (
            <div key={s.id} className="card pay-item pop-in" style={{ '--pm': st.color, animationDelay: `${Math.min(i, 10) * 50}ms` }}>
              <button className="pay-proof" onClick={() => s.proof_image && setZoom(imageUrl(s.proof_image))} title="View receipt">
                {s.proof_image ? <img src={imageUrl(s.proof_image)} alt="Receipt" /> : <span>🧾<small>No screenshot</small></span>}
              </button>
              <div className="pay-details">
                <div className="pay-top">
                  <span className="qr-provider" style={{ background: st.color }}>{st.icon} {s.provider}</span>
                  <span className={`status status-${s.status === 'approved' ? 'delivered' : s.status === 'rejected' ? 'cancelled' : 'pending'}`}>{s.status}</span>
                </div>
                <div className="pay-amount">{peso(s.amount)}</div>
                <div className="pay-meta">
                  <span>👤 <b>{s.user_name}</b> <small className="muted">{s.user_email}</small></span>
                  <span>🔖 Ref: <b className="mono">{s.reference_no}</b></span>
                  <span>{s.purpose === 'cash_in' ? '👛 Wallet cash-in' : `🧺 Order #${s.order_id}${s.order_status ? ` (${s.order_status})` : ''}`}</span>
                  <span>📥 To: {s.account_name} · {s.account_number}</span>
                  <span className="muted">🕒 {new Date(s.created_at.replace(' ', 'T')).toLocaleString()}</span>
                  {s.admin_note && <span className="muted">📝 {s.admin_note}</span>}
                </div>
                {s.status === 'pending' && (
                  <div className="pay-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => decide(s, 'approved')}>✅ Approve</button>
                    <button className="btn btn-danger btn-sm" onClick={() => decide(s, 'rejected')}>Reject</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {zoom && <div className="modal-bg qr-zoom" onClick={() => setZoom(null)}><img src={zoom} alt="Receipt" /></div>}
    </div>
  );
}
