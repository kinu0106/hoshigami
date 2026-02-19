import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const cfg: PoolConfig = process.env.DATABASE_URL
  ? {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  }
  : {
    host: process.env.DB_HOST ?? 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? undefined,
    database: process.env.DB_NAME ?? 'hoshigami',
  };

const pool = new Pool(cfg);

export async function getDbHealth(): Promise<{ ok: boolean; now?: string }> {
  try {
    const res = await pool.query('SELECT NOW() as now');
    return { ok: true, now: res.rows[0]?.now };
  } catch {
    return { ok: false };
  }
}

export default pool;


