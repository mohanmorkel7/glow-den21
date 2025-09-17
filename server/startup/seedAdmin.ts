import bcrypt from "bcrypt";
import { query } from "../db/connection";

export async function ensureInitialAdmin(): Promise<void> {
  try {
    // Check if users table exists
    const tableCheck = await query(
      "SELECT to_regclass('public.users') AS exists"
    );
    const tableExists = Boolean(tableCheck.rows[0]?.exists);

    if (!tableExists) {
      console.warn(
        "Users table not found. Skipping admin seeding. Please ensure the database schema is created."
      );
      return;
    }

    // Check if any user exists
    const countRes = await query("SELECT COUNT(*)::int AS count FROM users");
    const userCount = countRes.rows[0]?.count ?? 0;

    if (userCount > 0) {
      return; // Seed only when there are no users
    }

    const name = "Super Admin";
    const email = "admin@websyntactic.com";
    const plainPassword = "admin123";
    const hashed = await bcrypt.hash(plainPassword, 10);
    const role = "super_admin"; // Super admin bypasses permission checks

    const insertQuery = `
      INSERT INTO users (
        name, email, phone, hashed_password, role, status, department, job_title,
        avatar_url, theme, language, notifications_enabled, join_date, last_login,
        projects_count, created_at, updated_at
      ) VALUES (
        $1, $2, NULL, $3, $4, 'active', NULL, NULL,
        NULL, 'system', 'English', TRUE, CURRENT_DATE, NULL,
        0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING id
    `;

    const result = await query(insertQuery, [name, email, hashed, role]);
    const id = result.rows[0]?.id;

    console.log(
      `✅ Seeded initial admin user (id=${id}) -> ${email} / ${plainPassword}`
    );
  } catch (err) {
    console.error("❌ Failed to seed initial admin:", err);
  }
}
