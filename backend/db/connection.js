const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'IssatSo',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'chiraz123',
});

async function initializeDB() {
  const client = await pool.connect();
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schema);
    console.log('Database schema initialized');

 
    const adminCheck = await client.query(
      "SELECT id FROM users WHERE email = 'admin@university.dz'"
    );
    if (adminCheck.rows.length === 0) {
      const hash = await bcrypt.hash('Admin@2024', 10);
      await client.query(
        `INSERT INTO users (email, password_hash, role, first_name, last_name)
         VALUES ($1, $2, 'admin', 'Super', 'Administrateur')`,
        ['admin@university.dz', hash]
      );

 
      const chefHash = await bcrypt.hash('Chef@2024', 10);
      const chefRes = await client.query(
        `INSERT INTO users (email, password_hash, role, first_name, last_name)
         VALUES ($1, $2, 'chef_departement', 'Mohammed', 'Benali') RETURNING id`,
        ['chef@university.dz', chefHash]
      );
      const chefId = chefRes.rows[0].id;
      await client.query(
        `INSERT INTO teacher_profiles (user_id, employee_number, specialization, department_id, hire_date)
         VALUES ($1, 'TEACH-001', 'Informatique', 1, '2015-09-01')
         ON CONFLICT DO NOTHING`,
        [chefId]
      );

     
      const teacherHash = await bcrypt.hash('Teacher@2024', 10);
      const teacherRes = await client.query(
        `INSERT INTO users (email, password_hash, role, first_name, last_name)
         VALUES ($1, $2, 'teacher', 'Ahmed', 'Khelil') RETURNING id`,
        ['teacher@university.dz', teacherHash]
      );
      const teacherId = teacherRes.rows[0].id;
      await client.query(
        `INSERT INTO teacher_profiles (user_id, employee_number, specialization, department_id, hire_date)
         VALUES ($1, 'TEACH-002', 'Réseaux', 1, '2018-09-01')
         ON CONFLICT DO NOTHING`,
        [teacherId]
      );

    
      const studentHash = await bcrypt.hash('Student@2024', 10);
      const studentRes = await client.query(
        `INSERT INTO users (email, password_hash, role, first_name, last_name)
         VALUES ($1, $2, 'student', 'Amina', 'Bouaziz') RETURNING id`,
        ['student@university.dz', studentHash]
      );
      const studentId = studentRes.rows[0].id;
      await client.query(
        `INSERT INTO student_profiles (user_id, student_number, date_of_birth, program_id, enrollment_year, bac_year, bac_mention)
         VALUES ($1, '2024/INFO/001', '2003-05-15', 1, 2024, 2023, 'Très Bien')
         ON CONFLICT DO NOTHING`,
        [studentId]
      );
      await client.query(
        `INSERT INTO enrollments (student_id, program_id, academic_year_id, status)
         VALUES ($1, 1, 1, 'active') ON CONFLICT DO NOTHING`,
        [studentId]
      );

      
      const yearId = 1;
      const gradeData = [
        [studentId, 1, yearId, teacherId, 13.5, 15.0],
        [studentId, 2, yearId, teacherId, 12.0, 14.5],
        [studentId, 3, yearId, teacherId, 16.0, 17.5],
        [studentId, 4, yearId, teacherId, 11.0, 13.0],
      ];
      for (const [sid, mid, yid, tid, ds, exam] of gradeData) {
        const final = ds * 0.4 + exam * 0.6;
        let mention = 'Passable';
        if (final >= 16) mention = 'Très Bien';
        else if (final >= 14) mention = 'Bien';
        else if (final >= 12) mention = 'Assez Bien';
        await client.query(
          `INSERT INTO grades (student_id, module_id, academic_year_id, teacher_id, ds_grade, exam_grade, final_grade, mention)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING`,
          [sid, mid, yid, tid, ds, exam, final.toFixed(2), mention]
        );
      }

    
      await client.query(
        `INSERT INTO teacher_modules (teacher_id, module_id, academic_year_id, assigned_by)
         VALUES ($1, 1, 1, $2), ($1, 2, 1, $2) ON CONFLICT DO NOTHING`,
        [chefId, chefId]
      );
      await client.query(
        `INSERT INTO teacher_modules (teacher_id, module_id, academic_year_id, assigned_by)
         VALUES ($1, 3, 1, $2), ($1, 4, 1, $2) ON CONFLICT DO NOTHING`,
        [teacherId, chefId]
      );

      console.log('Default users created');
    }
  } catch (err) {
    console.error('DB init error:', err.message);
  } finally {
    client.release();
  }
}

module.exports = { pool, initializeDB };
