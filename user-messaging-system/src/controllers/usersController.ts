import { Request, Response } from "express";
import { listUsers } from "../db/db.js";

export const getUsers = (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id; // from middleware
    const users = listUsers(userId);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};