const PROVIDERS = {
  stripe: { feePercent: 2.9, fixedFee: 0.3, speedScore: 9, providerRisk: 7 },
  paypal: { feePercent: 3.4, fixedFee: 0.35, speedScore: 8, providerRisk: 9 },
  bank: { feePercent: 0.8, fixedFee: 0.15, speedScore: 5, providerRisk: 4 }
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const suggestPaymentRoute = ({ amount, priority = 'balanced', fraudRisk = 0 }) => {
  const safeAmount = Number(amount);
  const normalizedFraudRisk = clamp(Number(fraudRisk || 0), 0, 100);

  const options = Object.entries(PROVIDERS).map(([provider, profile]) => {
    const estimatedFee = Number((safeAmount * (profile.feePercent / 100) + profile.fixedFee).toFixed(2));
    const costScore = clamp(10 - profile.feePercent, 1, 10);
    const speedScore = profile.speedScore;
    const safetyScore = clamp(10 - profile.providerRisk - normalizedFraudRisk / 20, 1, 10);

    let blended;
    if (priority === 'fastest') {
      blended = speedScore * 0.55 + costScore * 0.2 + safetyScore * 0.25;
    } else if (priority === 'cheapest') {
      blended = speedScore * 0.2 + costScore * 0.55 + safetyScore * 0.25;
    } else {
      blended = speedScore * 0.34 + costScore * 0.33 + safetyScore * 0.33;
    }

    const explanation = `${provider.toUpperCase()} scored ${blended.toFixed(2)} using speed=${speedScore}, cost=${costScore.toFixed(2)}, safety=${safetyScore.toFixed(2)}.`;

    return {
      provider,
      estimatedFee,
      speedScore,
      costScore: Number(costScore.toFixed(2)),
      safetyScore: Number(safetyScore.toFixed(2)),
      score: Number(blended.toFixed(2)),
      explanation
    };
  });

  options.sort((a, b) => b.score - a.score);

  return {
    recommended: options[0],
    alternatives: options.slice(1),
    selectionReason: `Selected ${options[0].provider.toUpperCase()} for priority '${priority}' with fraud risk input ${normalizedFraudRisk}.`
  };
};
