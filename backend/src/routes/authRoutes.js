import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const insert = await pool.query(
      `INSERT INTO users (name, email, password_hash, wallet_balance)
       VALUES ($1, $2, $3, 1000)
       RETURNING id, name, email, wallet_balance`,
      [name, email.toLowerCase(), passwordHash]
    );

    const user = insert.rows[0];
    const token = jwt.sign({ userId: user.id, email: user.email }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

    return res.status(201).json({ user, token });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to register user', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
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
        wallet_balance: user.wallet_balance
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to login', error: error.message });
  }
});

export default router;
