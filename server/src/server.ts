import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { shutdownPool } from "./db/pool.js";

const server = createApp().listen(env.PORT, () => {
  console.log(`White Angels Apparels API listening on port ${env.PORT}`);
});

async function shutdown(signal: string) {
  console.log(`${signal} received. Closing server.`);
  server.close(async () => {
    await shutdownPool();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
