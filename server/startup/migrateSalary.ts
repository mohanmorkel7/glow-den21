import { query } from "../db/connection";

export async function ensureSalaryTables(): Promise<void> {
  try {
    // salary_config table
    await query(`
      CREATE TABLE IF NOT EXISTS salary_config (
        id INT PRIMARY KEY,
        first_tier_rate NUMERIC NOT NULL DEFAULT 0.5,
        second_tier_rate NUMERIC NOT NULL DEFAULT 0.6,
        first_tier_limit INT NOT NULL DEFAULT 500,
        currency TEXT NOT NULL DEFAULT 'INR',
        updated_by_user_id TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // ensure single row with id=1
    await query(
      `INSERT INTO salary_config (id, first_tier_rate, second_tier_rate, first_tier_limit, currency)
       VALUES (1, 0.5, 0.6, 500, 'INR')
       ON CONFLICT (id) DO NOTHING`,
    );

    // pm_salaries table
    await query(`
      CREATE TABLE IF NOT EXISTS pm_salaries (
        id TEXT PRIMARY KEY DEFAULT ('pm_' || substr(md5(random()::text || clock_timestamp()::text),1,12)),
        user_id TEXT NOT NULL,
        monthly_salary NUMERIC NOT NULL,
        effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(
      `CREATE INDEX IF NOT EXISTS idx_pm_salaries_user_id ON pm_salaries(user_id)`,
    );

    console.log("✅ Salary tables ready");
  } catch (err) {
    console.error("❌ Failed to ensure salary tables:", err);
  }
}
