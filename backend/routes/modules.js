const express = require('express');
const { pool } = require('../db/connection');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();


router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, p.name as program_name, p.code as program_code,
        tm.teacher_id, CONCAT(u.first_name, ' ', u.last_name) as teacher_name,
        ay.year_label
       FROM modules m
       LEFT JOIN programs p ON p.id = m.program_id
       LEFT JOIN teacher_modules tm ON tm.module_id = m.id
         AND tm.academic_year_id = (SELECT id FROM academic_years WHERE is_current = TRUE LIMIT 1)
       LEFT JOIN users u ON u.id = tm.teacher_id
       LEFT JOIN academic_years ay ON ay.id = tm.academic_year_id
       ORDER BY m.semester, m.name`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


router.post('/assign', authenticate, authorize('chef_departement'), async (req, res) => {
  const { teacher_id, module_id } = req.body;
  try {
    const yearRes = await pool.query(`SELECT id FROM academic_years WHERE is_current = TRUE LIMIT 1`);
    const year_id = yearRes.rows[0]?.id;
    if (!year_id) return res.status(400).json({ error: 'No current academic year' });

   
    await pool.query(
      `DELETE FROM teacher_modules WHERE module_id = $1 AND academic_year_id = $2`,
      [module_id, year_id]
    );

    if (teacher_id) {
      await pool.query(
        `INSERT INTO teacher_modules (teacher_id, module_id, academic_year_id, assigned_by)
         VALUES ($1, $2, $3, $4)`,
        [teacher_id, module_id, year_id, req.user.id]
      );
    }

    res.json({ message: 'Module assigned successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
