import { Pool, PoolClient, QueryResult } from "pg";
import dotenv from "dotenv";

dotenv.config();

type DbConfigOptions = {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: false | { rejectUnauthorized: boolean };
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
};

const isConfigured =
  Boolean(process.env.DATABASE_URL) ||
  Boolean(
    process.env.DB_HOST &&
      process.env.DB_PORT &&
      process.env.DB_NAME &&
      process.env.DB_USER &&
      process.env.DB_PASSWORD,
  );

const dbConfig: DbConfigOptions = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.DB_SSL === "true" || process.env.DATABASE_SSL === "true"
          ? { rejectUnauthorized: false }
          : false,
      max: parseInt(process.env.DB_MAX_CONNECTIONS || "20"),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || "30000"),
      connectionTimeoutMillis: parseInt(
        process.env.DB_CONNECTION_TIMEOUT || "2000",
      ),
    }
  : isConfigured
  ? {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT as string, 10),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
      max: parseInt(process.env.DB_MAX_CONNECTIONS || "20"),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || "30000"),
      connectionTimeoutMillis: parseInt(
        process.env.DB_CONNECTION_TIMEOUT || "2000",
      ),
    }
  : {};

let pool: Pool | null = null;

if (isConfigured) {
  pool = new Pool(dbConfig as any);

  pool.on("error", (err: Error) => {
    console.error("Unexpected error on idle client", err);
  });
}

export const isDbConfigured = (): boolean => isConfigured;

const notConfiguredError = () =>
  new Error(
    "Database not configured. Set DATABASE_URL or DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD environment variables.",
  );

export const query = async (
  text: string,
  params?: any[],
): Promise<QueryResult> => {
  if (!pool) throw notConfiguredError();
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;

  if (process.env.NODE_ENV === "development") {
    console.log("🔍 Query executed:", {
      text: text.substring(0, 100) + "...",
      duration,
      rows: res.rowCount,
    });
  }

  return res;
};

export const transaction = async <T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> => {
  if (!pool) throw notConfiguredError();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const paginatedQuery = async (
  baseQuery: string,
  countQuery: string,
  params: any[] = [],
  page: number = 1,
  limit: number = 20,
) => {
  const offset = (page - 1) * limit;

  const countResult = await query(countQuery, params);
  const total = parseInt(countResult.rows[0].count);

  const dataQuery = `${baseQuery} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const dataResult = await query(dataQuery, [...params, limit, offset]);

  return {
    data: dataResult.rows,
    pagination: {
      total,
      page: parseInt(page.toString()),
      limit: parseInt(limit.toString()),
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const cleanup = async (): Promise<void> => {
  try {
    if (pool) {
      await pool.end();
      console.log("🔌 Database connection pool closed");
    }
  } catch (error) {
    console.error("❌ Error closing database pool:", error);
  }
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

export { pool };
