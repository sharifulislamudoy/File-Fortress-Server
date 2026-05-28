import { Request, Response } from "express";
import mongoose from "mongoose";
import Folder from "../models/Folder";
import File from "../models/File";
import Note from "../models/Note";
import { decrypt } from "../utils/encryption";

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
  baseSlug: string,
  excludeFolderId?: string
): Promise<string> => {
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const query: any = { userId, slug };
    if (excludeFolderId) {
      query._id = { $ne: excludeFolderId };
    }
    const existing = await Folder.findOne(query);
    if (!existing) return slug;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

// @desc    Create a new folder
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

// @desc    Update a folder
// @route   PUT /api/folders/:folderId
export const updateFolder = async (req: Request, res: Response) => {
  try {
    const folderId = req.params.folderId as string;
    const { name, purpose } = req.body;
    const userId = new mongoose.Types.ObjectId(req.userId);

    const folder = await Folder.findOne({ _id: folderId, userId });
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    let updateData: any = {};
    if (name !== undefined && name.trim()) {
      updateData.name = name.trim();
      const baseSlug = generateSlug(name.trim());
      updateData.slug = await getUniqueSlug(userId, baseSlug, folderId);
    }
    if (purpose !== undefined && purpose.trim()) {
      updateData.purpose = purpose.trim();
    }

    const updatedFolder = await Folder.findByIdAndUpdate(folderId, updateData, { new: true });
    res.json(updatedFolder);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Folder name already exists. Try a different name." });
    }
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete a folder (cascade delete files & notes)
// @route   DELETE /api/folders/:folderId
export const deleteFolder = async (req: Request, res: Response) => {
  try {
    const folderId = req.params.folderId as string;
    const userId = new mongoose.Types.ObjectId(req.userId);

    const folder = await Folder.findOne({ _id: folderId, userId });
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    // Delete all files in this folder
    await File.deleteMany({ folderId, userId });

    // Delete all notes in this folder
    await Note.deleteMany({ folderId, userId });

    // Delete the folder itself
    await folder.deleteOne();

    res.json({ message: "Folder and all its contents deleted successfully" });
  } catch (error) {
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

// @desc    Get folder by slug
// @route   GET /api/folders/slug/:slug
export const getFolderBySlug = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;
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

// @desc    Get folder contents (files and notes)
// @route   GET /api/folders/:folderId/contents
export const getFolderContents = async (req: Request, res: Response) => {
  try {
    const folderId = req.params.folderId as string;
    const userId = new mongoose.Types.ObjectId(req.userId);

    const folder = await Folder.findOne({ _id: folderId, userId });
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    const files = await File.find({ userId, folderId }).sort({ createdAt: -1 });
    const notes = await Note.find({ userId, folderId }).sort({ createdAt: -1 });

    const decryptedFiles = files.map((file: any) => ({
      ...file.toObject(),
      url: decrypt(file.encryptedUrl),
    }));

    const decryptedNotes = notes.map((note: any) => ({
      _id: note._id,
      folderId: note.folderId,
      title: decrypt(note.title),
      type: note.type,
      content: decrypt(note.content),
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    }));

    res.json({
      folder,
      files: decryptedFiles,
      notes: decryptedNotes,
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