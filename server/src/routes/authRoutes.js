import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { signToken } from '../utils/auth.js';

const router = Router();

router.post('/customer/signup', async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'Name, email, phone and password are required.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
      [name, email, phone, passwordHash]
    );

    const token = signToken({ id: result.insertId, type: 'customer', name, email });
    res.status(201).json({ token, user: { user_id: result.insertId, name, email, phone } });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Email already exists.' });
    next(error);
  }
});

router.post('/customer/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Invalid customer email or password.' });
    }

    const token = signToken({ id: user.user_id, type: 'customer', name: user.name, email: user.email });
    res.json({ token, user: { user_id: user.user_id, name: user.name, email: user.email, phone: user.phone } });
  } catch (error) {
    next(error);
  }
});

router.post('/staff/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.execute(
      `SELECT st.*, b.name AS business_name, b.type AS business_type
       FROM staff st
       JOIN businesses b ON b.business_id = st.business_id
       WHERE st.email = ?`,
      [email]
    );
    const staff = rows[0];

    if (!staff || !(await bcrypt.compare(password, staff.password_hash))) {
      return res.status(401).json({ message: 'Invalid staff email or password.' });
    }

    const token = signToken({
      id: staff.staff_id,
      type: 'staff',
      business_id: staff.business_id,
      name: staff.name,
      email: staff.email
    });
    res.json({
      token,
      staff: {
        staff_id: staff.staff_id,
        business_id: staff.business_id,
        business_name: staff.business_name,
        business_type: staff.business_type,
        name: staff.name,
        email: staff.email,
        role: staff.role
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
