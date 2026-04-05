import express from 'express';
import { pool } from '../config/db.js';
import { authRequired } from '../middleware/auth.js';
import { adminRequired } from '../middleware/admin.js';

const router = express.Router();

router.get('/decision-logs', authRequired, adminRequired, async (_req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT dl.*, u.email AS user_email
       FROM decision_logs dl
       LEFT JOIN users u ON u.id = dl.user_id
       ORDER BY dl.created_at DESC
       LIMIT 500`
    );
    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
});

export default router;
