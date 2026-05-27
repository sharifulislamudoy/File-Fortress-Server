import { Request, Response } from "express";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import CloudinaryConfig from "../models/CloudinaryConfig";
import { encrypt, decrypt } from "../utils/encryption";

// Helper to safely decrypt a field
function safeDecrypt(encryptedValue: string | undefined): string | null {
  if (!encryptedValue) return null;
  try {
    return decrypt(encryptedValue);
  } catch (err) {
    console.error("Decryption failed for field:", err);
    return null;
  }
}

// @desc    Save or update Cloudinary config for user (with validation)
// @route   POST /api/cloudinary/config
export const saveCloudinaryConfig = async (req: Request, res: Response) => {
  try {
    const { cloudName, folderName, apiKey, apiSecret } = req.body;

    if (!cloudName || !folderName || !apiKey || !apiSecret) {
      return res.status(400).json({
        message: "Cloud Name, Folder name, API key, and API secret are required",
      });
    }

    // Validate credentials with Cloudinary API
    cloudinary.config({
      cloud_name: cloudName.trim(),
      api_key: apiKey.trim(),
      api_secret: apiSecret.trim(),
    });

    try {
      await cloudinary.api.ping();
    } catch (err: any) {
      console.error("Cloudinary validation failed:", err.message);
      return res.status(400).json({
        message: "Invalid Cloudinary credentials or cloud name. Please check and try again.",
      });
    }

    const userId = new mongoose.Types.ObjectId(req.userId);

    // Encrypt before saving
    const encryptedCloudName = encrypt(cloudName.trim());
    const encryptedFolder = encrypt(folderName.trim());
    const encryptedKey = encrypt(apiKey.trim());
    const encryptedSecret = encrypt(apiSecret.trim());

    const config = await CloudinaryConfig.findOneAndUpdate(
      { userId },
      {
        cloudName: encryptedCloudName,
        folderName: encryptedFolder,
        apiKey: encryptedKey,
        apiSecret: encryptedSecret,
      },
      { upsert: true, new: true, lean: true }
    );

    if (!config) {
      return res.status(500).json({ message: "Failed to save configuration" });
    }

    res.status(200).json({
      message: "Cloudinary configuration saved successfully",
      config: {
        cloudName: cloudName.trim(),
        folderName: folderName.trim(),
        apiKey: apiKey.trim(),
        apiSecret: apiSecret.trim(),
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
    let config = await CloudinaryConfig.findOne({ userId }).lean();

    if (!config) {
      return res.status(404).json({ message: "No Cloudinary configuration found" });
    }

    // Check if all required encrypted fields exist
    const requiredFields = ["cloudName", "folderName", "apiKey", "apiSecret"];
    const missingFields = requiredFields.filter(field => !config[field]);
    
    if (missingFields.length > 0) {
      // Delete invalid config and ask user to reconnect
      await CloudinaryConfig.deleteOne({ userId });
      console.log(`Deleted invalid Cloudinary config for user ${userId} (missing: ${missingFields.join(", ")})`);
      return res.status(404).json({ 
        message: "Cloudinary configuration is corrupted or incomplete. Please reconnect." 
      });
    }

    // Decrypt safely
    const cloudName = safeDecrypt(config.cloudName);
    const folderName = safeDecrypt(config.folderName);
    const apiKey = safeDecrypt(config.apiKey);
    const apiSecret = safeDecrypt(config.apiSecret);

    if (!cloudName || !folderName || !apiKey || !apiSecret) {
      // Decryption failed – delete invalid config
      await CloudinaryConfig.deleteOne({ userId });
      console.log(`Deleted Cloudinary config for user ${userId} due to decryption failure`);
      return res.status(404).json({ 
        message: "Cloudinary configuration is corrupted. Please reconnect." 
      });
    }

    res.json({
      cloudName,
      folderName,
      apiKey,
      apiSecret,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};