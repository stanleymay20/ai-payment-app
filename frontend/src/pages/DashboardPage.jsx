import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const DashboardPage = () => {
  const { user, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await api.get('/payments/transactions');
      setTransactions(data.slice(0, 5));
      await refreshUser();
    };
    load();
  }, [refreshUser]);

  return (
    <div>
      <section className="panel">
        <h2>Wallet Balance</h2>
        <h3>${Number(user?.wallet_balance || 0).toFixed(2)}</h3>
      </section>

      <section className="panel">
        <h2>Recent Transactions</h2>
        {transactions.map((tx) => (
          <div key={tx.id} className="tx-row">
            <div>
              <strong>${Number(tx.amount).toFixed(2)}</strong>
              <p>{new Date(tx.created_at).toLocaleString()}</p>
            </div>
            <div>
              <span>{tx.sender_email === user.email ? 'Sent' : 'Received'}</span>
              {tx.is_flagged && <small className="warn">Flagged ({tx.risk_score})</small>}
            </div>
          </div>
        ))}
        {!transactions.length && <p>No transactions yet.</p>}
      </section>
    </div>
  );
};

export default DashboardPage;
