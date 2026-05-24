import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import authRoutes from "./routes/authRoutes";
import pinRoutes from "./routes/pinRoutes";
import cloudinaryRoutes from "./routes/cloudinaryRoutes";  // <-- ADD THIS

dotenv.config();
connectDB();

const app: Application = express();

app.use(cors({ origin: `${process.env.CLIENT_URL}`, credentials: true }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/pin", pinRoutes);
app.use("/api/cloudinary", cloudinaryRoutes);   // <-- ADD THIS

app.get("/", (req: Request, res: Response) => {
  res.send("Server is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});