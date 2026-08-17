import fs from "node:fs/promises";
import path from "node:path";
import { appDbRole, appSchema, requirePool, searchPath, shutdownPool } from "../src/db/pool.js";

const migrationsDir = path.resolve(process.cwd(), "../database/migrations");

async function main() {
  const client = await requirePool().connect();
  try {
    const schemaExists = await client.query<{ exists: boolean }>(
      "select exists(select 1 from pg_namespace where nspname = $1) as exists",
      [appSchema]
    );
    if (!schemaExists.rows[0]?.exists) {
      await client.query(`create schema ${appSchema}`);
    }
    await client.query(`set search_path to ${searchPath}`);
    await client.query(`create table if not exists ${appSchema}.schema_migrations (filename text primary key, applied_at timestamptz not null default now())`);
    const schemaCheck = await client.query("select current_schema() as schema");
    if (schemaCheck.rows[0]?.schema !== appSchema) {
      throw new Error(`Refusing to run migrations in wrong schema: ${schemaCheck.rows[0]?.schema}`);
    }

    const applied = await client.query<{ filename: string }>(`select filename from ${appSchema}.schema_migrations`);
    const done = new Set(applied.rows.map((row) => row.filename));
    const files = (await fs.readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();

    for (const file of files) {
      if (done.has(file)) continue;
      const sql = (await fs.readFile(path.join(migrationsDir, file), "utf8"))
        .replaceAll("white_angels_apparels", "__WA_APP_SCHEMA__")
        .replaceAll("white_angels_app", "__WA_APP_ROLE__")
        .replaceAll("__WA_APP_SCHEMA__", appSchema)
        .replaceAll("__WA_APP_ROLE__", appDbRole);

      try {
        await client.query("begin");
        await client.query(`set local search_path to ${searchPath}`);
        await client.query(sql);
        await client.query(`insert into ${appSchema}.schema_migrations (filename) values ($1)`, [file]);
        await client.query("commit");
        done.add(file);
        console.log(`Applied ${file}`);
      } catch (error) {
        await client.query("rollback");
        throw error;
      }
    }
  } finally {
    client.release();
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Migration failed.");
    process.exitCode = 1;
  })
  .finally(shutdownPool);
