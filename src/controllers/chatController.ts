import { Request, Response } from "express";
import mongoose from "mongoose";
import Folder from "../models/Folder";
import File from "../models/File";

const GROQ_API_KEY = process.env.GROQ_API_KEY as string;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export const askAssistant = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const userId = new mongoose.Types.ObjectId(req.userId);

    // Fetch user's folders
    const folders = await Folder.find({ userId }).select("name purpose slug").lean();

    // Fetch user's files with metadata
    const files = await File.find({ userId })
      .select("originalName fileType size createdAt folderId")
      .populate("folderId", "name")
      .lean();

    const folderList = folders.map(f => `- ${f.name} (slug: ${f.slug}, purpose: ${f.purpose})`).join("\n");
    const fileList = files.map(f => {
      const folderName = (f.folderId as any)?.name || "Unknown folder";
      const uploadDate = new Date(f.createdAt).toLocaleDateString();
      const sizeMB = (f.size / (1024 * 1024)).toFixed(2);
      return `- ${f.originalName} (${f.fileType}, ${sizeMB} MB, uploaded ${uploadDate}, in folder "${folderName}")`;
    }).join("\n");

    const systemPrompt = `You are a helpful assistant for FileFortress. 
The user has these folders:
${folderList || "No folders yet."}

Their files:
${fileList || "No files uploaded yet."}

When the user asks for a folder, respond with a clickable HTML link:
<a href="/folder/SLUG" class="text-emerald-400 underline">Folder Name</a>
Replace SLUG with the actual slug and Folder Name with the folder's name.

Answer questions about files using the metadata above. Never mention other users' data. Keep responses short.`;

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.5,
        max_tokens: 500,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content;
      if (reply) return res.json({ reply });
    }

    // Fallback matching
    const lowerMsg = message.toLowerCase();
    let matchedFolder = folders.find(f => 
      lowerMsg.includes(f.name.toLowerCase()) || 
      (f.purpose && lowerMsg.includes(f.purpose.toLowerCase()))
    );

    if (matchedFolder) {
      return res.json({
        reply: `I found your folder "${matchedFolder.name}". <a href="/folder/${matchedFolder.slug}" class="text-emerald-400 underline">Click here to open it</a>`
      });
    } else if (files.length) {
      const sample = files.slice(0, 3).map(f => f.originalName).join(", ");
      return res.json({
        reply: `Could not find a match. You have ${files.length} file(s), e.g. ${sample}. Ask "show me PDF files" or list my folders.`
      });
    } else if (folders.length) {
      const links = folders.map(f => `<a href="/folder/${f.slug}" class="text-emerald-400 underline">${f.name}</a>`).join(", ");
      return res.json({ reply: `Your folders: ${links}.` });
    } else {
      return res.json({ reply: "No folders yet. Create one on the home page." });
    }
  } catch (error) {
    console.error(error);
    res.json({ reply: "Sorry, I'm having trouble. Please try again." });
  }
};