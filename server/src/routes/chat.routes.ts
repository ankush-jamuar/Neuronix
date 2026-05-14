import { Router } from "express";
import { 
  getSessions, 
  createSession, 
  getSessionMessages, 
  deleteSession,
  renameSession,
  saveMessage
} from "../controllers/chat.controller";

const router = Router();

// Session Management
router.get("/sessions", getSessions);
router.post("/sessions", createSession);
router.patch("/sessions/:id", renameSession);
router.delete("/sessions/:id", deleteSession);

// Message Management
router.get("/sessions/:id/messages", getSessionMessages);
router.post("/messages", saveMessage);

export default router;
