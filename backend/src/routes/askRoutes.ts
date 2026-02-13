import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { ask } from "../controllers/askController.js";

const router = Router();

router.post("/", authMiddleware, ask);

export default router;
