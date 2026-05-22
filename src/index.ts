import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db";

// Load Environment Variables
dotenv.config();

// Connect Database
connectDB();

const app: Application = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Root Route
app.get("/", (req: Request, res: Response) => {
  res.send("Server is running...");
});

// Port
const PORT = process.env.PORT || 5000;

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});