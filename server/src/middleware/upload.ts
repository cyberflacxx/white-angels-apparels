import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import multer from "multer";
import { env } from "../config/env.js";
import { AppError } from "./error.js";

const allowedMimeTypes: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp"
};

const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function ensureUploadDirectory(relativeDirectory: string) {
  const target = path.resolve(env.UPLOAD_DIR, relativeDirectory);
  const root = path.resolve(env.UPLOAD_DIR);
  if (!target.startsWith(root)) throw new AppError(500, "Upload path configuration is invalid.");
  fs.mkdirSync(target, { recursive: true });
  return target;
}

function sanitizeOriginalExtension(originalName: string) {
  const extension = path.extname(originalName).toLowerCase();
  return allowedExtensions.has(extension) ? extension : "";
}

export function createImageUpload(relativeDirectory: "products" | "site" | "payment-proofs", maxFiles = 8) {
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, ensureUploadDirectory(relativeDirectory)),
    filename: (_req, file, cb) => {
      const mimeExtension = allowedMimeTypes[file.mimetype];
      const originalExtension = sanitizeOriginalExtension(file.originalname);
      if (!mimeExtension || (originalExtension && originalExtension !== mimeExtension && !(originalExtension === ".jpeg" && mimeExtension === ".jpg"))) {
        cb(new AppError(400, "Only JPG, PNG and WebP image uploads are allowed."), "");
        return;
      }

      cb(null, `${Date.now()}-${crypto.randomUUID()}${mimeExtension}`);
    }
  });

  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024, files: maxFiles },
    fileFilter: (_req, file, cb) => {
      const mimeExtension = allowedMimeTypes[file.mimetype];
      const originalExtension = sanitizeOriginalExtension(file.originalname);
      if (!mimeExtension || !originalExtension) {
        cb(new AppError(400, "Only JPG, PNG and WebP image uploads are allowed."));
        return;
      }
      cb(null, true);
    }
  });
}

export function toPublicUploadUrl(fileName: string, relativeDirectory: string) {
  return `${env.UPLOAD_PUBLIC_BASE}/${relativeDirectory}/${fileName}`.replace(/\/{2,}/g, "/");
}

export function resolveUploadPathFromUrl(url: string) {
  const publicBase = env.UPLOAD_PUBLIC_BASE.replace(/\/+$/, "");
  if (!url.startsWith(publicBase)) return "";
  const relativePath = url.slice(publicBase.length).replace(/^\/+/, "");
  const target = path.resolve(env.UPLOAD_DIR, relativePath);
  const root = path.resolve(env.UPLOAD_DIR);
  return target.startsWith(root) ? target : "";
}

export const productUpload = createImageUpload("products", 10);
export const siteUpload = createImageUpload("site", 1);
export const paymentProofUpload = createImageUpload("payment-proofs", 1);
