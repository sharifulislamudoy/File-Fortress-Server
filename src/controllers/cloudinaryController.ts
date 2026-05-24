import { Request, Response } from "express";
import mongoose from "mongoose";
import CloudinaryConfig from "../models/CloudinaryConfig";

// @desc    Save or update Cloudinary config for user
// @route   POST /api/cloudinary/config
export const saveCloudinaryConfig = async (req: Request, res: Response) => {
  try {
    const { folderName, unsignedUploadPreset } = req.body;

    if (!folderName || !unsignedUploadPreset) {
      return res.status(400).json({ message: "Folder name and unsigned upload preset are required" });
    }

    // Convert userId string to ObjectId
    const userId = new mongoose.Types.ObjectId(req.userId);

    // Upsert: update if exists, otherwise create
    const config = await CloudinaryConfig.findOneAndUpdate(
      { userId }, // filter
      { folderName, unsignedUploadPreset }, // update
      { upsert: true, new: true, lean: true } // options: return new doc, lean for plain object
    );

    if (!config) {
      return res.status(500).json({ message: "Failed to save configuration" });
    }

    res.status(200).json({
      message: "Cloudinary configuration saved successfully",
      config: {
        folderName: config.folderName,
        unsignedUploadPreset: config.unsignedUploadPreset,
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

    res.json({
      folderName: config.folderName,
      unsignedUploadPreset: config.unsignedUploadPreset,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};