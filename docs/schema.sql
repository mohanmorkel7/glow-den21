-- Postgres schema for Glow Den project
-- Safe to run repeatedly (IF NOT EXISTS used where possible)

-- USERS
-- CREATE TABLE IF NOT EXISTS users (
--   id TEXT PRIMARY KEY,
--   name TEXT NOT NULL,
--   email TEXT UNIQUE NOT NULL,
--   phone TEXT,
--   hashed_password TEXT NOT NULL,
--   role TEXT NOT NULL CHECK (role IN ('super_admin','project_manager','user')),
--   status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
--   department TEXT,
--   job_title TEXT,
--   avatar_url TEXT,
--   theme TEXT,
--   language TEXT,
--   notifications_enabled BOOLEAN DEFAULT TRUE,
--   join_date DATE DEFAULT CURRENT_DATE,
--   last_login TIMESTAMP WITH TIME ZONE,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
-- );

CREATE EXTENSION IF NOT EXISTS "pgcrypto";


CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  hashed_password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin','project_manager','user')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  department TEXT,
  job_title TEXT,
  avatar_url TEXT,
  theme TEXT,
  language TEXT,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  join_date DATE DEFAULT CURRENT_DATE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- PROJECTS
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  project_code TEXT,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning','active','on_hold','completed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  type TEXT DEFAULT 'monthly' CHECK (type IN ('monthly','weekly','both')),
  start_date DATE,
  end_date DATE,
  target_count INT DEFAULT 0,
  current_count INT DEFAULT 0,
  created_by_user_id TEXT,
  rate_per_file_usd NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Allow duplicate project_code but keep it indexed for search
DROP INDEX IF EXISTS ux_projects_project_code;
CREATE INDEX IF NOT EXISTS idx_projects_project_code ON projects(project_code);

-- USER_PROJECTS (assignments)
CREATE TABLE IF NOT EXISTS user_projects (
  user_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  role_in_project TEXT,
  assigned_by TEXT,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, project_id)
);
CREATE INDEX IF NOT EXISTS idx_user_projects_project ON user_projects(project_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_user ON user_projects(user_id);

-- DAILY COUNTS
CREATE TABLE IF NOT EXISTS daily_counts (
  id TEXT PRIMARY KEY DEFAULT ('dc_' || substr(md5(random()::text || clock_timestamp()::text),1,16)),
  user_id TEXT NOT NULL,
  project_id TEXT,
  date DATE NOT NULL,
  target_count INT NOT NULL DEFAULT 0,
  submitted_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('pending','submitted','approved','rejected')),
  notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  approved_by_user_id TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_daily_counts_user_date ON daily_counts(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_counts_project_date ON daily_counts(project_id, date);

-- FILE PROCESSES
CREATE TABLE IF NOT EXISTS file_processes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  project_id TEXT,
  project_name TEXT,
  file_name TEXT,
  total_rows BIGINT DEFAULT 0,
  header_rows INT DEFAULT 0,
  processed_rows BIGINT DEFAULT 0,
  available_rows BIGINT DEFAULT 0,
  upload_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending',
  created_by TEXT,
  active_users INT DEFAULT 0,
  type TEXT DEFAULT 'manual',
  daily_target INT,
  automation_config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_file_processes_project_id ON file_processes(project_id);

-- FILE REQUESTS
CREATE TABLE IF NOT EXISTS file_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_name TEXT,
  file_process_id TEXT REFERENCES file_processes(id) ON DELETE CASCADE,
  requested_count INT,
  requested_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'pending',
  assigned_by TEXT,
  assigned_date TIMESTAMP WITH TIME ZONE,
  assigned_count INT,
  start_row BIGINT,
  end_row BIGINT,
  download_link TEXT,
  completed_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  -- Non-breaking schema evolution
  uploaded_file_name TEXT,
  uploaded_file_path TEXT,
  verification_status TEXT,
  verified_by TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  rework_count INT DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_file_requests_file_process_id ON file_requests(file_process_id);

-- EXPENSES
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY DEFAULT ('exp_' || substr(md5(random()::text || clock_timestamp()::text),1,16)),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  date DATE NOT NULL,
  month CHAR(7) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('administrative','operational','marketing','utilities','miscellaneous')),
  frequency TEXT NOT NULL DEFAULT 'one-time' CHECK (frequency IN ('monthly','one-time')),
  receipt TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_by_user_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE
);
CREATE INDEX IF NOT EXISTS idx_expenses_month ON expenses(month);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(type);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);

-- TUTORIALS
CREATE TABLE IF NOT EXISTS tutorials (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'getting_started',
  status TEXT DEFAULT 'published',
  instructions TEXT,
  target_roles TEXT[] DEFAULT '{user}',
  is_required BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  "order" INT DEFAULT 0,
  view_count INT DEFAULT 0,
  completion_count INT DEFAULT 0,
  video_file_name TEXT,
  video_file_path TEXT,
  video_mime TEXT,
  created_by_user_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tutorial_steps (
  id TEXT PRIMARY KEY,
  tutorial_id TEXT NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
  step_number INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  video_timestamp INT,
  is_required BOOLEAN DEFAULT false
);

-- SALARY
CREATE TABLE IF NOT EXISTS salary_config (
  id INT PRIMARY KEY,
  first_tier_rate NUMERIC NOT NULL DEFAULT 0.5,
  second_tier_rate NUMERIC NOT NULL DEFAULT 0.6,
  first_tier_limit INT NOT NULL DEFAULT 500,
  currency TEXT NOT NULL DEFAULT 'INR',
  updated_by_user_id TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO salary_config (id, first_tier_rate, second_tier_rate, first_tier_limit, currency)
VALUES (1, 0.5, 0.6, 500, 'INR')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS pm_salaries (
  id TEXT PRIMARY KEY DEFAULT ('pm_' || substr(md5(random()::text || clock_timestamp()::text),1,12)),
  user_id TEXT NOT NULL,
  monthly_salary NUMERIC NOT NULL,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pm_salaries_user_id ON pm_salaries(user_id);

-- PERMISSIONS & ROLES (optional but supported by API)
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- DASHBOARD helper indexes (optional)
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by_user_id);


-- INSERT INTO users (
--   id, name, email, phone, hashed_password, role, status,
--   department, job_title, avatar_url, theme, language,
--   notifications_enabled, join_date, last_login, created_at, updated_at
-- ) VALUES (
--   '6c3cfd14-4862-48bf-9a98-16f18286428d',
--   'Super Admin',
--   'admin@websyntactic.com',
--   '9629558605',
--   '$2b$10$lg2cCZkN6y5i4wvaNCOXM.3KMelf8y/sug.Zccm72mAtaBLY/L7Tq',
--   'super_admin',
--   'active',
--   NULL,
--   NULL,
--   NULL,
--   'system',
--   'English',
--   true,
--   '2025-09-17',
--   '2025-09-24 06:02:46.6047',
--   '2025-09-17 06:13:44.566058',
--   '2025-09-24 06:02:46.6047'
-- );

INSERT INTO users (
  name, email, phone, hashed_password, role, status,
  department, job_title, avatar_url, theme, language,
  notifications_enabled, join_date, last_login, created_at, updated_at
) VALUES (
  'Super Admin',
  'admin@websyntactic.com',
  '9629558605',
  '$2b$10$lg2cCZkN6y5i4wvaNCOXM.3KMelf8y/sug.Zccm72mAtaBLY/L7Tq',
  'super_admin',
  'active',
  NULL,
  NULL,
  NULL,
  'system',
  'English',
  true,
  '2025-09-17',
  '2025-09-24 06:02:46.6047',
  '2025-09-17 06:13:44.566058',
  '2025-09-24 06:02:46.6047'
);