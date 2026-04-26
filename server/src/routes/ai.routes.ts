import express from "express";
import { askAIController } from "../controllers/ai.controller";

const router = express.Router();

router.post("/ask", askAIController);

export default router;
