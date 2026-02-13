import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { listDocuments } from "../controllers/documentsController.js";

const router = Router();

router.get("/", authMiddleware, listDocuments);

export default router;
