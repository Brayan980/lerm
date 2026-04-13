
'use server';

import { Pool, type QueryResult, type QueryResultRow, type PoolConfig } from 'pg';

let pool: Pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.POSTGRES_URL;
    const nodeEnv = process.env.NODE_ENV;

    console.log('[DB_INIT] Initializing database pool.');
    console.log(`[DB_INIT] NODE_ENV: ${nodeEnv}`);

    if (!connectionString) {
      console.error("[DB_INIT_ERROR] POSTGRES_URL environment variable is not defined.");
      throw new Error("La variable de entorno POSTGRES_URL no está definida.");
    } else {
      // Redact password for logging
      const redactedConnectionString = connectionString.replace(/:([^:@\/]+)@/, ':********@');
      console.log(`[DB_INIT] POSTGRES_URL (redacted): ${redactedConnectionString}`);
      
      let sslOptionForPool: PoolConfig['ssl'];

      if (nodeEnv === 'production') {
        // For production, require SSL and validate certificate
        sslOptionForPool = { rejectUnauthorized: true };
        console.log('[DB_INIT] Production environment: SSL will be required and certificates validated.');
      } else {
        // For local development, explicitly disable SSL if the local server isn't configured for it,
        // or if the connection string doesn't specify sslmode=require.
        // The error "The server does not support SSL connections" strongly indicates SSL should be disabled for local.
        sslOptionForPool = false; // Explicitly disable SSL for non-production
        console.log('[DB_INIT] Development/local environment: SSL will be disabled for DB connection.');
      }
      
      console.log(`[DB_INIT] Final SSL option for Pool: ${typeof sslOptionForPool === 'boolean' ? sslOptionForPool : JSON.stringify(sslOptionForPool)}`);

      pool = new Pool({
        connectionString,
        ssl: sslOptionForPool,
      });

      pool.on('connect', () => {
        console.log('[DB_EVENT] Client connected to PostgreSQL pool');
      });

      pool.on('error', (err, client) => {
        console.error('[DB_EVENT_ERROR] Unexpected error on idle database client', err);
      });
    }
  }
  return pool;
}

// Define a simpler return type for our query function
interface SimpleQueryResult<R extends QueryResultRow = any> {
  rows: R[];
  rowCount: number | null;
}

export async function query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<SimpleQueryResult<T>> {
  const start = Date.now();
  const client = await getPool().connect();
  try {
    const res: QueryResult<T> = await client.query(text, params);
    const duration = Date.now() - start;
    console.log('Consulta ejecutada:', { text: text.substring(0, 100), duration, rows: res.rowCount });

    // Asegurar que las filas sean objetos planos antes de devolverlas
    const plainRows = res.rows.map(row => ({ ...row } as T));

    return { rows: plainRows, rowCount: res.rowCount };
  } finally {
    client.release();
  }
}

export async function getDbTime() {
  try {
    const { rows } = await query('SELECT NOW()');
    return rows[0].now;
  } catch (error) {
    console.error('Error al obtener la hora de la DB:', error);
    throw error;
  }
}
