import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreFraudRisk, determineReviewStatus } from '../src/services/fraudService.js';

test('high-risk transaction goes to manual review policy', () => {
  const now = new Date().toISOString();
  const fraud = scoreFraudRisk({
    amount: 9000,
    senderBalance: 9100,
    recentTransactions: Array.from({ length: 12 }, () => ({ created_at: now }))
  });

  assert.equal(determineReviewStatus(fraud.riskScore), 'manual_review');
});
