// NODE_OPTIONS=--max-old-space-size=4096 npm run dev

import { Response } from "express";
import { unlink } from "fs/promises";
import { AuthRequest } from "../middlewares/auth.js";
import { processDocument } from "../services/upload.js";
import { extractTextFromFile } from "../utils/documentParser.js";

const MAX_TEXT = 50_000;

export async function uploadDocument(req: AuthRequest, res: Response): Promise<void> {
  const filePath = req.file?.path;

  try {
    const userId = req.userId!;
    const file = req.file as Express.Multer.File | undefined;

    if (!file || !filePath) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    console.log(
      `[upload] file: ${file.originalname} (${(file.size / 1024).toFixed(1)} KB, ${file.mimetype})`
    );

    // Extract text from disk — no Buffer on the heap
    let text = await extractTextFromFile(filePath, file.mimetype);

    // Delete uploaded file immediately — we only need the text from here
    await unlink(filePath).catch(() => {});

    if (text.length === 0) {
      res.status(400).json({ message: "File is empty or could not extract text" });
      return;
    }

    // Truncate to cap downstream memory
    if (text.length > MAX_TEXT) {
      console.log(`[upload] truncating text from ${text.length} to ${MAX_TEXT}`);
      text = text.slice(0, MAX_TEXT);
    }

    console.log(`[upload] extracted ${text.length} chars from ${file.originalname}`);

    const { documentId, chunksCreated } = await processDocument(
      userId,
      file.originalname,
      text
    );

    res.status(201).json({ success: true, documentId, chunksCreated });
  } catch (err) {
    console.error("[upload] error:", err);
    res.status(500).json({
      message: err instanceof Error ? err.message : "Upload failed",
    });
  } finally {
    // Safety net — delete file if it wasn't already removed above
    if (filePath) {
      await unlink(filePath).catch(() => {});
    }
  }
}
