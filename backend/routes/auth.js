const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db/connection');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { 
    email, password, first_name, last_name, role, cin, phone,
    student_number, date_of_birth, place_of_birth, address, program_id, enrollment_year, bac_year, bac_mention, speciality,
    employee_number, specialization, department_id, hire_date 
  } = req.body;
  if (!email || !password || !first_name || !last_name) return res.status(400).json({ error: 'Tous les champs obligatoires sont requis' });

  const client = await pool.connect();
  try {
    const check = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (check.rows.length > 0) return res.status(409).json({ error: 'Cet email existe déjà' });

    await client.query('BEGIN');
    const hash = await bcrypt.hash(password, 10);
    const userRole = role || 'student';

    const userRes = await client.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, cin, phone, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') RETURNING id, email, role, first_name, last_name, status`,
      [email, hash, userRole, first_name, last_name, cin || null, phone || null]
    );
    const user = userRes.rows[0];

    if (userRole === 'student') {
      const sNum = student_number || `STU-${new Date().getFullYear()}-${user.id}`;
      await client.query(
        `INSERT INTO student_profiles (user_id, student_number, date_of_birth, place_of_birth, address, program_id, enrollment_year, bac_year, bac_mention, speciality) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`, 
        [user.id, sNum, date_of_birth || null, place_of_birth || null, address || null, program_id ? parseInt(program_id) : null, enrollment_year ? parseInt(enrollment_year) : null, bac_year ? parseInt(bac_year) : null, bac_mention || null, speciality || null]
      );
    } else if (userRole === 'teacher' || userRole === 'chef_departement') {
      const eNum = employee_number || `EMP-${new Date().getFullYear()}-${user.id}`;
      await client.query(
        `INSERT INTO teacher_profiles (user_id, employee_number, specialization, department_id, hire_date) 
         VALUES ($1, $2, $3, $4, $5)`, 
        [user.id, eNum, specialization || null, department_id ? parseInt(department_id) : null, hire_date || null]
      );
    }

    await client.query('COMMIT');

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ token, user });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

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
    if (!valid) return res.status(401).json({ error: 'Mot de passe ou email invalide' });

    if (user.status === 'pending') {
      return res.status(403).json({ error: "Votre compte est en attente d'approbation par un administrateur." });
    }

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
