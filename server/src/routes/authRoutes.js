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

router.post('/staff/signup', async (req, res, next) => {
  let connection;
  let transactionStarted = false;
  try {
    const { business_name, business_type = 'Clinic', name, email, phone, password } = req.body;
    if (!business_name || !name || !email || !password) {
      return res.status(400).json({ message: 'Business name, staff name, email and password are required.' });
    }

    const [existingStaff] = await pool.execute(
      'SELECT staff_id FROM staff WHERE email = ? LIMIT 1',
      [email]
    );
    if (existingStaff.length) {
      return res.status(409).json({ message: 'A staff account with this email already exists.' });
    }

    const [existingBusinesses] = await pool.execute(
      `SELECT b.business_id, b.name,
              (SELECT COUNT(*) FROM staff st WHERE st.business_id = b.business_id) AS staff_count
       FROM businesses b
       WHERE LOWER(TRIM(b.name)) = LOWER(TRIM(?)) AND b.type = ? AND b.is_active = TRUE
       LIMIT 1`,
      [business_name, business_type]
    );
    if (existingBusinesses.length && Number(existingBusinesses[0].staff_count) > 0) {
      return res.status(409).json({ message: 'A business with this name and category is already registered. Please use the existing staff login or contact the business administrator.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    connection = await pool.getConnection();
    await connection.beginTransaction();
    transactionStarted = true;

    let businessId;
    let businessDisplayName = business_name;
    if (existingBusinesses.length) {
      businessId = existingBusinesses[0].business_id;
      businessDisplayName = existingBusinesses[0].name;
    } else {
      const [bizResult] = await connection.execute(
        `INSERT INTO businesses (brand_name, branch_name, name, type, address, contact, opening_time, closing_time)
         VALUES (?, 'Main Branch', ?, ?, 'Main Branch Address', ?, '09:00:00', '18:00:00')`,
        [business_name, business_name, business_type, phone || '+1 555-0000']
      );
      businessId = bizResult.insertId;
    }
    const [staffResult] = await connection.execute(
      'INSERT INTO staff (business_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [businessId, name, email, passwordHash, 'Manager']
    );
    await connection.commit();
    transactionStarted = false;

    const token = signToken({
      id: staffResult.insertId,
      type: 'staff',
      business_id: businessId,
      name,
      email
    });

    res.status(201).json({
      token,
      staff: {
        staff_id: staffResult.insertId,
        business_id: businessId,
        business_name: businessDisplayName,
        business_type,
        name,
        email,
        role: 'Manager'
      }
    });
  } catch (error) {
    if (transactionStarted) await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'A staff account with this email already exists.' });
    next(error);
  } finally {
    connection?.release();
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ message: 'A valid email is required.' });
  }
  // Generic safe response to prevent email enumeration
  res.json({
    success: true,
    message: 'If an account exists with this email, a password reset link has been sent.'
  });
});

export default router;
