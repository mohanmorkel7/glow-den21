import { pool } from "../db/connection";
import fs from "fs";
import path from "path";

export async function initDatabase() {
  try {
    const check = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
      );
    `);

    if (!check.rows[0].exists) {
      console.log("📦 Running schema.sql for first-time DB setup...");

      const sqlPath = path.join(process.cwd(), "docs", "schema.sql");
      const sqlContent = fs.readFileSync(sqlPath, "utf-8");

      // Split by semicolon but avoid breaking statements with `;` in them (basic safe splitting)
      const statements = sqlContent
        .split(/;\s*$/m)
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        await pool.query(statement);
      }

      console.log("✅ schema.sql executed.");
    } else {
      console.log("✅ Database already initialized.");
    }
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    throw error;
  }
}
