import { query, isDbConfigured } from "../db/connection";

export async function ensureFileProcessTables(): Promise<void> {
  try {
    if (!isDbConfigured()) {
      console.warn(
        "Database not configured. Skipping file process migrations.",
      );
      return;
    }

    // Create file_processes table
    await query(`
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
      )
    `);

    // Create file_requests table (requests/assignments/verifications)
    await query(`
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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Non-breaking schema evolution for verification flow
    await query(
      "ALTER TABLE file_requests ADD COLUMN IF NOT EXISTS uploaded_file_name TEXT",
    );
    await query(
      "ALTER TABLE file_requests ADD COLUMN IF NOT EXISTS uploaded_file_path TEXT",
    );
    await query(
      "ALTER TABLE file_requests ADD COLUMN IF NOT EXISTS verification_status TEXT",
    );
    await query(
      "ALTER TABLE file_requests ADD COLUMN IF NOT EXISTS verified_by TEXT",
    );
    await query(
      "ALTER TABLE file_requests ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE",
    );
    await query(
      "ALTER TABLE file_requests ADD COLUMN IF NOT EXISTS rework_count INT DEFAULT 0",
    );
    await query(
      "ALTER TABLE file_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP",
    );

    // Ensure projects table has rate_per_file_usd for billing
    await query(
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS rate_per_file_usd NUMERIC",
    );

    // Indexes for performance
    await query(
      "CREATE INDEX IF NOT EXISTS idx_file_processes_project_id ON file_processes(project_id)",
    );
    await query(
      "CREATE INDEX IF NOT EXISTS idx_file_requests_file_process_id ON file_requests(file_process_id)",
    );

    console.log("✅ File process tables ready");
  } catch (err) {
    console.error("❌ Failed to ensure file process tables:", err);
  }
}
