import test from 'node:test';
import assert from 'node:assert/strict';
import { findIdempotentTransaction } from '../src/services/idempotencyService.js';

test('returns existing transaction when idempotency match is found', async () => {
  const mockClient = {
    query: async () => ({ rows: [{ id: 10, idempotency_key: 'abc' }] })
  };

  const tx = await findIdempotentTransaction({ client: mockClient, senderId: 1, idempotencyKey: 'abc' });
  assert.equal(tx.id, 10);
});
