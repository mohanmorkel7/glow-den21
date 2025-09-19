import { query } from "../db/connection";

export async function ensureTutorialTables() {
  // tutorials table stores metadata and file storage info
  await query(`
    CREATE TABLE IF NOT EXISTS tutorials (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'getting_started',
      status TEXT DEFAULT 'published',
      video_file_name TEXT,
      video_file_path TEXT,
      video_mime TEXT,
      created_by_user_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
