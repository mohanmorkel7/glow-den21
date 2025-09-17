import bcrypt from "bcrypt";
import { query } from "../db/connection";

export async function ensureInitialAdmin(): Promise<void> {
  try {
    // Check if users table exists
    const tableCheck = await query("SELECT to_regclass('public.users') AS exists");
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

    // Discover available columns on users table to avoid inserting into missing columns
    const colsRes = await query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='users'"
    );
    const availableCols = (colsRes.rows || []).map((r: any) => String(r.column_name));

    // Candidate columns and values
    const candidates: { name: string; value?: any; expr?: string }[] = [
      { name: "name", value: name },
      { name: "email", value: email },
      { name: "phone", value: null },
      { name: "hashed_password", value: hashed },
      { name: "role", value: role },
      { name: "status", value: "active" },
      { name: "department", value: null },
      { name: "job_title", value: null },
      { name: "avatar_url", value: null },
      { name: "theme", value: "system" },
      { name: "language", value: "English" },
      { name: "notifications_enabled", expr: "TRUE" },
      { name: "join_date", expr: "CURRENT_DATE" },
      { name: "last_login", value: null },
      { name: "projects_count", expr: "0" },
      { name: "created_at", expr: "CURRENT_TIMESTAMP" },
      { name: "updated_at", expr: "CURRENT_TIMESTAMP" },
    ];

    const colsToInsert: string[] = [];
    const valuesParts: string[] = [];
    const params: any[] = [];

    for (const c of candidates) {
      if (!availableCols.includes(c.name)) continue;
      colsToInsert.push(c.name);
      if (c.expr !== undefined) {
        valuesParts.push(c.expr);
      } else {
        params.push(c.value);
        valuesParts.push(`$${params.length}`);
      }
    }

    if (colsToInsert.length === 0) {
      console.warn("No writable columns found on users table. Skipping seeding.");
      return;
    }

    const insertSql = `INSERT INTO users (${colsToInsert.join(",")}) VALUES (${valuesParts.join(",")}) RETURNING id`;
    const result = await query(insertSql, params);
    const id = result.rows[0]?.id;

    console.log(`✅ Seeded initial admin user (id=${id}) -> ${email} / ${plainPassword}`);
  } catch (err) {
    console.error("❌ Failed to seed initial admin:", err);
  }
}
