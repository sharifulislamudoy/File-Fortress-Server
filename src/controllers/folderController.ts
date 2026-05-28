import { Request, Response } from "express";
import mongoose from "mongoose";
import Folder from "../models/Folder";

// Helper to generate slug from name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// Helper to get a unique slug by appending a number if needed
const getUniqueSlug = async (
  userId: mongoose.Types.ObjectId,
  baseSlug: string
): Promise<string> => {
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const existing = await Folder.findOne({ userId, slug });
    if (!existing) return slug;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

// @desc    Create a new folder (root only)
// @route   POST /api/folders
export const createFolder = async (req: Request, res: Response) => {
  try {
    const { name, purpose } = req.body;

    if (!name || !purpose) {
      return res.status(400).json({ message: "Name and purpose are required" });
    }

    const userId = new mongoose.Types.ObjectId(req.userId);
    const baseSlug = generateSlug(name);
    const slug = await getUniqueSlug(userId, baseSlug);

    const folder = await Folder.create({
      userId,
      name,
      purpose,
      slug,
    });

    res.status(201).json(folder);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Folder name already exists. Try a different name." });
    }
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get user's root folders (all folders)
// @route   GET /api/folders/root
export const getRootFolders = async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const folders = await Folder.find({ userId }).sort({ createdAt: -1 });
    res.json(folders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get folder by slug (and user)
// @route   GET /api/folders/slug/:slug
export const getFolderBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const userId = new mongoose.Types.ObjectId(req.userId);

    const folder = await Folder.findOne({ userId, slug });
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    res.json(folder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get folder contents (files only, no subfolders)
// @route   GET /api/folders/:folderId/contents
export const getFolderContents = async (req: Request, res: Response) => {
  try {
    const { folderId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.userId);

    const folder = await Folder.findOne({ _id: folderId, userId });
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    // Get files belonging to this folder
    const File = require("../models/File").default;
    const files = await File.find({ userId, folderId }).sort({ createdAt: -1 });

    // Decrypt file URLs for frontend display
    const { decrypt } = require("../utils/encryption");
    const decryptedFiles = files.map((file: any) => ({
      ...file.toObject(),
      url: decrypt(file.encryptedUrl),
    }));

    res.json({
      folder,
      subfolders: [], // no subfolders anymore
      files: decryptedFiles,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all user folders (for AI context)
// @route   GET /api/folders/all
export const getAllUserFolders = async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const folders = await Folder.find({ userId }).select("name purpose slug").lean();
    res.json(folders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};