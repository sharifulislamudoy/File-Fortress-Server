import mongoose, { Document, Schema } from "mongoose";

export interface INote extends Document {
  userId: mongoose.Types.ObjectId;
  folderId: mongoose.Types.ObjectId;
  title: string;        // encrypted
  type: "link" | "text";
  content: string;      // encrypted (URL or plain text)
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
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
    title: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["link", "text"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Note || mongoose.model<INote>("Note", NoteSchema);