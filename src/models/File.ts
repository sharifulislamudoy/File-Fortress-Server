import mongoose, { Document, Schema } from "mongoose";

export interface IFile extends Document {
  userId: mongoose.Types.ObjectId;
  folderId: mongoose.Types.ObjectId;
  originalName: string;
  encryptedUrl: string; // Encrypted Cloudinary URL
  mimeType: string;
  size: number;
  fileType: "image" | "video" | "document" | "other";
  publicId: string; // Cloudinary public ID for deletion
  createdAt: Date;
}

const FileSchema = new Schema<IFile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    folderId: {
      type: Schema.Types.ObjectId,
      ref: "Folder",
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    encryptedUrl: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    fileType: {
      type: String,
      enum: ["image", "video", "document", "other"],
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.File || mongoose.model<IFile>("File", FileSchema);