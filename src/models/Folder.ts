import mongoose, { Document, Schema } from "mongoose";

export interface IFolder extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  purpose: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

const FolderSchema = new Schema<IFolder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    purpose: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
  },
  { timestamps: true }
);

// Ensure unique slug per user (no parentId)
FolderSchema.index({ userId: 1, slug: 1 }, { unique: true });

export default mongoose.models.Folder || mongoose.model<IFolder>("Folder", FolderSchema);