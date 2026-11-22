import { useEffect, useState } from 'react';
import { api, peso } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import QrPayPanel from './QrPayPanel.jsx';

const QUICK = [100, 500, 1000, 2000, 5000];
const WITHDRAW_METHODS = [
  { id: 'GCash', icon: '📱', color: '#0a5bd9', hint: 'GCash mobile number', placeholder: '09XXXXXXXXX' },
  { id: 'Maya', icon: '💳', color: '#11a36b', hint: 'Maya mobile number', placeholder: '09XXXXXXXXX' },
  { id: 'Bank Transfer', icon: '🏦', color: '#6b4a2b', hint: 'Bank account number', placeholder: 'Account number' },
];

/** Buyer cash-in: pay the admin's GCash/Maya QR, submit reference → admin verifies. */
function CashIn({ suggested, onClose, onDone }) {
  const [methods, setMethods] = useState(null);
  const [amount, setAmount] = useState(suggested ? Math.ceil(suggested) : '');
  const [pay, setPay] = useState({ methodId: '', reference: '', proof: '' });
  const [step, setStep] = useState('amount');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api('payment_methods.php').then(setMethods).catch((e) => setError(e.message));
  }, []);

  const next = (e) => {
    e.preventDefault();
    if (Number(amount) < 20) return setError('Minimum cash-in is ₱20.');
    setError('');
    setStep('pay');
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('payments.php', {
        method: 'POST',
        body: { amount: Number(amount), payment_method_id: pay.methodId || methods[0].id, reference_no: pay.reference, proof_image: pay.proof },
      });
      setStep('done');
      onDone?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (step === 'done') {
    return (
      <div className="wallet-success">
        <div className="success-check pending-check">⏳</div>
        <h2>Payment submitted!</h2>
        <p className="muted">We're verifying your {peso(amount)} payment. Your wallet will be credited as soon as the admin confirms it — usually within a few minutes.</p>
        <button className="btn btn-primary btn-block" onClick={onClose}>OK, got it</button>
      </div>
    );
  }

  return (
    <form onSubmit={step === 'amount' ? next : submit}>
      <h2>➕ Cash In</h2>
      {methods && methods.length === 0 && (
        <div className="alert alert-error">Cash-in isn't available yet — the admin hasn't added a GCash/Maya account.</div>
      )}
      {step === 'amount' ? (
        <>
          <p className="muted">How much would you like to load into your e-Wallet?</p>
          <div className="form">
            <label>Amount (₱)
              <input type="number" min="20" max="50000" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" autoFocus />
            </label>
            <div className="quick-amounts">
              {QUICK.map((q) => (
                <button type="button" key={q} className={Number(amount) === q ? 'active' : ''} onClick={() => setAmount(q)}>₱{q.toLocaleString()}</button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <QrPayPanel methods={methods || []} amount={Number(amount)} value={pay} onChange={setPay} />
      )}
      {error && <div className="alert alert-error">{error}</div>}
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={step === 'pay' ? () => setStep('amount') : onClose}>
          {step === 'pay' ? '← Back' : 'Cancel'}
        </button>
        <button className="btn btn-primary" disabled={busy || !methods?.length}>
          {step === 'amount' ? 'Next: Pay →' : busy ? 'Submitting…' : 'I have paid — Submit'}
        </button>
      </div>
    </form>
  );
}

/** Farmer withdrawal (recorded; admin sends the money manually). */
function Withdraw({ onClose, onDone }) {
  const { user, refreshUser } = useAuth();
  const [method, setMethod] = useState('GCash');
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState((user?.phone || '').replace(/\D/g, ''));
  const [receipt, setReceipt] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const m = WITHDRAW_METHODS.find((x) => x.id === method);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const d = await api('wallet.php?action=withdraw', { method: 'POST', body: { amount: Number(amount), method, account } });
      setReceipt({ ...d, amount: Number(amount), method, date: new Date() });
      await refreshUser();
      onDone?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (receipt) {
    return (
      <div className="wallet-success">
        <div className="success-check">✓</div>
        <h2>Withdrawal requested!</h2>
        <div className="receipt">
          <div><span>Amount</span><b>{peso(receipt.amount)}</b></div>
          <div><span>Send to</span><b>{receipt.method}</b></div>
          <div><span>Reference no.</span><b className="mono">{receipt.reference}</b></div>
          <div className="receipt-total"><span>New wallet balance</span><b>{peso(receipt.balance)}</b></div>
        </div>
        <button className="btn btn-primary btn-block" onClick={onClose}>Done</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <h2>🏧 Withdraw Earnings</h2>
      <p className="muted">Available: {peso(user.wallet_balance)}</p>
      <div className="pay-methods">
        {WITHDRAW_METHODS.map((x) => (
          <button type="button" key={x.id} className={`pay-method ${method === x.id ? 'active' : ''}`} style={{ '--pm': x.color }}
            onClick={() => { setMethod(x.id); setAccount(x.id !== 'Bank Transfer' ? (user?.phone || '').replace(/\D/g, '') : ''); }}>
            <span className="pm-icon">{x.icon}</span><b>{x.id}</b>
          </button>
        ))}
      </div>
      <div className="form">
        <label>Amount (₱)<input type="number" min="100" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
        <label>{m.hint}<input required value={account} onChange={(e) => setAccount(e.target.value)} placeholder={m.placeholder} inputMode="numeric" /></label>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Sending…' : `Withdraw to ${method}`}</button>
      </div>
    </form>
  );
}

export default function WalletModal({ mode = 'cash_in', suggested = 0, onClose, onDone }) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal card wallet-modal" onClick={(e) => e.stopPropagation()}>
        {mode === 'cash_in'
          ? <CashIn suggested={suggested} onClose={onClose} onDone={onDone} />
          : <Withdraw onClose={onClose} onDone={onDone} />}
      </div>
    </div>
  );
}
