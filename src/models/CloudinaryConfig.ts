import mongoose, { Document, Schema } from "mongoose";

export interface ICloudinaryConfig extends Document {
  userId: mongoose.Types.ObjectId;
  cloudName: string;    // encrypted
  folderName: string;   // encrypted
  apiKey: string;       // encrypted
  apiSecret: string;    // encrypted
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
    cloudName: {
      type: String,
      required: true,
      trim: true,
    },
    folderName: {
      type: String,
      required: true,
      trim: true,
    },
    apiKey: {
      type: String,
      required: true,
      trim: true,
    },
    apiSecret: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.CloudinaryConfig ||
  mongoose.model<ICloudinaryConfig>("CloudinaryConfig", CloudinaryConfigSchema);