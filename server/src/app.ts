import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { CorsOptions } from "cors";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { adminRoutes } from "./routes/adminRoutes.js";
import { publicRoutes } from "./routes/publicRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const allowedOrigins = Array.from(
  new Set(
    [env.CLIENT_URL, ...(env.CLIENT_URLS?.split(",").map((origin) => origin.trim()).filter(Boolean) ?? [])]
  )
);

const corsOptions: CorsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS origin not allowed: ${origin}`));
  }
};

export function createApp() {
  const app = express();
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors(corsOptions));
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
