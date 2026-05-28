import express from "express";
import {
  createFolder,
  getRootFolders,
  getFolderBySlug,
  getFolderContents,
  getAllUserFolders,
  updateFolder,
  deleteFolder,
} from "../controllers/folderController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", protect, createFolder);
router.get("/root", protect, getRootFolders);
router.get("/slug/:slug", protect, getFolderBySlug);
router.get("/:folderId/contents", protect, getFolderContents);
router.get("/all", protect, getAllUserFolders);
router.put("/:folderId", protect, updateFolder);    // <-- new
router.delete("/:folderId", protect, deleteFolder); // <-- new

export default router;