import express from "express";
import {
  createNote,
  getFolderNotes,
  deleteNote,
} from "../controllers/noteController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", protect, createNote);
router.get("/folder/:folderId", protect, getFolderNotes);
router.delete("/:noteId", protect, deleteNote);

export default router;