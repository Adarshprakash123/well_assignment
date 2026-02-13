import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.js";
import { prisma } from "../utils/prisma.js";

export async function listDocuments(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;

    const documents = await prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, createdAt: true },
    });

    res.json({ documents });
  } catch (err) {
    console.error("List documents error:", err);
    res.status(500).json({ message: "Failed to list documents" });
  }
}
