import mongoose from "mongoose";

export interface IPin extends mongoose.Document {
  userId: mongoose.Schema.Types.ObjectId;
  encryptedPin: string;
}

const PinSchema = new mongoose.Schema<IPin>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    encryptedPin: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IPin>("Pin", PinSchema);