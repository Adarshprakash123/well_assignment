import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.js";
import { askQuestion } from "../services/ask.js";

export async function ask(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const { question, documentId } = req.body as { question?: string; documentId?: string };

    if (!question || typeof question !== "string" || !question.trim()) {
      res.status(400).json({ message: "Question is required" });
      return;
    }

    const result = await askQuestion(userId, question.trim(), documentId || undefined);

    res.json(result);
  } catch (err) {
    console.error("Ask error:", err);
    res.status(500).json({ message: err instanceof Error ? err.message : "Ask failed" });
  }
}
