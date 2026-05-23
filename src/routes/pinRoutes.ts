import express from "express";
import { setPin, verifyPin, checkPin } from "../controllers/pinController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/set", protect, setPin);
router.post("/verify", protect, verifyPin);
router.get("/check", protect, checkPin);

export default router;