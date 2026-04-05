import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../validation/schemas.js';
import { authLimiter } from '../config/rateLimit.js';

const router = express.Router();

router.post('/register', authLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password } = req.validated.body;

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const insert = await pool.query(
      `INSERT INTO users (name, email, password_hash, wallet_balance)
       VALUES ($1, $2, $3, 1000)
       RETURNING id, name, email, wallet_balance, is_admin`,
      [name, email.toLowerCase(), passwordHash]
    );

    const user = insert.rows[0];
    const token = jwt.sign({ userId: user.id, email: user.email }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

    return res.status(201).json({ user, token });
  } catch (error) {
    return next(error);
  }
});

router.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.validated.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);

    if (!result.rows.length) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        wallet_balance: user.wallet_balance,
        is_admin: user.is_admin
      }
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
