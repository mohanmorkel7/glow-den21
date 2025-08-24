import { Pool, PoolClient, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'bpo_management',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
};

// Create connection pool
const pool = new Pool(dbConfig);

// Handle pool errors
pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test database connection
pool.connect((err: Error | undefined, client: PoolClient | undefined, release: any) => {
  if (err) {
    console.error('Error acquiring client', err.stack);
    return;
  }
  
  if (!client) {
    console.error('No client returned from pool');
    return;
  }
  
  client.query('SELECT NOW()', (err: Error | null, result: QueryResult) => {
    release();
    if (err) {
      console.error('Error executing query', err.stack);
      return;
    }
    console.log('✅ Database connected successfully');
    console.log(`📊 Database: ${dbConfig.database} on ${dbConfig.host}:${dbConfig.port}`);
  });
});

// Query helper function
export const query = async (text: string, params?: any[]): Promise<QueryResult> => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Query executed:', { 
        text: text.substring(0, 100) + '...', 
        duration, 
        rows: res.rowCount 
      });
    }
    
    return res;
  } catch (error) {
    console.error('❌ Database query error:', error);
    throw error;
  }
};

// Transaction helper function
export const transaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Helper function for paginated queries
export const paginatedQuery = async (
  baseQuery: string, 
  countQuery: string, 
  params: any[] = [], 
  page: number = 1, 
  limit: number = 20
) => {
  const offset = (page - 1) * limit;
  
  // Get total count
  const countResult = await query(countQuery, params);
  const total = parseInt(countResult.rows[0].count);
  
  // Get paginated data
  const dataQuery = `${baseQuery} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const dataResult = await query(dataQuery, [...params, limit, offset]);
  
  return {
    data: dataResult.rows,
    pagination: {
      total,
      page: parseInt(page.toString()),
      limit: parseInt(limit.toString()),
      totalPages: Math.ceil(total / limit)
    }
  };
};

// Cleanup function for graceful shutdown
export const cleanup = async (): Promise<void> => {
  try {
    await pool.end();
    console.log('🔌 Database connection pool closed');
  } catch (error) {
    console.error('❌ Error closing database pool:', error);
  }
};

// Handle process termination
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

export { pool };
