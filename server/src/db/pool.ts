import pg, { type QueryResultRow } from "pg";
import { env } from "../config/env.js";

const { Pool } = pg;
export const appSchema = env.DATABASE_SCHEMA;
export const appDbRole = env.DATABASE_APP_ROLE;
export const searchPath = `${appSchema},pg_catalog`;

export const pool = env.DATABASE_URL
  ? new Pool({
      connectionString: env.DATABASE_URL,
      options: `-c search_path=${searchPath}`,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    })
  : null;

export function requirePool() {
  if (!pool) throw new Error("DATABASE_URL is required for database operations.");
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
  return requirePool().query<T>(text, params);
}

export async function verifySchema() {
  const result = await query<{
    current_database: string;
    current_user: string;
    current_schema: string;
    search_path: string;
    version: string;
  }>(
    "select current_database(), current_user, current_schema(), current_setting('search_path') as search_path, version()"
  );
  const row = result.rows[0];
  if (row.current_schema !== appSchema) {
    throw new Error(`Wrong database schema: expected ${appSchema}, got ${row.current_schema}`);
  }
  return row;
}

export async function shutdownPool() {
  if (pool) await pool.end();
}
