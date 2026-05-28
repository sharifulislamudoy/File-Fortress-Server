import express from "express";
import { uploadFile, deleteFile, uploadMiddleware } from "../controllers/fileController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/upload", protect, uploadMiddleware, uploadFile);
router.delete("/:fileId", protect, deleteFile);

export default router;