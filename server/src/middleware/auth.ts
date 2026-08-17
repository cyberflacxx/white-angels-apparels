import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "./error.js";

export type AdminJwt = { sub: string; role: "ADMIN"; email: string };

declare global {
  namespace Express {
    interface Request {
      admin?: AdminJwt;
    }
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return next(new AppError(401, "Admin authentication required."));
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AdminJwt;
    if (payload.role !== "ADMIN") throw new Error("Invalid role");
    req.admin = payload;
    return next();
  } catch {
    return next(new AppError(401, "Invalid or expired admin token."));
  }
}
