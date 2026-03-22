const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db/connection');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const result = await pool.query(
      `SELECT u.*, 
        sp.student_number, sp.date_of_birth, sp.place_of_birth, sp.address, sp.program_id,
        sp.enrollment_year, sp.bac_year, sp.bac_mention,
        tp.employee_number, tp.specialization, tp.department_id, tp.hire_date,
        p.name as program_name, d.name as department_name,
        CONCAT(u.first_name, ' ', u.last_name) as full_name
       FROM users u
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
       LEFT JOIN programs p ON p.id = sp.program_id
       LEFT JOIN departments d ON d.id = tp.department_id
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    delete user.password_hash;
    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.phone, u.avatar_url, u.created_at,
        sp.student_number, sp.date_of_birth, sp.place_of_birth, sp.address, sp.program_id,
        sp.enrollment_year, sp.bac_year, sp.bac_mention,
        tp.employee_number, tp.specialization, tp.department_id, tp.hire_date,
        p.name as program_name, d.name as department_name
       FROM users u
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
       LEFT JOIN programs p ON p.id = sp.program_id
       LEFT JOIN departments d ON d.id = tp.department_id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
