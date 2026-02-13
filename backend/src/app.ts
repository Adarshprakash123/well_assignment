import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import documentsRoutes from "./routes/documentsRoutes.js";
import askRoutes from "./routes/askRoutes.js";

const app = express();

// Strip trailing slash to avoid CORS mismatch
const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/+$/, "");

app.use(cors({ origin: frontendUrl, credentials: true }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/ask", askRoutes);

app.use((err: Error & { code?: string }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  if (err.code === "LIMIT_FILE_SIZE") {
    res.status(413).json({ message: "File too large. Max 1MB allowed." });
    return;
  }
  res.status(500).json({ message: err.message || "Internal server error" });
});

export default app;
