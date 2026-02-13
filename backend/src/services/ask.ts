import OpenAI from "openai";
import { prisma } from "../utils/prisma.js";
import { getEmbedding } from "./embedding.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const TOP_K = 5;
const LLM_MODEL = process.env.LLM_MODEL || "gpt-4o-mini";

export interface Source {
  documentName: string;
  snippet: string;
}

export interface AskResult {
  answer: string;
  sources: Source[];
}

/**
 * Ask flow: embed question -> pgvector similarity search -> get chunks -> LLM answer.
 */
export async function askQuestion(
  userId: string,
  question: string,
  documentId?: string
): Promise<AskResult> {
  const embedding = await getEmbedding(question);
  const vectorStr = `[${embedding.join(",")}]`;

  const sql = documentId
    ? `
    SELECT c.content, d.name as "documentName", d.id as "documentId"
    FROM "Chunk" c
    JOIN "Document" d ON c."documentId" = d.id
    WHERE d."userId" = $1 AND d.id = $3
    ORDER BY c.embedding <=> $2::vector
    LIMIT ${TOP_K}
  `
    : `
    SELECT c.content, d.name as "documentName", d.id as "documentId"
    FROM "Chunk" c
    JOIN "Document" d ON c."documentId" = d.id
    WHERE d."userId" = $1
    ORDER BY c.embedding <=> $2::vector
    LIMIT ${TOP_K}
  `;

  const results = await prisma.$queryRawUnsafe<
    Array<{ content: string; documentName: string; documentId: string }>
  >(sql, userId, vectorStr, ...(documentId ? [documentId] : []));

  if (results.length === 0) {
    return {
      answer: "I couldn't find any relevant information in your documents. Please upload some documents first.",
      sources: [],
    };
  }

  const context = results
    .map((r) => `[From: ${r.documentName}]\n${r.content}`)
    .join("\n\n---\n\n");

  const systemPrompt = `You are a helpful assistant. Answer the user's question using ONLY the provided context from their documents. If the context doesn't contain the answer, say "I couldn't find this information in your documents." Do not make up information.`;

  const completion = await openai.chat.completions.create({
    model: LLM_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Context:\n${context}\n\nQuestion: ${question}` },
    ],
    temperature: 0.1,
  });

  const answer = completion.choices[0]?.message?.content?.trim() || "No answer generated.";

  const sources: Source[] = results.map((r) => ({
    documentName: r.documentName,
    snippet: r.content.slice(0, 200) + (r.content.length > 200 ? "..." : ""),
  }));

  return { answer, sources };
}
