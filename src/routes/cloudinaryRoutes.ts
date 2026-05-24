import express from "express";
import { saveCloudinaryConfig, getCloudinaryConfig } from "../controllers/cloudinaryController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.route("/config")
  .get(protect, getCloudinaryConfig)
  .post(protect, saveCloudinaryConfig);

export default router;