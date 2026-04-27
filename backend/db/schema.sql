

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'teacher', 'admin', 'chef_departement')),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  chef_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Academic years
CREATE TABLE IF NOT EXISTS academic_years (
  id SERIAL PRIMARY KEY,
  year_label VARCHAR(50) NOT NULL,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT FALSE
);

--Filières
CREATE TABLE IF NOT EXISTS programs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  department_id INTEGER REFERENCES departments(id),
  level VARCHAR(50) NOT NULL
);

-- Modules / Matières
CREATE TABLE IF NOT EXISTS modules (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  coefficient DECIMAL(3,1) DEFAULT 1.0,
  credit_hours INTEGER DEFAULT 30,
  semester INTEGER NOT NULL,
  program_id INTEGER REFERENCES programs(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Teacher-Module assignments
CREATE TABLE IF NOT EXISTS teacher_modules (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER REFERENCES users(id),
  module_id INTEGER REFERENCES modules(id),
  academic_year_id INTEGER REFERENCES academic_years(id),
  assigned_by INTEGER REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(teacher_id, module_id, academic_year_id)
);

-- Student enrollments
CREATE TABLE IF NOT EXISTS enrollments (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES users(id),
  program_id INTEGER REFERENCES programs(id),
  academic_year_id INTEGER REFERENCES academic_years(id),
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(50) DEFAULT 'active',
  UNIQUE(student_id, program_id, academic_year_id)
);

-- Student profiles
CREATE TABLE IF NOT EXISTS student_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id),
  student_number VARCHAR(50) UNIQUE NOT NULL,
  date_of_birth DATE,
  place_of_birth VARCHAR(255),
  address TEXT,
  program_id INTEGER REFERENCES programs(id),
  enrollment_year INTEGER,
  bac_year INTEGER,
  bac_mention VARCHAR(50)
);

-- Teacher profiles
CREATE TABLE IF NOT EXISTS teacher_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id),
  employee_number VARCHAR(50) UNIQUE NOT NULL,
  specialization VARCHAR(255),
  department_id INTEGER REFERENCES departments(id),
  hire_date DATE
);

-- Grades
CREATE TABLE IF NOT EXISTS grades (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES users(id),
  module_id INTEGER REFERENCES modules(id),
  academic_year_id INTEGER REFERENCES academic_years(id),
  teacher_id INTEGER REFERENCES users(id),
  ds_grade DECIMAL(4,2),
  exam_grade DECIMAL(4,2),
  final_grade DECIMAL(4,2),
  mention VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, module_id, academic_year_id)
);


INSERT INTO academic_years (year_label, is_current) VALUES ('2024-2025', TRUE) ON CONFLICT DO NOTHING;

INSERT INTO departments (name, code) VALUES 
  ('Informatique', 'INFO'),
  ('Mathématiques', 'MATH'),
  ('Physique', 'PHY')
ON CONFLICT DO NOTHING;

INSERT INTO programs (name, code, department_id, level) VALUES
  ('Licence Informatique', 'LIC-INFO', 1, 'Licence'),
  ('Master Informatique', 'MAS-INFO', 1, 'Master'),
  ('Licence Mathématiques', 'LIC-MATH', 2, 'Licence')
ON CONFLICT DO NOTHING;

INSERT INTO modules (name, code, coefficient, semester, program_id) VALUES
  ('Algorithmique', 'ALGO-L1', 3.0, 1, 1),
  ('Programmation C', 'PROG-C', 2.5, 1, 1),
  ('Bases de données', 'BDD', 3.0, 2, 1),
  ('Réseaux', 'RES', 2.5, 2, 1),
  ('Analyse', 'ANA', 3.0, 1, 3),
  ('Algèbre', 'ALG', 3.0, 1, 3)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS messages (
  id           SERIAL PRIMARY KEY,
  sender_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject      VARCHAR(255) NOT NULL,
  body         TEXT NOT NULL,
  scope        VARCHAR(20) NOT NULL DEFAULT 'direct',
  recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  program_id   INTEGER REFERENCES programs(id) ON DELETE SET NULL,
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message_reads (
  id         SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

CREATE TABLE IF NOT EXISTS message_attachments (
  id           SERIAL PRIMARY KEY,
  message_id   INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  filename     VARCHAR(255) NOT NULL,  
  stored_name  VARCHAR(255) NOT NULL,   
  mime_type    VARCHAR(100),
  size_bytes   INTEGER,
  uploaded_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stage_attestations (
  id           SERIAL PRIMARY KEY,
  student_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         VARCHAR(20) NOT NULL CHECK (type IN ('ete', 'fin_etude')),
  filename     VARCHAR(255) NOT NULL,
  stored_name  VARCHAR(255) NOT NULL,
  size_bytes   INTEGER,
  uploaded_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS diplome_validations (
  id                SERIAL PRIMARY KEY,
  student_id        INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  validated_by      INTEGER NOT NULL REFERENCES users(id),
  validated_at      TIMESTAMP DEFAULT NOW(),
  moyenne_generale  DECIMAL(4,2),
  status            VARCHAR(20) DEFAULT 'validated'
);