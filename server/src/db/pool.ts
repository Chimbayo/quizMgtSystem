import { Pool } from 'pg';
import env from '../config/env';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
});

export default pool;


