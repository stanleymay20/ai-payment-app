import { listProviders } from './providers/providerRegistry.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const suggestPaymentRoute = ({ amount, priority = 'balanced', fraudRisk = 0 }) => {
  const providers = listProviders();
  const safeAmount = Number(amount);
  const normalizedFraudRisk = clamp(Number(fraudRisk || 0), 0, 100);

  const options = Object.entries(providers).map(([provider, profile]) => {
    const estimatedFee = Number((safeAmount * (profile.feePercent / 100) + profile.fixedFee).toFixed(2));
    const costScore = clamp(10 - profile.feePercent, 1, 10);
    const speedScore = profile.speedScore;
    const safetyScore = clamp(10 - profile.providerRisk - normalizedFraudRisk / 20, 1, 10);

    const blended = priority === 'fastest'
      ? speedScore * 0.55 + costScore * 0.2 + safetyScore * 0.25
      : priority === 'cheapest'
        ? speedScore * 0.2 + costScore * 0.55 + safetyScore * 0.25
        : speedScore * 0.34 + costScore * 0.33 + safetyScore * 0.33;

    return {
      provider,
      estimatedFee,
      speedScore,
      costScore: Number(costScore.toFixed(2)),
      safetyScore: Number(safetyScore.toFixed(2)),
      score: Number(blended.toFixed(2)),
      explanation: `${provider.toUpperCase()} scored ${blended.toFixed(2)} using speed=${speedScore}, cost=${costScore.toFixed(2)}, safety=${safetyScore.toFixed(2)}.`
    };
  });

  options.sort((a, b) => b.score - a.score);
  return {
    recommended: options[0],
    alternatives: options.slice(1),
    selectionReason: `Selected ${options[0].provider.toUpperCase()} for priority '${priority}' with fraud risk input ${normalizedFraudRisk}.`
  };
};
