const express = require('express');
const { pool } = require('../db/connection');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, authorize('admin', 'chef_departement'), async (req, res) => {
  try {
    const [students, teachers, programs, grades, recentUsers] = await Promise.all([
      pool.query(`SELECT COUNT(*) as count FROM users WHERE role = 'student'`),
      pool.query(`SELECT COUNT(*) as count FROM users WHERE role IN ('teacher','chef_departement')`),
      pool.query(`SELECT COUNT(*) as count FROM programs`),
      pool.query(`
        SELECT 
          COUNT(*) as total,
          AVG(final_grade) as avg_grade,
          COUNT(CASE WHEN final_grade >= 10 THEN 1 END) as passed,
          COUNT(CASE WHEN final_grade < 10 THEN 1 END) as failed
        FROM grades WHERE final_grade IS NOT NULL
      `),
      pool.query(`
        SELECT u.id, u.first_name, u.last_name, u.role, u.email, u.created_at
        FROM users u ORDER BY u.created_at DESC LIMIT 5
      `),
    ]);

    const gradeDistRes = await pool.query(`
      SELECT 
        CASE 
          WHEN final_grade >= 16 THEN 'Très Bien (16-20)'
          WHEN final_grade >= 14 THEN 'Bien (14-16)'
          WHEN final_grade >= 12 THEN 'Assez Bien (12-14)'
          WHEN final_grade >= 10 THEN 'Passable (10-12)'
          ELSE 'Ajourné (<10)'
        END as range,
        COUNT(*) as count
      FROM grades WHERE final_grade IS NOT NULL
      GROUP BY range ORDER BY range DESC
    `);

    const moduleStatsRes = await pool.query(`
      SELECT m.name as module_name, m.code, 
        AVG(g.final_grade) as avg_grade,
        COUNT(g.id) as student_count
      FROM modules m
      LEFT JOIN grades g ON g.module_id = m.id
      GROUP BY m.id, m.name, m.code
      ORDER BY avg_grade DESC NULLS LAST
      LIMIT 8
    `);

    res.json({
      totals: {
        students: parseInt(students.rows[0].count),
        teachers: parseInt(teachers.rows[0].count),
        programs: parseInt(programs.rows[0].count),
        grades: parseInt(grades.rows[0].total),
      },
      gradeStats: {
        avg: parseFloat(grades.rows[0].avg_grade || 0).toFixed(2),
        passed: parseInt(grades.rows[0].passed || 0),
        failed: parseInt(grades.rows[0].failed || 0),
      },
      gradeDistribution: gradeDistRes.rows,
      moduleStats: moduleStatsRes.rows,
      recentUsers: recentUsers.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
