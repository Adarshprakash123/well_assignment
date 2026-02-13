// If you experience heap issues, start with:
// NODE_OPTIONS=--max-old-space-size=4096 npm run dev

import { Router } from "express";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import { authMiddleware } from "../middlewares/auth.js";
import { uploadDocument } from "../controllers/uploadController.js";

const UPLOADS_DIR = path.resolve("uploads");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["text/plain", "text/markdown", "application/pdf"];
    const ext = file.originalname.toLowerCase();
    if (
      allowed.includes(file.mimetype) ||
      ext.endsWith(".txt") ||
      ext.endsWith(".md") ||
      ext.endsWith(".pdf")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only .txt, .md, and .pdf files allowed"));
    }
  },
});

const router = Router();

router.post("/", authMiddleware, upload.single("file"), uploadDocument);

export default router;
