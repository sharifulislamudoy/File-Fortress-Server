import express from "express";
import { askAssistant } from "../controllers/chatController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/ask", protect, askAssistant);

export default router;