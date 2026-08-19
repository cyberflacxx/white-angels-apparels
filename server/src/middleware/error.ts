import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return res.status(422).json({
      message: error.issues[0]?.message || "Validation failed.",
      errors: error.issues.map((issue) => ({
        path: issue.path,
        message: issue.message
      }))
    });
  }
  if (error instanceof AppError) {
    return res.status(error.status).json({ message: error.message });
  }

  const pgError = asPostgresError(error);
  if (pgError?.code === "23505") {
    return res.status(409).json({ message: mapUniqueViolation(pgError.constraint) });
  }

  const message = error instanceof Error ? error.message : "Internal server error";
  return res.status(message.includes("DATABASE_URL") ? 503 : 500).json({
    message: message.includes("DATABASE_URL") ? message : "Internal server error"
  });
}

function asPostgresError(error: unknown) {
  if (!error || typeof error !== "object") return null;
  const candidate = error as { code?: unknown; constraint?: unknown };
  return typeof candidate.code === "string"
    ? {
        code: candidate.code,
        constraint: typeof candidate.constraint === "string" ? candidate.constraint : ""
      }
    : null;
}

function mapUniqueViolation(constraint: string) {
  if (/slug/i.test(constraint)) return "A product with this URL slug already exists.";
  if (/sku/i.test(constraint)) return "A product with this SKU already exists.";
  return "A record with these details already exists.";
}
