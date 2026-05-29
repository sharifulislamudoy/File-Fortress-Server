import { Request, Response } from "express";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import File from "../models/File";
import Folder from "../models/Folder";
import CloudinaryConfig from "../models/CloudinaryConfig";
import { encrypt, decrypt } from "../utils/encryption";

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Helper to determine file type - enhanced for all common types
const getFileType = (mimeType: string): "image" | "video" | "document" | "other" => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (
    mimeType.includes("pdf") ||
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    mimeType.includes("text") ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("sheet") ||
    mimeType.includes("presentation") ||
    mimeType.includes("zip") ||
    mimeType.includes("compressed") ||
    mimeType.includes("rar") ||
    mimeType.includes("7z") ||
    mimeType === "application/msword" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/vnd.ms-excel" ||
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-powerpoint" ||
    mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) return "document";
  return "other";
};

// @desc    Upload file to Cloudinary and save to DB
// @route   POST /api/files/upload
export const uploadFile = async (req: Request, res: Response) => {
  try {
    const { folderId } = req.body;
    if (!folderId) {
      return res.status(400).json({ message: "Folder ID is required" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const userId = new mongoose.Types.ObjectId(req.userId);

    // Verify folder belongs to user
    const folder = await Folder.findOne({ _id: folderId, userId });
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    // Get user's Cloudinary config
    const cloudConfig = await CloudinaryConfig.findOne({ userId });
    if (!cloudConfig) {
      return res.status(400).json({ message: "Please connect Cloudinary first" });
    }

    const { decrypt: decryptField } = require("../utils/encryption");
    const cloudName = decryptField(cloudConfig.cloudName);
    const apiKey = decryptField(cloudConfig.apiKey);
    const apiSecret = decryptField(cloudConfig.apiSecret);

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    // Determine resource_type: "raw" for documents/others, "image"/"video" accordingly
    const fileBuffer = req.file.buffer;
    const originalName = req.file.originalname;
    const mimeType = req.file.mimetype;
    const fileType = getFileType(mimeType);
    let resourceType: "image" | "video" | "raw" = "raw";
    if (fileType === "image") resourceType = "image";
    else if (fileType === "video") resourceType = "video";

    // Enforce a maximum of 40 images per folder (uploads are one-at-a-time)
    if (fileType === "image") {
      const existingImages = await File.countDocuments({ folderId, userId, fileType: "image" });
      if (existingImages >= 40) {
        return res.status(400).json({ message: "Image limit reached: a folder can contain up to 40 images" });
      }
    }

    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder: cloudConfig.folderName,
          public_id: `${Date.now()}-${originalName.split(".")[0]}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(fileBuffer);
    });

    // Encrypt the Cloudinary URL
    const encryptedUrl = encrypt(uploadResult.secure_url);

    // Save file record
    const file = await File.create({
      userId,
      folderId,
      originalName,
      encryptedUrl,
      mimeType,
      size: req.file.size,
      fileType,
      publicId: uploadResult.public_id,
    });

    // Return decrypted URL for immediate display
    res.status(201).json({
      ...file.toObject(),
      url: uploadResult.secure_url,
    });
  } catch (error: any) {
    console.error("Upload error:", error.message);
    res.status(500).json({ message: error.message || "Server error during upload" });
  }
};

// @desc    Delete file
// @route   DELETE /api/files/:fileId
export const deleteFile = async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.userId);

    const file = await File.findOne({ _id: fileId, userId });
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // Get Cloudinary config to delete from cloud
    const cloudConfig = await CloudinaryConfig.findOne({ userId });
    if (cloudConfig) {
      const { decrypt: decryptField } = require("../utils/encryption");
      const cloudName = decryptField(cloudConfig.cloudName);
      const apiKey = decryptField(cloudConfig.apiKey);
      const apiSecret = decryptField(cloudConfig.apiSecret);

      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });

      await cloudinary.uploader.destroy(file.publicId, { resource_type: "raw" });
    }

    await file.deleteOne();
    res.json({ message: "File deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Multer middleware for single file upload
export const uploadMiddleware = upload.single("file");