// NODE_OPTIONS=--max-old-space-size=4096 npm run dev

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIM = 1536;

/**
 * Call OpenAI embeddings API directly via fetch.
 * Bypasses the openai SDK entirely to avoid its internal
 * response caching / closure retention that leaks memory.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const safeText = text.length > 32_000 ? text.slice(0, 32_000) : text;

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: safeText,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI API ${res.status}: ${body.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    data: Array<{ embedding: number[] }>;
  };

  // Extract only the float array — discard the rest of the response
  const embedding = json.data[0].embedding;
  return embedding;
}

export { EMBEDDING_DIM };
