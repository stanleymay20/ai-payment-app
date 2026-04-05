import { env } from '../../config/env.js';

const SIMULATED_PROVIDERS = {
  stripe: { feePercent: 2.9, fixedFee: 0.3, speedScore: 9, providerRisk: 7 },
  paypal: { feePercent: 3.4, fixedFee: 0.35, speedScore: 8, providerRisk: 9 },
  bank: { feePercent: 0.8, fixedFee: 0.15, speedScore: 5, providerRisk: 4 }
};

export const listProviders = () => SIMULATED_PROVIDERS;

export const createProviderReference = (provider) => {
  if (env.providerMode === 'live' && provider === 'stripe') {
    return `stripe_live_placeholder_${Date.now()}`;
  }
  return `${provider}_sim_${Date.now()}`;
};
