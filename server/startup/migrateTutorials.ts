import { query } from "../db/connection";

export async function ensureTutorialTables() {
  // tutorials table stores metadata, content and file storage info
  await query(`
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
  `);

  // Make sure new columns exist when table already created
  await query(`ALTER TABLE tutorials ADD COLUMN IF NOT EXISTS instructions TEXT;`);
  await query(`ALTER TABLE tutorials ADD COLUMN IF NOT EXISTS target_roles TEXT[] DEFAULT '{user}';`);
  await query(`ALTER TABLE tutorials ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT false;`);
  await query(`ALTER TABLE tutorials ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';`);
  await query(`ALTER TABLE tutorials ADD COLUMN IF NOT EXISTS "order" INT DEFAULT 0;`);
  await query(`ALTER TABLE tutorials ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0;`);
  await query(`ALTER TABLE tutorials ADD COLUMN IF NOT EXISTS completion_count INT DEFAULT 0;`);

  // Steps table
  await query(`
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
  `);
}
