import { useMemo, useState } from 'react';
import cryptoRandomString from '../utils/cryptoRandomString';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const SendPaymentPage = () => {
  const { refreshUser } = useAuth();
  const [form, setForm] = useState({ recipientEmail: '', amount: '', note: '', priority: 'balanced' });
  const [route, setRoute] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState(() => cryptoRandomString());

  const numericAmount = useMemo(() => Number(form.amount || 0), [form.amount]);

  const suggestRoute = async () => {
    if (!numericAmount || numericAmount <= 0) return;
    const { data } = await api.post('/payments/route-suggestion', {
      amount: numericAmount,
      priority: form.priority
    });
    setRoute(data);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    try {
      const { data } = await api.post('/payments/send', {
        ...form,
        amount: numericAmount
      }, { headers: { 'Idempotency-Key': idempotencyKey } });
      setResult(data);
      setIdempotencyKey(cryptoRandomString());
      await refreshUser();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send payment');
    }
  };

  return (
    <div className="panel">
      <h2>Send Payment</h2>
      <form onSubmit={submit}>
        <input
          type="email"
          placeholder="Recipient email"
          value={form.recipientEmail}
          onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })}
          required
        />
        <input
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Amount"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          required
        />
        <textarea
          placeholder="Optional note"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
        />
        <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
          <option value="balanced">Balanced</option>
          <option value="fastest">Fastest</option>
          <option value="cheapest">Cheapest</option>
        </select>
        <div className="inline-actions">
          <button type="button" className="secondary" onClick={suggestRoute}>Get AI Route Suggestion</button>
          <button type="submit">Send Payment</button>
        </div>
      </form>

      {route && (
        <div className="result">
          <h3>Route Recommendation</h3>
          <p>
            Best provider: <strong>{route.recommended.provider}</strong> (Fee: ${route.recommended.estimatedFee})
          </p>
        </div>
      )}

      {result && (
        <div className="result">
          <h3>Payment Sent</h3>
          <p>Transaction #{result.transaction.id} status: <strong>{result.transaction.status || result.status}</strong>.</p>
          <p>
            Fraud Risk Score: <strong>{result.fraud.riskScore}</strong> ({result.fraud.flagged ? 'Flagged' : 'Safe'})
          </p>
          <p>{result.fraud.reasons.join(' ')}</p>
          <p>{result.route.selectionReason}</p>
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default SendPaymentPage;
