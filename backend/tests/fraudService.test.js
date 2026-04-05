import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreFraudRisk, classifyRiskBand, determineReviewStatus } from '../src/services/fraudService.js';

test('fraud score is bounded and includes reasons', () => {
  const now = new Date().toISOString();
  const result = scoreFraudRisk({
    amount: 7000,
    senderBalance: 7100,
    recentTransactions: Array.from({ length: 10 }, () => ({ created_at: now }))
  });

  assert.ok(result.riskScore <= 100);
  assert.ok(result.riskScore >= 0);
  assert.ok(result.reasons.length > 0);
});

test('risk band classification and review status policy', () => {
  assert.equal(classifyRiskBand(10), 'low');
  assert.equal(classifyRiskBand(40), 'medium');
  assert.equal(determineReviewStatus(80), 'manual_review');
});
