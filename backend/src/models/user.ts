import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  role: "traveler" | "hotelManager";
  paymentStatus?: "pending" | "confirmed";
  plan?: string;
  paymentId?: string;
  isVerified?: boolean;
  verificationCode?: string;
  verificationExpires?: Date;
  resetToken?: string;
  resetExpires?: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["traveler", "hotelManager"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "confirmed"],
      default: "pending",
    },
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
    verificationExpires: { type: Date },
    resetToken: { type: String },
    resetExpires: { type: Date },
    plan: { type: String },
    paymentId: { type: String },
  },
  { timestamps: true }
);

const User = mongoose.model<IUser>("User", userSchema);
export default User;
