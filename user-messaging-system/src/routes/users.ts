import { Router } from "express";
import { getUsers } from "../controllers/usersController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

router.use(authenticateToken);
router.get("/", getUsers);

export default router;