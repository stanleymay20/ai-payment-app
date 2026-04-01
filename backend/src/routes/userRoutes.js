import express from 'express';
import { pool } from '../config/db.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', authRequired, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, wallet_balance, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch user', error: error.message });
  }
});

router.get('/', authRequired, async (_req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, wallet_balance FROM users ORDER BY created_at DESC');
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

export default router;
