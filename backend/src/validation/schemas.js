import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email(),
    password: z.string().min(8).max(128)
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128)
  })
});

export const routeSuggestionSchema = z.object({
  body: z.object({
    amount: z.number().positive(),
    priority: z.enum(['balanced', 'fastest', 'cheapest']).optional(),
    fraudRisk: z.number().min(0).max(100).optional()
  })
});

export const sendPaymentSchema = z.object({
  body: z.object({
    recipientEmail: z.string().email(),
    amount: z.number().positive(),
    note: z.string().max(500).optional(),
    priority: z.enum(['balanced', 'fastest', 'cheapest']).optional()
  }),
  headers: z.object({
    'idempotency-key': z.string().min(8).max(120)
  }).passthrough()
});
