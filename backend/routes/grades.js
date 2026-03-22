const express = require('express');
const { pool } = require('../db/connection');
const { authenticate, authorize } = require('../middleware/auth');
const PDFDocument = require('pdfkit');

const router = express.Router();


router.get('/my', authenticate, authorize('student'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT g.*, m.name as module_name, m.code as module_code, m.coefficient, m.semester,
        ay.year_label, p.name as program_name,
        CONCAT(u.first_name, ' ', u.last_name) as teacher_name
       FROM grades g
       JOIN modules m ON m.id = g.module_id
       JOIN academic_years ay ON ay.id = g.academic_year_id
       LEFT JOIN users u ON u.id = g.teacher_id
       LEFT JOIN student_profiles sp ON sp.user_id = g.student_id
       LEFT JOIN programs p ON p.id = sp.program_id
       WHERE g.student_id = $1
       ORDER BY ay.year_label DESC, m.semester, m.name`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/dossier', authenticate, authorize('student'), async (req, res) => {
  try {
    const profileResult = await pool.query(
      `SELECT u.*, sp.*, p.name as program_name, p.level,
        ay.year_label, d.name as department_name
       FROM users u
       JOIN student_profiles sp ON sp.user_id = u.id
       JOIN programs p ON p.id = sp.program_id
       LEFT JOIN departments d ON d.id = p.department_id
       LEFT JOIN academic_years ay ON ay.is_current = TRUE
       WHERE u.id = $1`,
      [req.user.id]
    );

    const gradesResult = await pool.query(
      `SELECT g.*, m.name as module_name, m.code, m.coefficient, m.semester, m.credit_hours,
        ay.year_label,
        CONCAT(u.first_name, ' ', u.last_name) as teacher_name
       FROM grades g
       JOIN modules m ON m.id = g.module_id
       JOIN academic_years ay ON ay.id = g.academic_year_id
       LEFT JOIN users u ON u.id = g.teacher_id
       WHERE g.student_id = $1
       ORDER BY ay.year_label, m.semester, m.name`,
      [req.user.id]
    );

    res.json({
      profile: profileResult.rows[0],
      grades: gradesResult.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/transcript', authenticate, authorize('student'), async (req, res) => {
  try {
    const profileResult = await pool.query(
      `SELECT u.*, sp.*, p.name as program_name, p.level, d.name as department_name, ay.year_label
       FROM users u
       JOIN student_profiles sp ON sp.user_id = u.id
       JOIN programs p ON p.id = sp.program_id
       LEFT JOIN departments d ON d.id = p.department_id
       LEFT JOIN academic_years ay ON ay.is_current = TRUE
       WHERE u.id = $1`,
      [req.user.id]
    );
    const profile = profileResult.rows[0];

    const gradesResult = await pool.query(
      `SELECT g.*, m.name as module_name, m.code, m.coefficient, m.semester, m.credit_hours, ay.year_label
       FROM grades g
       JOIN modules m ON m.id = g.module_id
       JOIN academic_years ay ON ay.id = g.academic_year_id
       WHERE g.student_id = $1 ORDER BY m.semester, m.name`,
      [req.user.id]
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="releve-notes-${profile.student_number}.pdf"`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    
    doc.fontSize(18).font('Helvetica-Bold').text('UNIVERSITÉ - RELEVÉ DE NOTES', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text(`Année Académique: ${profile.year_label || '2024-2025'}`, { align: 'center' });
    doc.moveDown(1);

    
    doc.fontSize(11).font('Helvetica-Bold').text('INFORMATIONS ÉTUDIANT');
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(10);
    doc.text(`Nom & Prénom: ${profile.first_name} ${profile.last_name}`);
    doc.text(`N° Étudiant: ${profile.student_number}`);
    doc.text(`Filière: ${profile.program_name} (${profile.level})`);
    doc.text(`Département: ${profile.department_name || 'N/A'}`);
    doc.moveDown(1);

   
    doc.fontSize(11).font('Helvetica-Bold').text('NOTES PAR SEMESTRE');
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    const grades = gradesResult.rows;
    const semesters = [...new Set(grades.map(g => g.semester))].sort();

    for (const sem of semesters) {
      const semGrades = grades.filter(g => g.semester === sem);
      doc.font('Helvetica-Bold').fontSize(10).text(`Semestre ${sem}`, { underline: true });
      doc.moveDown(0.3);

      
      const cols = [50, 210, 290, 360, 430, 500];
      doc.font('Helvetica-Bold').fontSize(9);
      doc.text('Module', cols[0], doc.y, { continued: false });
      const headerY = doc.y - 12;
      doc.text('Module', cols[0], headerY);
      doc.text('Coeff', cols[1], headerY);
      doc.text('DS', cols[2], headerY);
      doc.text('Examen', cols[3], headerY);
      doc.text('Final', cols[4], headerY);
      doc.text('Mention', cols[5], headerY);
      doc.moveDown(0.2);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

      doc.font('Helvetica').fontSize(9);
      let totalCoeff = 0, totalWeighted = 0;
      for (const g of semGrades) {
        const y = doc.y + 3;
        doc.text(g.module_name.substring(0, 25), cols[0], y);
        doc.text(g.coefficient?.toString() || '-', cols[1], y);
        doc.text(g.ds_grade?.toString() || '-', cols[2], y);
        doc.text(g.exam_grade?.toString() || '-', cols[3], y);
        doc.text(g.final_grade?.toString() || '-', cols[4], y);
        doc.text(g.mention || '-', cols[5], y);
        doc.moveDown(0.8);
        if (g.final_grade) {
          totalCoeff += parseFloat(g.coefficient || 1);
          totalWeighted += parseFloat(g.final_grade) * parseFloat(g.coefficient || 1);
        }
      }
      if (totalCoeff > 0) {
        const avg = (totalWeighted / totalCoeff).toFixed(2);
        doc.font('Helvetica-Bold').fontSize(9).text(`Moyenne Semestre ${sem}: ${avg}/20`, { align: 'right' });
      }
      doc.moveDown(0.5);
    }

    doc.fontSize(8).font('Helvetica').text(
      `Document généré le ${new Date().toLocaleDateString('fr-DZ')} - Plateforme Académique`,
      { align: 'center', color: 'grey' }
    );

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/teacher/students', authenticate, authorize('teacher', 'chef_departement'), async (req, res) => {
  try {
    const moduleResult = await pool.query(
      `SELECT tm.module_id, m.name as module_name, m.code, m.semester, m.coefficient,
        ay.id as year_id, ay.year_label
       FROM teacher_modules tm
       JOIN modules m ON m.id = tm.module_id
       JOIN academic_years ay ON ay.id = tm.academic_year_id
       WHERE tm.teacher_id = $1 AND ay.is_current = TRUE`,
      [req.user.id]
    );

    const modules = moduleResult.rows;
    const result = [];

    for (const mod of modules) {
      const studentsRes = await pool.query(
        `SELECT u.id, u.first_name, u.last_name, sp.student_number,
          g.id as grade_id, g.ds_grade, g.exam_grade, g.final_grade, g.mention
         FROM enrollments e
         JOIN users u ON u.id = e.student_id
         JOIN student_profiles sp ON sp.user_id = u.id
         LEFT JOIN grades g ON g.student_id = u.id AND g.module_id = $1 AND g.academic_year_id = $2
         WHERE e.program_id = (
           SELECT program_id FROM modules WHERE id = $1
         ) AND e.academic_year_id = $2
         ORDER BY u.last_name`,
        [mod.module_id, mod.year_id]
      );
      result.push({ ...mod, students: studentsRes.rows });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


router.post('/save', authenticate, authorize('teacher', 'chef_departement'), async (req, res) => {
  const { student_id, module_id, ds_grade, exam_grade } = req.body;
  try {
    const yearRes = await pool.query(`SELECT id FROM academic_years WHERE is_current = TRUE LIMIT 1`);
    const year_id = yearRes.rows[0]?.id;
    if (!year_id) return res.status(400).json({ error: 'No current academic year' });

    const final_grade = (parseFloat(ds_grade || 0) * 0.4 + parseFloat(exam_grade || 0) * 0.6).toFixed(2);
    let mention = 'Ajourné';
    const fg = parseFloat(final_grade);
    if (fg >= 16) mention = 'Très Bien';
    else if (fg >= 14) mention = 'Bien';
    else if (fg >= 12) mention = 'Assez Bien';
    else if (fg >= 10) mention = 'Passable';

    await pool.query(
      `INSERT INTO grades (student_id, module_id, academic_year_id, teacher_id, ds_grade, exam_grade, final_grade, mention)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (student_id, module_id, academic_year_id)
       DO UPDATE SET ds_grade=$5, exam_grade=$6, final_grade=$7, mention=$8, teacher_id=$4, updated_at=NOW()`,
      [student_id, module_id, year_id, req.user.id, ds_grade, exam_grade, final_grade, mention]
    );
    res.json({ message: 'Grade saved', final_grade, mention });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
