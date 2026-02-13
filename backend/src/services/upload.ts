// NODE_OPTIONS=--max-old-space-size=4096 npm run dev

import { v4 as uuidv4 } from "uuid";
import { prisma } from "../utils/prisma.js";
import { getEmbedding } from "./embedding.js";

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;
const MAX_CHUNKS = 2000;

/**
 * Lazy generator — yields one chunk at a time.
 * Never builds a full array in memory.
 */
function* splitIntoChunks(text: string): Generator<string> {
  let start = 0;
  let count = 0;

  while (start < text.length) {
    if (++count > MAX_CHUNKS) {
      throw new Error(`Chunking safety limit reached (${MAX_CHUNKS}). Document too large.`);
    }

    let end = Math.min(start + CHUNK_SIZE, text.length);

    if (end < text.length) {
      const period = text.lastIndexOf(".", end);
      if (period > start + CHUNK_SIZE / 2) {
        end = period + 1;
      }
    }

    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) {
      yield chunk;
    }

    const next = end - CHUNK_OVERLAP;
    if (next <= start) {
      // Guarantee forward progress
      start = end;
    } else {
      start = next;
    }

    if (start >= text.length) break;
  }
}

/**
 * Process one chunk at a time:
 *   1. slice text → single chunk
 *   2. call OpenAI for embedding
 *   3. INSERT into Postgres immediately
 *   4. discard chunk + embedding before next iteration
 */
export async function processDocument(
  userId: string,
  name: string,
  text: string
): Promise<{ documentId: string; chunksCreated: number }> {
  console.log(`[upload] text length: ${text.length}`);

  const documentId = uuidv4();

  await prisma.document.create({
    data: { id: documentId, name, userId },
  });

  let stored = 0;
  let index = 0;

  for (const chunk of splitIntoChunks(text)) {
    index++;

    // Embed ONE chunk
    const embedding = await getEmbedding(chunk);

    // Build vector literal and persist immediately
    const vectorStr = `[${embedding.join(",")}]`;

    await prisma.$executeRaw`
      INSERT INTO "Chunk" (id, content, embedding, "documentId", "createdAt")
      VALUES (${uuidv4()}, ${chunk}, ${vectorStr}::vector, ${documentId}, NOW())
    `;

    stored++;
    console.log(`[upload] chunk ${index} stored (${chunk.length} chars)`);

    // embedding and vectorStr go out of scope here — GC can reclaim
  }

  console.log(`[upload] done — ${stored} chunks stored for doc ${documentId}`);

  if (stored === 0) {
    throw new Error("Document produced no usable chunks");
  }

  return { documentId, chunksCreated: stored };
}
