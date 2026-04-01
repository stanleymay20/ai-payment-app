import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const TransactionsPage = () => {
  const [rows, setRows] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      const { data } = await api.get('/payments/transactions');
      setRows(data);
    };
    load();
  }, []);

  return (
    <div className="panel">
      <h2>Transaction History</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Direction</th>
              <th>Counterparty</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Risk</th>
              <th>Route</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((tx) => {
              const outgoing = tx.sender_email === user.email;
              return (
                <tr key={tx.id}>
                  <td>{new Date(tx.created_at).toLocaleString()}</td>
                  <td>{outgoing ? 'Sent' : 'Received'}</td>
                  <td>{outgoing ? tx.recipient_email : tx.sender_email}</td>
                  <td>${Number(tx.amount).toFixed(2)}</td>
                  <td>{tx.status || "approved"}</td>
                  <td>
                    {tx.risk_score} {tx.is_flagged ? '⚠️' : '✅'}
                  </td>
                  <td title={tx.route_explanation || ""}>{tx.route_provider || "N/A"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionsPage;
