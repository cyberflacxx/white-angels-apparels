import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AppError } from "./error.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadRoot = path.resolve(__dirname, "../../uploads");

const storage = multer.diskStorage({
  destination: uploadRoot,
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-z0-9.-]/gi, "-")}`)
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter: (_req, file, cb) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      cb(new AppError(400, "Only JPG, PNG and WebP image uploads are allowed."));
      return;
    }
    cb(null, true);
  }
});
