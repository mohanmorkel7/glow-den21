import { query } from "../db/connection";

export async function ensureExpenseTables(): Promise<void> {
  try {
    await query(`
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
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(
      `CREATE INDEX IF NOT EXISTS idx_expenses_month ON expenses(month)`,
    );

    // Ensure legacy deployments that missed the 'date' column get the column added
    await query("ALTER TABLE expenses ADD COLUMN IF NOT EXISTS date DATE");
    // Ensure legacy deployments that missed the 'receipt' column get the column added
    await query("ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt TEXT");

    // Ensure expense_date exists (newer schema) and migrate values from date if needed
    await query(
      "ALTER TABLE expenses ADD COLUMN IF NOT EXISTS expense_date DATE",
    );
    // Copy any existing 'date' values into 'expense_date'
    await query(
      "UPDATE expenses SET expense_date = date WHERE expense_date IS NULL AND date IS NOT NULL",
    );
    // If still null, fallback to created_at date
    await query(
      "UPDATE expenses SET expense_date = (created_at AT TIME ZONE 'UTC')::date WHERE expense_date IS NULL AND created_at IS NOT NULL",
    );
    // Make column NOT NULL if all rows now populated
    await query(
      "DO $$ BEGIN IF (SELECT COUNT(*) FROM expenses WHERE expense_date IS NULL) = 0 THEN ALTER TABLE expenses ALTER COLUMN expense_date SET NOT NULL; END IF; END $$;",
    );

    // Ensure approved_by/approved_at exist for older DBs
    await query(
      "ALTER TABLE expenses ADD COLUMN IF NOT EXISTS approved_by TEXT",
    );
    await query(
      "ALTER TABLE expenses ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE",
    );

    await query(
      `CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(type)`,
    );
    await query(
      `CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status)`,
    );

    console.log("✅ Expense tables ready");
  } catch (err) {
    console.error("❌ Failed to ensure expense tables:", err);
  }
}
