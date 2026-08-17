import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { adminRoutes } from "./routes/adminRoutes.js";
import { publicRoutes } from "./routes/publicRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));
  app.use(express.json({ limit: "1mb" }));
  app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));
  app.get("/health", (_req, res) => res.json({ ok: true, name: "White Angels Apparels API" }));
  app.use("/api/v1", publicRoutes);
  app.use("/api/v1/admin", adminRoutes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
