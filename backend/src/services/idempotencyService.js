export const findIdempotentTransaction = async ({ client, senderId, idempotencyKey }) => {
  const existing = await client.query(
    'SELECT * FROM transactions WHERE sender_id = $1 AND idempotency_key = $2 LIMIT 1',
    [senderId, idempotencyKey]
  );

  return existing.rows[0] || null;
};
