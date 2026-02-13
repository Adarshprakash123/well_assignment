// If you experience heap issues, start with:
// NODE_OPTIONS=--max-old-space-size=4096 npm run dev

import { spawn } from "child_process";
import { readFile, unlink, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";

const MAX_EXTRACTED_LENGTH = 50_000;

/**
 * Extract text from a file on disk. Accepts a file path (from multer disk
 * storage) so no large Buffer ever lives on the JS heap.
 */
export async function extractTextFromFile(
  filePath: string,
  mimetype: string
): Promise<string> {
  let text = "";

  if (mimetype === "text/plain" || filePath.endsWith(".txt")) {
    text = await readFile(filePath, "utf-8");
  } else if (mimetype === "text/markdown" || filePath.endsWith(".md")) {
    text = await readFile(filePath, "utf-8");
  } else if (mimetype === "application/pdf" || filePath.toLowerCase().endsWith(".pdf")) {
    text = await extractTextFromPdf(filePath);
  } else {
    throw new Error("Unsupported file type");
  }

  if (text.length > MAX_EXTRACTED_LENGTH) {
    console.log(`Text truncated from ${text.length} to ${MAX_EXTRACTED_LENGTH} chars`);
    text = text.slice(0, MAX_EXTRACTED_LENGTH);
  }

  return text;
}

/**
 * Extract text from a PDF using pdftotext (poppler) via spawn.
 * Writes output to a temp file so no large stdout buffer is held in memory.
 * Install: brew install poppler
 */
async function extractTextFromPdf(pdfPath: string): Promise<string> {
  const outFile = join(tmpdir(), `txt-${randomUUID()}.txt`);

  await new Promise<void>((resolve, reject) => {
    // pdftotext [options] <input.pdf> <output.txt>
    const proc = spawn("pdftotext", ["-layout", pdfPath, outFile], {
      stdio: ["ignore", "ignore", "pipe"],
      timeout: 30_000,
    });

    let stderr = "";
    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on("error", (err) =>
      reject(new Error(`pdftotext failed to start: ${err.message}. Install: brew install poppler`))
    );

    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`pdftotext exited with code ${code}: ${stderr}`));
      }
    });
  });

  try {
    return await readFile(outFile, "utf-8");
  } finally {
    await unlink(outFile).catch(() => {});
  }
}
