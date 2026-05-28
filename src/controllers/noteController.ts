import { Request, Response } from "express";
import mongoose from "mongoose";
import Note from "../models/Note";
import Folder from "../models/Folder";
import { encrypt, decrypt } from "../utils/encryption";

// @desc    Create a new note
// @route   POST /api/notes
export const createNote = async (req: Request, res: Response) => {
  try {
    const { folderId, title, type, content } = req.body;

    if (!folderId || !title || !type || !content) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (type !== "link" && type !== "text") {
      return res.status(400).json({ message: "Type must be 'link' or 'text'" });
    }

    const userId = new mongoose.Types.ObjectId(req.userId);

    // Verify folder belongs to user
    const folder = await Folder.findOne({ _id: folderId, userId });
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    // Encrypt title and content
    const encryptedTitle = encrypt(title.trim());
    const encryptedContent = encrypt(content.trim());

    const note = await Note.create({
      userId,
      folderId,
      title: encryptedTitle,
      type,
      content: encryptedContent,
    });

    // Return decrypted version for immediate display
    res.status(201).json({
      _id: note._id,
      folderId: note.folderId,
      title: title.trim(),
      type,
      content: content.trim(),
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all notes for a folder
// @route   GET /api/notes/folder/:folderId
export const getFolderNotes = async (req: Request, res: Response) => {
  try {
    const { folderId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.userId);

    const folder = await Folder.findOne({ _id: folderId, userId });
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    const notes = await Note.find({ folderId, userId }).sort({ createdAt: -1 });

    // Decrypt each note
    const decryptedNotes = notes.map((note) => ({
      _id: note._id,
      folderId: note.folderId,
      title: decrypt(note.title),
      type: note.type,
      content: decrypt(note.content),
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    }));

    res.json(decryptedNotes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete a note
// @route   DELETE /api/notes/:noteId
export const deleteNote = async (req: Request, res: Response) => {
  try {
    const { noteId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.userId);

    const note = await Note.findOne({ _id: noteId, userId });
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    await note.deleteOne();
    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};