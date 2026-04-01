const FRAUD_CONFIG = {
  baseRisk: 8,
  largeAmountThreshold: 1500,
  veryLargeAmountThreshold: 5000,
  highVelocityWindowMinutes: 5,
  mediumVelocityWindowMinutes: 60,
  highVelocityCount: 3,
  mediumVelocityCount: 8,
  lateHourStartUtc: 0,
  lateHourEndUtc: 5
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const scoreFraudRisk = ({ amount, recentTransactions = [], senderBalance }) => {
  const now = Date.now();
  const amountNum = Number(amount);
  const balanceNum = Number(senderBalance || 0);
  const explanations = [];

  let riskScore = FRAUD_CONFIG.baseRisk;

  if (amountNum >= FRAUD_CONFIG.veryLargeAmountThreshold) {
    riskScore += 35;
    explanations.push('Very large payment amount compared to normal wallet activity.');
  } else if (amountNum >= FRAUD_CONFIG.largeAmountThreshold) {
    riskScore += 22;
    explanations.push('Large payment amount that may indicate elevated fraud risk.');
  }

  const txIn5Minutes = recentTransactions.filter((tx) => now - new Date(tx.created_at).getTime() <= FRAUD_CONFIG.highVelocityWindowMinutes * 60 * 1000).length;
  const txIn60Minutes = recentTransactions.filter((tx) => now - new Date(tx.created_at).getTime() <= FRAUD_CONFIG.mediumVelocityWindowMinutes * 60 * 1000).length;

  if (txIn5Minutes >= FRAUD_CONFIG.highVelocityCount) {
    riskScore += 24;
    explanations.push(`High velocity pattern detected: ${txIn5Minutes} payments in the last ${FRAUD_CONFIG.highVelocityWindowMinutes} minutes.`);
  }

  if (txIn60Minutes >= FRAUD_CONFIG.mediumVelocityCount) {
    riskScore += 16;
    explanations.push(`High frequency pattern detected: ${txIn60Minutes} payments in the last hour.`);
  }

  if (balanceNum > 0) {
    const balanceRatio = amountNum / balanceNum;
    if (balanceRatio > 0.9) {
      riskScore += 18;
      explanations.push('Payment drains more than 90% of available wallet balance.');
    } else if (balanceRatio > 0.75) {
      riskScore += 10;
      explanations.push('Payment uses a high percentage of available wallet balance.');
    }
  }

  const utcHour = new Date().getUTCHours();
  if (utcHour >= FRAUD_CONFIG.lateHourStartUtc && utcHour <= FRAUD_CONFIG.lateHourEndUtc) {
    riskScore += 8;
    explanations.push('Transaction occurred during low-activity hours (UTC), which can be anomalous.');
  }

  const boundedRisk = clamp(Math.round(riskScore), 0, 100);
  return {
    riskScore: boundedRisk,
    flagged: boundedRisk >= 60,
    reasons: explanations.length ? explanations : ['No significant fraud indicators detected.'],
    metrics: {
      txIn5Minutes,
      txIn60Minutes,
      balanceRatio: balanceNum > 0 ? Number((amountNum / balanceNum).toFixed(3)) : null
    }
  };
};
