import test from 'node:test';
import assert from 'node:assert/strict';
import { suggestPaymentRoute } from '../src/services/routingService.js';

test('returns ranked provider recommendation with explanation', () => {
  const route = suggestPaymentRoute({ amount: 120, priority: 'balanced', fraudRisk: 20 });
  assert.ok(route.recommended.provider);
  assert.ok(typeof route.recommended.explanation === 'string');
  assert.ok(route.alternatives.length >= 1);
});
