const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db/connection');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();


router.post('/', authenticate, authorize('admin'), async (req, res) => {
  const { email, password, role, first_name, last_name, phone,
    student_number, date_of_birth, place_of_birth, address, program_id, enrollment_year, bac_year, bac_mention,
    employee_number, specialization, department_id, hire_date } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const hash = await bcrypt.hash(password || 'Password@2024', 10);
    const userRes = await client.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [email, hash, role, first_name, last_name, phone]
    );
    const user = userRes.rows[0];

    if (role === 'student') {
      await client.query(
        `INSERT INTO student_profiles (user_id, student_number, date_of_birth, place_of_birth, address, program_id, enrollment_year, bac_year, bac_mention)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [user.id, student_number, date_of_birth, place_of_birth, address, program_id, enrollment_year, bac_year, bac_mention]
      );
      
      const yearRes = await client.query(`SELECT id FROM academic_years WHERE is_current = TRUE LIMIT 1`);
      if (yearRes.rows.length > 0 && program_id) {
        await client.query(
          `INSERT INTO enrollments (student_id, program_id, academic_year_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [user.id, program_id, yearRes.rows[0].id]
        );
      }
    } else if (role === 'teacher' || role === 'chef_departement') {
      await client.query(
        `INSERT INTO teacher_profiles (user_id, employee_number, specialization, department_id, hire_date)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, employee_number, specialization, department_id, hire_date]
      );
    }

    await client.query('COMMIT');
    delete user.password_hash;
    res.status(201).json(user);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    if (err.code === '23505') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});


router.get('/', authenticate, authorize('admin', 'chef_departement'), async (req, res) => {
  const { role } = req.query;
  try {
    let query = `
      SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.phone, u.created_at, u.status,
        sp.student_number, sp.program_id, p.name as program_name,
        tp.employee_number, tp.department_id, d.name as department_name
      FROM users u
      LEFT JOIN student_profiles sp ON sp.user_id = u.id
      LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
      LEFT JOIN programs p ON p.id = sp.program_id
      LEFT JOIN departments d ON d.id = tp.department_id
      WHERE u.role != 'admin'
    `;
    const params = [];
    if (role) { params.push(role); query += ` AND u.role = $${params.length}`; }
    query += ' ORDER BY u.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


router.put('/me', authenticate, async (req, res) => {
  const { first_name, last_name, phone, date_of_birth, place_of_birth, address } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE users SET first_name=$1, last_name=$2, phone=$3, updated_at=NOW() WHERE id=$4`,
      [first_name, last_name, phone, req.user.id]
    );
    if (req.user.role === 'student') {
      await client.query(
        `UPDATE student_profiles SET date_of_birth=$1, place_of_birth=$2, address=$3 WHERE user_id=$4`,
        [date_of_birth, place_of_birth, address, req.user.id]
      );
    }
    await client.query('COMMIT');
    res.json({ message: 'Profile updated' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});


router.get('/teachers', authenticate, authorize('chef_departement', 'admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.role,
        tp.employee_number, tp.specialization, d.name as department_name
       FROM users u
       JOIN teacher_profiles tp ON tp.user_id = u.id
       LEFT JOIN departments d ON d.id = tp.department_id
       WHERE u.role IN ('teacher', 'chef_departement')
       ORDER BY u.last_name`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/programs', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, d.name as department_name FROM programs p
       LEFT JOIN departments d ON d.id = p.department_id ORDER BY p.name`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/departments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM departments ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


router.post('/change-password', authenticate, async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) return res.status(400).json({ error: 'Champs requis' });
  if (new_password.length < 6) return res.status(400).json({ error: 'Mot de passe trop court (min 6)' });
  try {
    const result = await pool.query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Utilisateur introuvable' });
    const valid = await bcrypt.compare(current_password, result.rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
    const hash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2', [hash, req.user.id]);
    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id/approve', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE users SET status = 'approved', updated_at = NOW() WHERE id = $1 RETURNING id",
      [req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User approved successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
