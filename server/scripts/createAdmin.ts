import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { appSchema, requirePool, searchPath, shutdownPool } from "../src/db/pool.js";

async function main() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_NAME ?? process.env.ADMIN_FULL_NAME ?? "White Angels Admin";
  if (!email || !password || password.length < 12) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD with at least 12 characters. Do not commit these values.");
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const pool = requirePool();
  await pool.query(`set search_path to ${searchPath}`);
  const schemaCheck = await pool.query("select current_schema() as schema");
  if (schemaCheck.rows[0]?.schema !== appSchema) throw new Error(`Wrong schema for admin creation: ${schemaCheck.rows[0]?.schema}`);
  await pool.query(
    `insert into admins (id, full_name, email, password_hash, role, status)
     values ($1,$2,$3,$4,'ADMIN','ACTIVE')
     on conflict (email) do update set password_hash = excluded.password_hash, updated_at = now()`,
    [randomUUID(), fullName, email, passwordHash]
  );
  console.log(`Admin ready: ${email}`);
}

main().finally(shutdownPool);
