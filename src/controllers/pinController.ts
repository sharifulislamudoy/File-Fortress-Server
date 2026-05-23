import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import Pin from "../models/Pin";

// @desc    Set/Update user PIN
// @route   POST /api/pin/set
export const setPin = async (req: Request, res: Response) => {
  try {
    const { pin } = req.body;
    if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      return res.status(400).json({ message: "PIN must be 6 digits" });
    }

    const salt = await bcrypt.genSalt(10);
    const encryptedPin = await bcrypt.hash(pin, salt);

    // Cast to any to avoid TypeScript overload errors
    await (Pin as any).findOneAndUpdate(
      { userId: req.userId },
      { encryptedPin },
      { upsert: true, new: true }
    );

    res.json({ message: "PIN set successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Verify user PIN
// @route   POST /api/pin/verify
export const verifyPin = async (req: Request, res: Response) => {
  try {
    const { pin } = req.body;
    if (!pin || pin.length !== 6) {
      return res.status(400).json({ message: "Invalid PIN" });
    }

    const pinRecord = await (Pin as any).findOne({ userId: req.userId });
    if (!pinRecord) {
      return res.status(400).json({ message: "No PIN set. Please set a PIN first." });
    }

    const isMatch = await bcrypt.compare(pin, pinRecord.encryptedPin);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect PIN" });
    }

    res.json({ message: "PIN verified" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Check if user has a PIN
// @route   GET /api/pin/check
export const checkPin = async (req: Request, res: Response) => {
  try {
    const pinRecord = await (Pin as any).findOne({ userId: req.userId });
    res.json({ hasPin: !!pinRecord });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};