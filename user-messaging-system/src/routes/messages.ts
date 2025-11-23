import { Router } from "express";
import { sendMessage, getMessages, getConversationMessages, getMessageThread } from "../controllers/messagesController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

router.use(authenticateToken);
router.post("/", sendMessage);
router.get("/", getMessages);
router.get("/conversation/:userId", getConversationMessages);
router.get("/thread/:id", getMessageThread);

export default router;