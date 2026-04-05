import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { authRequired } from '../src/middleware/auth.js';
import { env } from '../src/config/env.js';

test('authRequired accepts valid bearer token', () => {
  const token = jwt.sign({ userId: 1, email: 'a@b.com' }, env.jwtSecret);
  const req = { headers: { authorization: `Bearer ${token}` } };
  let called = false;

  authRequired(req, { status: () => ({ json: () => null }) }, () => {
    called = true;
  });

  assert.equal(called, true);
  assert.equal(req.user.userId, 1);
});
