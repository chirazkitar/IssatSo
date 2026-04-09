const path = require('path');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, initializeDB } = require('./db/connection');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const gradeRoutes = require('./routes/grades');
const moduleRoutes = require('./routes/modules');
const statsRoutes    = require('./routes/stats');
const messageRoutes  = require('./routes/messages');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/stats',    statsRoutes);
app.use('/api/messages', messageRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Academic Platform API running' });
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

initializeDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize DB:', err);
  process.exit(1);
});

module.exports = app;
