import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { getInternalUserId } from "../utils/auth";

export const getSessions = async (req: Request, res: Response) => {
  const userId = await getInternalUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const sessions = await prisma.chatSession.findMany({
      where: { userId, isDeleted: false },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        createdAt: true,
      }
    });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
};

export const createSession = async (req: Request, res: Response) => {
  const userId = await getInternalUserId(req);
  if (!userId) {
    console.warn("[ChatController] createSession: Unauthorized - No userId found");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { title } = req.body;
  console.log(`[ChatController] Creating session for user ${userId} with title: ${title}`);

  try {
    const session = await prisma.chatSession.create({
      data: {
        userId,
        title: title || "New Conversation"
      }
    });
    console.log(`[ChatController] Session created successfully: ${session.id}`);
    res.json(session);
  } catch (error) {
    console.error("[ChatController] Failed to create session:", error);
    res.status(500).json({ error: "Failed to create session" });
  }
};

export const renameSession = async (req: Request, res: Response) => {
  const userId = await getInternalUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { id } = req.params;
  const { title } = req.body;

  try {
    const session = await prisma.chatSession.update({
      where: { id, userId },
      data: { title }
    });
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: "Failed to rename session" });
  }
};

export const deleteSession = async (req: Request, res: Response) => {
  const userId = await getInternalUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { id } = req.params;

  try {
    await prisma.chatSession.update({
      where: { id, userId },
      data: { isDeleted: true }
    });
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ error: "Failed to delete session" });
  }
};

export const getSessionMessages = async (req: Request, res: Response) => {
  const userId = await getInternalUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { id } = req.params;

  try {
    const messages = await prisma.chatMessage.findMany({
      where: { chatSessionId: id, userId },
      orderBy: { createdAt: "asc" }
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

export const saveMessage = async (req: Request, res: Response) => {
  const userId = await getInternalUserId(req);
  if (!userId) {
    console.warn("[ChatController] saveMessage: Unauthorized");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { sessionId, role, content, sources } = req.body;
  
  if (!sessionId) {
    console.warn("[ChatController] saveMessage: Missing sessionId");
    return res.status(400).json({ error: "Missing sessionId" });
  }

  try {
    const message = await prisma.chatMessage.create({
      data: {
        userId,
        chatSessionId: sessionId,
        role: role.toUpperCase() as any, // Standardized: USER, ASSISTANT, SYSTEM
        content,
        sources: sources || {},
        status: 'COMPLETED'
      }
    });

    console.log(`[ChatController] Message saved: ${message.id} for session: ${sessionId}`);

    // Update session timestamp
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() }
    });

    res.json(message);
  } catch (error) {
    console.error("[ChatController] Failed to save message:", error);
    res.status(500).json({ error: "Failed to save message" });
  }
};
