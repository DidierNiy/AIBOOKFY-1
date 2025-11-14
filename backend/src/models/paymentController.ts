import { Request, Response } from "express";
import User, { IUser } from "../models/user";  // 👈 import IUser type

export const choosePlan = async (req: Request, res: Response) => {
  const { userId, plan } = req.body;

  try {
    const user = (await User.findById(userId)) as IUser | null; // 👈 use type assertion
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role !== "hotelManager") {
      return res.status(400).json({ message: "Only hotel managers can choose a plan" });
    }

    user.plan = plan; // ✅ TypeScript now knows plan exists
    await user.save();

    res.json({ message: "Plan selected successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const confirmPayment = async (req: Request, res: Response) => {
  const { userId, paymentId } = req.body;

  try {
    const user = (await User.findById(userId)) as IUser | null; // 👈 type assertion
    if (!user) return res.status(404).json({ message: "User not found" });

    user.paymentStatus = "confirmed";
    user.paymentId = paymentId; // ✅ now TypeScript is fine
    await user.save();

    res.json({ message: "Payment confirmed, dashboard access granted", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
