const express  = require('express');
const router   = express.Router();
const path     = require('path');
const fs       = require('fs');
const multer   = require('multer');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db/connection');
const { authenticate, authorize } = require('../middleware/auth');
const PDFDocument = require('pdfkit');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'stages');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename:    (_req, _file, cb) => cb(null, uuidv4() + '.pdf'),
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf')
      return cb(new Error('Seuls les fichiers PDF sont acceptés'));
    cb(null, true);
  },
});

router.post('/upload', authenticate, authorize('student'),
  upload.single('attestation'), async (req, res) => {
    const { type } = req.body; // 'ete' ou 'fin_etude'
    if (!['ete', 'fin_etude'].includes(type))
      return res.status(400).json({ error: 'Type invalide (ete ou fin_etude)' });
    if (!req.file)
      return res.status(400).json({ error: 'Fichier PDF requis' });

    try {
      const { rows } = await pool.query(
        `INSERT INTO stage_attestations
           (student_id, type, filename, stored_name, size_bytes)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [req.user.id, type, req.file.originalname,
         req.file.filename, req.file.size]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      fs.unlink(req.file.path, () => {});
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

router.get('/my', authenticate, authorize('student'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM stage_attestations
       WHERE student_id = $1 ORDER BY uploaded_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', authenticate, authorize('student'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `DELETE FROM stage_attestations
       WHERE id = $1 AND student_id = $2 RETURNING stored_name`,
      [req.params.id, req.user.id]
    );
    if (!rows.length)
      return res.status(404).json({ error: 'Attestation introuvable' });

    const filePath = path.join(UPLOADS_DIR, rows[0].stored_name);
    fs.unlink(filePath, () => {});
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/download/:id', async (req, res) => {
  // Token soit dans le header soit dans ?token=
  const authHeader = req.headers.authorization;
  const queryToken = req.query.token;
  const token      = authHeader?.split(' ')[1] || queryToken;

  if (!token) return res.status(401).json({ error: 'No token provided' });

  let decoded;
  try {
    decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'academic_platform_secret_2024');
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT * FROM stage_attestations WHERE id = $1`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Introuvable' });

    const att = rows[0];
    if (att.student_id !== decoded.id && decoded.role !== 'admin')
      return res.status(403).json({ error: 'Accès refusé' });

    const filePath = path.join(UPLOADS_DIR, att.stored_name);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      `attachment; filename="${encodeURIComponent(att.filename)}"`);
    res.sendFile(filePath);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/admin/students', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         u.id, u.first_name, u.last_name, u.email,
         sp.student_number, p.name AS program_name,
         dv.status AS diplome_status,
         dv.validated_at, dv.moyenne_generale,
         COALESCE(
           json_agg(sa ORDER BY sa.uploaded_at DESC)
           FILTER (WHERE sa.id IS NOT NULL), '[]'
         ) AS attestations
       FROM users u
       JOIN student_profiles sp ON sp.user_id = u.id
       JOIN programs p ON p.id = sp.program_id
       LEFT JOIN diplome_validations dv ON dv.student_id = u.id
       LEFT JOIN stage_attestations sa ON sa.student_id = u.id
       WHERE u.role = 'student'
       GROUP BY u.id, u.first_name, u.last_name, u.email,
                sp.student_number, p.name,
                dv.status, dv.validated_at, dv.moyenne_generale
       ORDER BY u.last_name`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/admin/valider/:studentId', authenticate, authorize('admin'),
  async (req, res) => {
    const studentId = parseInt(req.params.studentId);

    try {
      const moyennesRes = await pool.query(
        `SELECT ay.year_label,
                SUM(g.final_grade * m.coefficient) / SUM(m.coefficient) AS moyenne
         FROM grades g
         JOIN modules m ON m.id = g.module_id
         JOIN academic_years ay ON ay.id = g.academic_year_id
         WHERE g.student_id = $1 AND g.final_grade IS NOT NULL
         GROUP BY ay.id, ay.year_label`,
        [studentId]
      );

      const anneesInsuffisantes = moyennesRes.rows.filter(
        r => parseFloat(r.moyenne) < 10
      );
      if (anneesInsuffisantes.length > 0) {
        return res.status(400).json({
          error: 'Moyenne insuffisante',
          detail: anneesInsuffisantes.map(
            a => `${a.year_label} : ${parseFloat(a.moyenne).toFixed(2)}/20`
          ),
        });
      }

      const attRes = await pool.query(
        `SELECT type FROM stage_attestations WHERE student_id = $1`,
        [studentId]
      );
      const types = attRes.rows.map(r => r.type);
      const hasFinEtude = types.includes('fin_etude');
      const hasEte      = types.includes('ete');

      if (!hasFinEtude)
        return res.status(400).json({
          error: 'Attestation de stage de fin d\'étude manquante'
        });
      if (!hasEte)
        return res.status(400).json({
          error: 'Au moins une attestation de stage d\'été est requise'
        });

      const moyGlobaleRes = await pool.query(
        `SELECT SUM(g.final_grade * m.coefficient) / SUM(m.coefficient) AS moyenne
         FROM grades g
         JOIN modules m ON m.id = g.module_id
         WHERE g.student_id = $1 AND g.final_grade IS NOT NULL`,
        [studentId]
      );
      const moyenneGenerale = parseFloat(
        moyGlobaleRes.rows[0]?.moyenne || 0
      ).toFixed(2);

      await pool.query(
        `INSERT INTO diplome_validations
           (student_id, validated_by, moyenne_generale)
         VALUES ($1, $2, $3)
         ON CONFLICT (student_id)
         DO UPDATE SET validated_by=$2, validated_at=NOW(),
                       moyenne_generale=$3, status='validated'`,
        [studentId, req.user.id, moyenneGenerale]
      );

      res.json({ ok: true, moyenne_generale: moyenneGenerale });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

router.get('/diplome/status', authenticate, authorize('student'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT dv.*, u.first_name AS admin_first, u.last_name AS admin_last
       FROM diplome_validations dv
       JOIN users u ON u.id = dv.validated_by
       WHERE dv.student_id = $1`,
      [req.user.id]
    );
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/diplome/download', authenticate, authorize('student'), async (req, res) => {
  try {
    
    const valRes = await pool.query(
      `SELECT dv.*, u.first_name AS admin_first, u.last_name AS admin_last
       FROM diplome_validations dv
       JOIN users u ON u.id = dv.validated_by
       WHERE dv.student_id = $1 AND dv.status = 'validated'`,
      [req.user.id]
    );
    if (!valRes.rows.length)
      return res.status(403).json({ error: 'Diplôme non encore validé' });

    const val = valRes.rows[0];

   
    const profileRes = await pool.query(
      `SELECT u.first_name, u.last_name, sp.student_number,
              p.name AS program_name, p.level,
              d.name AS department_name
       FROM users u
       JOIN student_profiles sp ON sp.user_id = u.id
       JOIN programs p ON p.id = sp.program_id
       LEFT JOIN departments d ON d.id = p.department_id
       WHERE u.id = $1`,
      [req.user.id]
    );
    const profile = profileRes.rows[0];

 
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      `attachment; filename="diplome-${profile.student_number}.pdf"`);

    const doc = new PDFDocument({ size: 'A4', margin: 60 });
    doc.pipe(res);

   
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
       .lineWidth(3).strokeColor('#2D3A8C').stroke();
    doc.rect(28, 28, doc.page.width - 56, doc.page.height - 56)
       .lineWidth(1).strokeColor('#4F63F0').stroke();


    doc.moveDown(2);
    doc.fontSize(13).fillColor('#6B7280')
       .text('RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE', { align: 'center' });
    doc.fontSize(12).text('Ministère de l\'Enseignement Supérieur et de la Recherche Scientifique', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).fillColor('#2D3A8C').font('Helvetica-Bold')
       .text('ISSATSO — Institut Supérieur des Sciences Appliquées', { align: 'center' });
    doc.fontSize(12).font('Helvetica').fillColor('#374151')
       .text(`Département : ${profile.department_name || 'Informatique'}`, { align: 'center' });

    
    doc.moveDown(2);
    doc.fontSize(32).fillColor('#2D3A8C').font('Helvetica-Bold')
       .text('DIPLÔME', { align: 'center' });
    doc.fontSize(18).fillColor('#4F63F0')
       .text(profile.level || 'Licence', { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(100, doc.y).lineTo(doc.page.width - 100, doc.y)
       .lineWidth(2).strokeColor('#4F63F0').stroke();

   
    doc.moveDown(1.5);
    doc.fontSize(13).fillColor('#374151').font('Helvetica')
       .text('L\'Institut certifie que', { align: 'center' });
    doc.moveDown(0.8);
    doc.fontSize(22).fillColor('#111827').font('Helvetica-Bold')
       .text(`${profile.first_name} ${profile.last_name}`, { align: 'center' });
    doc.fontSize(12).fillColor('#6B7280').font('Helvetica')
       .text(`N° Étudiant : ${profile.student_number}`, { align: 'center' });

    doc.moveDown(1);
    doc.fontSize(13).fillColor('#374151')
       .text('a satisfait à toutes les conditions requises et a obtenu le titre de', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(16).fillColor('#2D3A8C').font('Helvetica-Bold')
       .text(profile.program_name, { align: 'center' });

    doc.moveDown(1);
    doc.fontSize(13).fillColor('#374151').font('Helvetica')
       .text(`Avec une moyenne générale de : ${val.moyenne_generale}/20`, { align: 'center' });

    
    const moy = parseFloat(val.moyenne_generale);
    const mention = moy >= 16 ? 'Très Honorable'
                  : moy >= 14 ? 'Honorable'
                  : moy >= 12 ? 'Assez Bien'
                  : 'Passable';
    doc.fontSize(15).fillColor('#16A34A').font('Helvetica-Bold')
       .text(`Mention : ${mention}`, { align: 'center' });

   
    doc.moveDown(2);
    doc.moveTo(100, doc.y).lineTo(doc.page.width - 100, doc.y)
       .lineWidth(1).strokeColor('#D1D5DB').stroke();
    doc.moveDown(1);
    doc.fontSize(11).fillColor('#6B7280').font('Helvetica')
       .text(`Validé le : ${new Date(val.validated_at).toLocaleDateString('fr-DZ')}`, { align: 'left' })
       .text(`Par : ${val.admin_first} ${val.admin_last} (Administrateur)`, { align: 'left' });

    doc.moveDown(2);
    doc.fontSize(10).fillColor('#9CA3AF')
       .text('Document officiel généré par UniPlatform — ISSATSO', { align: 'center' });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;