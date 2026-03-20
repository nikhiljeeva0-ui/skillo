CREATE TABLE IF NOT EXISTS learner_models (
  user_id      TEXT PRIMARY KEY,
  model_json   JSONB NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS curricula (
  curriculum_id TEXT PRIMARY KEY,
  content       JSONB NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Existing Seed Data
INSERT INTO curricula (curriculum_id, content) VALUES (
  'CBSE_G9_MATHS',
  '{"board":"CBSE","grade":9,"subject":"Maths","nodes":[{"id":"nt1","label":"Number Systems","type":"chapter"},{"id":"al1","label":"Polynomials","type":"chapter"}]}'
) ON CONFLICT (curriculum_id) DO NOTHING;

-- NEW INSTITUTION TABLES

CREATE TABLE IF NOT EXISTS institutions (
  institution_id    TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  type              TEXT NOT NULL, 
  city              TEXT,
  state             TEXT,
  admin_email       TEXT,
  subscription_status TEXT DEFAULT 'trial',
  trial_start_date  DATE DEFAULT CURRENT_DATE,
  trial_end_date    DATE DEFAULT (CURRENT_DATE + INTERVAL '90 days'),
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS institution_students (
  id               SERIAL PRIMARY KEY,
  institution_id   TEXT REFERENCES institutions(institution_id),
  user_id          TEXT REFERENCES learner_models(user_id),
  department       TEXT,
  year             INT,
  joined_at        TIMESTAMPTZ DEFAULT now()
);

-- Seed one demo institution
INSERT INTO institutions VALUES (
  'INST_001',
  'Skillo Demo School',
  'school',
  'Bengaluru',
  'Karnataka',
  'admin@skillodemo.com',
  'trial',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '90 days',
  now()
) ON CONFLICT DO NOTHING;
