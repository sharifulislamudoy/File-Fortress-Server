import mongoose, { Document, Schema } from "mongoose";

export interface ICloudinaryConfig extends Document {
  userId: mongoose.Types.ObjectId;
  folderName: string;
  unsignedUploadPreset: string;
  createdAt: Date;
  updatedAt: Date;
}

const CloudinaryConfigSchema = new Schema<ICloudinaryConfig>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    folderName: {
      type: String,
      required: true,
      trim: true,
    },
    unsignedUploadPreset: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// Ensure the model is not re-compiled in development (Next.js hot reload)
export default mongoose.models.CloudinaryConfig ||
  mongoose.model<ICloudinaryConfig>("CloudinaryConfig", CloudinaryConfigSchema);