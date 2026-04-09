const express  = require('express');
const router   = express.Router();
const path     = require('path');
const fs       = require('fs');
const multer   = require('multer');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db/connection');
const { authenticate } = require('../middleware/auth');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename:    (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, 
  fileFilter: (_req, file, cb) => {
    
    const blocked = ['.exe', '.bat', '.sh', '.cmd', '.msi', '.ps1'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (blocked.includes(ext)) return cb(new Error('Type de fichier non autorisé'));
    cb(null, true);
  },
});

router.use(authenticate);

async function fetchAttachments(messageIds) {
  if (!messageIds.length) return {};
  const { rows } = await pool.query(
    `SELECT id, message_id, filename, stored_name, mime_type, size_bytes
     FROM message_attachments WHERE message_id = ANY($1)`,
    [messageIds]
  );
  const map = {};
  rows.forEach(r => {
    if (!map[r.message_id]) map[r.message_id] = [];
    map[r.message_id].push(r);
  });
  return map;
}

router.get('/inbox', async (req, res) => {
  const userId = req.user.id;
  try {
    const profileRes = await pool.query(
      `SELECT program_id FROM student_profiles WHERE user_id = $1`, [userId]
    );
    const programId = profileRes.rows[0]?.program_id ?? null;

    const { rows } = await pool.query(
      `SELECT m.id, m.subject, m.body, m.scope, m.created_at,
              u.first_name AS sender_first, u.last_name AS sender_last, u.role AS sender_role,
              (mr.id IS NULL) AS unread
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       LEFT JOIN message_reads mr ON mr.message_id = m.id AND mr.user_id = $1
       WHERE
         (m.scope = 'direct'    AND m.recipient_id = $1)
         OR (m.scope = 'class'  AND m.program_id = $2 AND m.sender_id <> $1)
         OR (m.scope = 'broadcast' AND m.sender_id <> $1)
       ORDER BY m.created_at DESC`,
      [userId, programId]
    );

    const attMap = await fetchAttachments(rows.map(r => r.id));
    const result = rows.map(r => ({ ...r, attachments: attMap[r.id] || [] }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/sent', async (req, res) => {
  const userId = req.user.id;
  try {
    const { rows } = await pool.query(
      `SELECT m.id, m.subject, m.body, m.scope, m.created_at,
              m.recipient_id, m.program_id,
              r.first_name AS recipient_first, r.last_name AS recipient_last,
              p.name AS program_name
       FROM messages m
       LEFT JOIN users    r ON r.id = m.recipient_id
       LEFT JOIN programs p ON p.id = m.program_id
       WHERE m.sender_id = $1
       ORDER BY m.created_at DESC`,
      [userId]
    );
    const attMap = await fetchAttachments(rows.map(r => r.id));
    const result = rows.map(r => ({ ...r, attachments: attMap[r.id] || [] }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/unread-count', async (req, res) => {
  const userId = req.user.id;
  try {
    const profileRes = await pool.query(
      `SELECT program_id FROM student_profiles WHERE user_id = $1`, [userId]
    );
    const programId = profileRes.rows[0]?.program_id ?? null;
    const { rows } = await pool.query(
      `SELECT COUNT(*) AS count FROM messages m
       LEFT JOIN message_reads mr ON mr.message_id = m.id AND mr.user_id = $1
       WHERE mr.id IS NULL AND m.sender_id <> $1
         AND (
           (m.scope = 'direct'    AND m.recipient_id = $1)
           OR (m.scope = 'class'  AND m.program_id = $2)
           OR (m.scope = 'broadcast')
         )`,
      [userId, programId]
    );
    res.json({ count: parseInt(rows[0].count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/:id/read', async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO message_reads (message_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [parseInt(req.params.id), req.user.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/send', upload.array('attachments', 5), async (req, res) => {
  const senderId = req.user.id;
  const role     = req.user.role;
  const { subject, body, scope, recipient_id, program_id } = req.body;
  const files = req.files || [];

  if (!subject || !body || !scope)
    return res.status(400).json({ error: 'subject, body et scope sont requis' });
  if (scope === 'broadcast' && role !== 'admin')
    return res.status(403).json({ error: 'Seul un administrateur peut envoyer des annonces globales' });
  if (scope === 'direct' && !recipient_id)
    return res.status(400).json({ error: 'recipient_id requis' });
  if (scope === 'class' && !program_id)
    return res.status(400).json({ error: 'program_id requis' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO messages (sender_id, subject, body, scope, recipient_id, program_id)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [senderId, subject, body, scope,
       scope === 'direct' ? recipient_id : null,
       scope === 'class'  ? program_id   : null]
    );
    const messageId = rows[0].id;

    for (const file of files) {
      await client.query(
        `INSERT INTO message_attachments (message_id, filename, stored_name, mime_type, size_bytes)
         VALUES ($1, $2, $3, $4, $5)`,
        [messageId, file.originalname, file.filename, file.mimetype, file.size]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ id: messageId, attachments: files.length });
  } catch (err) {
    await client.query('ROLLBACK');
    files.forEach(f => fs.unlink(f.path, () => {}));
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

router.get('/attachment/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.filename, a.stored_name, a.mime_type, m.sender_id, m.recipient_id, m.program_id, m.scope
       FROM message_attachments a
       JOIN messages m ON m.id = a.message_id
       WHERE a.id = $1`,
      [parseInt(req.params.id)]
    );
    if (!rows.length) return res.status(404).json({ error: 'Fichier introuvable' });

    const att      = rows[0];
    const userId   = req.user.id;
    const role     = req.user.role;

    const canAccess =
      att.sender_id === userId ||
      att.recipient_id === userId ||
      att.scope === 'broadcast' ||
      role === 'admin';

    if (!canAccess) return res.status(403).json({ error: 'Accès refusé' });

    const filePath = path.join(UPLOADS_DIR, att.stored_name);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Fichier introuvable sur le serveur' });

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(att.filename)}"`);
    res.setHeader('Content-Type', att.mime_type || 'application/octet-stream');
    res.sendFile(filePath);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/recipients', async (req, res) => {
  try {
    const usersRes = await pool.query(
      `SELECT id, first_name, last_name, role FROM users WHERE id <> $1 ORDER BY last_name`, [req.user.id]
    );
    const progsRes = await pool.query(`SELECT id, name, code FROM programs ORDER BY name`);
    res.json({ users: usersRes.rows, programs: progsRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
