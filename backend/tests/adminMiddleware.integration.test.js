import test from 'node:test';
import assert from 'node:assert/strict';
import { adminRequired } from '../src/middleware/admin.js';
import { pool } from '../src/config/db.js';

test('admin middleware blocks non-admin users', async () => {
  const original = pool.query;
  pool.query = async () => ({ rows: [{ is_admin: false }] });

  const req = { user: { userId: 1 } };
  let statusCode = null;
  let payload = null;
  const res = {
    status(code) {
      statusCode = code;
      return {
        json(body) {
          payload = body;
        }
      };
    }
  };

  await adminRequired(req, res, () => null);
  assert.equal(statusCode, 403);
  assert.equal(payload.message, 'Admin access required');

  pool.query = original;
});
