import { appSchema, shutdownPool, verifySchema } from "../src/db/pool.js";

async function main() {
  const info = await verifySchema();
  console.log({
    connected: true,
    expectedSchema: appSchema,
    currentDatabase: info.current_database,
    currentUser: info.current_user,
    currentSchema: info.current_schema,
    searchPath: info.search_path,
    postgresqlVersion: info.version
  });
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Database check failed.");
    process.exitCode = 1;
  })
  .finally(shutdownPool);
