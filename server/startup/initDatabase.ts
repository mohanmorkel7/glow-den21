import { pool } from "../db/connection"; // your PG pool instance
import fs from "fs";
import path from "path";

export async function initDatabase() {
  try {
    const check = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users1'
      );
    `);

    if (!check.rows[0].exists) {
      console.log("📦 Running schema.sql for first-time DB setup...");
      const sql = fs.readFileSync(path.join(process.cwd(), "docs", "schema.sql"), "utf-8");
      await pool.query(sql);
      console.log("✅ schema.sql executed.");
    } else {
      console.log("✅ Database already initialized.");
    }
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    throw error;
  }
}
