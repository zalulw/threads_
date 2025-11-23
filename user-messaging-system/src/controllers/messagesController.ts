import { Request, Response } from "express";
import { createMessage, getMessagesForUser, getAllMessages, getConversation, getThread } from "../db/db.js";

export const sendMessage = (req: Request, res: Response) => {
  try {
    const { recipient_id, content, parent_id }: { recipient_id: number; content: string; parent_id?: number } = req.body;
    const senderId = (req as any).user?.id;
    const message = createMessage(senderId, recipient_id, content, parent_id);
    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ error: "Failed to send message" });
  }
};

export const getMessages = (req: Request, res: Response) => {
  try {
    const messages = getAllMessages();
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

export const getConversationMessages = (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const otherUserId = parseInt(req.params.userId);
    const messages = getConversation(userId, otherUserId);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
};

export const getMessageThread = (req: Request, res: Response) => {
  try {
    const messageId = parseInt(req.params.id);
    const thread = getThread(messageId);
    res.json(thread);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch thread" });
  }
};