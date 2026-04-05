import { pool } from '../config/db.js';

export const adminRequired = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT is_admin FROM users WHERE id = $1', [req.user.userId]);
    if (!result.rows.length || !result.rows[0].is_admin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    return next();
  } catch (error) {
    return next(error);
  }
};
