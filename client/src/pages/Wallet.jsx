import { useCallback, useEffect, useState } from 'react';
import { api, peso } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import WalletModal from '../components/WalletModal.jsx';
import { usePageTour } from '../tour/Tour.jsx';

const TYPES = {
  cash_in: { icon: '➕', label: 'Cash in' },
  payment: { icon: '🧺', label: 'Order payment' },
  refund: { icon: '↩️', label: 'Refund' },
  earning: { icon: '🌾', label: 'Sales earning' },
  withdraw: { icon: '🏧', label: 'Withdrawal' },
};

export default function Wallet() {
  usePageTour('wallet');
  const { user, refreshUser } = useAuth();
  const [data, setData] = useState(null);
  const [modal, setModal] = useState(null);
  const [error, setError] = useState('');

  const [requests, setRequests] = useState([]);
  const load = useCallback(() => {
    api('wallet.php').then(setData).catch((e) => setError(e.message));
    if (user.role === 'buyer') {
      api('payments.php').then((d) => setRequests(d.filter((s) => s.purpose === 'cash_in' && s.status !== 'approved'))).catch(() => {});
    }
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const isBuyer = user.role === 'buyer';
  const tx = data?.transactions || [];
  const totalIn = tx.filter((t) => t.amount > 0).reduce((s, t) => s + Number(t.amount), 0);
  const totalOut = tx.filter((t) => t.amount < 0).reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="container page-pad">
      <h1 className="page-title">👛 My e-Wallet</h1>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="wallet-top">
        <div className="wallet-card pop-in">
          <div className="wc-leaf" aria-hidden="true">🌾</div>
          <small>AniHarvest e-Wallet</small>
          <div className="wc-balance">{peso(data ? data.balance : user.wallet_balance)}</div>
          <div className="wc-name">{user.name}</div>
          <div className="wc-actions">
            {isBuyer ? (
              <button className="btn btn-gold" onClick={() => setModal('cash_in')}>➕ Cash In</button>
            ) : (
              <button className="btn btn-gold" onClick={() => setModal('withdraw')}>🏧 Withdraw</button>
            )}
          </div>
          <div className="wc-chips" aria-hidden="true">
            <span>📱 GCash</span><span>💳 Maya</span><span>🏦 Bank</span>
          </div>
        </div>

        <div className="wallet-side">
          <div className="dash-stat pop-in">
            <span className="dash-stat-icon">⬇️</span>
            <div><small>{isBuyer ? 'Total cashed in & refunds' : 'Total earned'}</small><b>{peso(totalIn)}</b></div>
          </div>
          <div className="dash-stat pop-in" style={{ animationDelay: '.1s' }}>
            <span className="dash-stat-icon">⬆️</span>
            <div><small>{isBuyer ? 'Total spent' : 'Total withdrawn'}</small><b>{peso(Math.abs(totalOut))}</b></div>
          </div>
          <div className="card how-wallet">
            <b>How it works</b>
            {isBuyer ? (
              <ol>
                <li>Cash in by scanning our GCash / Maya QR code and submitting the reference number.</li>
                <li>Your wallet is credited once the admin verifies the payment.</li>
                <li>At checkout, choose <b>E-Wallet</b> to pay instantly.</li>
                <li>Cancelled orders are refunded to your wallet automatically.</li>
              </ol>
            ) : (
              <ol>
                <li>Buyers pay for orders using their e-Wallet.</li>
                <li>When you mark an order <b>Delivered</b>, your share is credited here.</li>
                <li>Withdraw your earnings to GCash, Maya or your bank.</li>
              </ol>
            )}
          </div>
        </div>
      </div>

      {requests.length > 0 && (
        <>
          <h2 className="related-title">Cash-in requests</h2>
          <div className="tx-list" style={{ marginBottom: 30 }}>
            {requests.map((s) => (
              <div key={s.id} className="tx pop-in">
                <span className={`tx-icon ${s.status === 'rejected' ? 'tx-payment' : 'tx-earning'}`}>{s.status === 'pending' ? '⏳' : '❌'}</span>
                <div className="tx-info">
                  <b>Cash in via {s.provider} — {s.status === 'pending' ? 'waiting for verification' : 'rejected'}</b>
                  <small className="muted">
                    {new Date(s.created_at.replace(' ', 'T')).toLocaleString()} · Ref {s.reference_no}
                    {s.admin_note ? ` · Reason: ${s.admin_note}` : ''}
                  </small>
                </div>
                <div className="tx-amt"><b className={s.status === 'pending' ? '' : 'minus'}>{peso(s.amount)}</b></div>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="related-title">Transaction history</h2>
      {data && tx.length === 0 && (
        <div className="empty"><div className="empty-icon">👛</div><h3>No transactions yet</h3>
          <p>{isBuyer ? 'Cash in to start paying with your e-Wallet.' : 'Earnings from e-Wallet orders will appear here.'}</p></div>
      )}
      <div className="tx-list">
        {tx.map((t, i) => {
          const ty = TYPES[t.type] || { icon: '•', label: t.type };
          const plus = Number(t.amount) > 0;
          return (
            <div key={t.id} className="tx pop-in" style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}>
              <span className={`tx-icon tx-${t.type}`}>{ty.icon}</span>
              <div className="tx-info">
                <b>{t.description || ty.label}</b>
                <small className="muted">
                  {new Date(t.created_at.replace(' ', 'T')).toLocaleString()} · Ref {t.reference}
                  {t.account ? ` · ${t.account}` : ''}
                </small>
              </div>
              <div className="tx-amt">
                <b className={plus ? 'plus' : 'minus'}>{plus ? '+' : '−'}{peso(Math.abs(t.amount))}</b>
                <small className="muted">Bal {peso(t.balance_after)}</small>
              </div>
            </div>
          );
        })}
      </div>

      {modal && <WalletModal mode={modal} onClose={() => setModal(null)} onDone={load} />}
    </div>
  );
}
