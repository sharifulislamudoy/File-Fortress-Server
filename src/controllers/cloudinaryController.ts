import { Request, Response } from "express";
import mongoose from "mongoose";
import CloudinaryConfig from "../models/CloudinaryConfig";
import { encrypt, decrypt } from "../utils/encryption";

// @desc    Save or update Cloudinary config for user
// @route   POST /api/cloudinary/config
export const saveCloudinaryConfig = async (req: Request, res: Response) => {
  try {
    const { folderName, unsignedUploadPreset } = req.body;

    if (!folderName || !unsignedUploadPreset) {
      return res.status(400).json({ message: "Folder name and unsigned upload preset are required" });
    }

    const userId = new mongoose.Types.ObjectId(req.userId);

    // Encrypt before saving
    const encryptedFolder = encrypt(folderName.trim());
    const encryptedPreset = encrypt(unsignedUploadPreset.trim());

    const config = await CloudinaryConfig.findOneAndUpdate(
      { userId },
      { folderName: encryptedFolder, unsignedUploadPreset: encryptedPreset },
      { upsert: true, new: true, lean: true }
    );

    if (!config) {
      return res.status(500).json({ message: "Failed to save configuration" });
    }

    res.status(200).json({
      message: "Cloudinary configuration saved successfully",
      config: {
        folderName: folderName.trim(),           // return original (not encrypted)
        unsignedUploadPreset: unsignedUploadPreset.trim(),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get Cloudinary config for user
// @route   GET /api/cloudinary/config
export const getCloudinaryConfig = async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const config = await CloudinaryConfig.findOne({ userId }).lean();

    if (!config) {
      return res.status(404).json({ message: "No Cloudinary configuration found" });
    }

    // Decrypt before returning
    res.json({
      folderName: decrypt(config.folderName),
      unsignedUploadPreset: decrypt(config.unsignedUploadPreset),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};