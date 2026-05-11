import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://bldb:best1996@cluster0.asqshgs.mongodb.net/bldb?appName=Cluster0";

const TEST_EMAIL = "hotel@aibookify.com";
const TEST_PASSWORD = "Hotel@1234";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["traveler", "hotelManager"], required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "confirmed"],
      default: "pending",
    },
    isVerified: { type: Boolean, default: false },
    verificationCode: String,
    verificationExpires: Date,
    plan: String,
    paymentId: String,
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const hashed = await bcrypt.hash(TEST_PASSWORD, 10);

  const result = await User.findOneAndUpdate(
    { email: TEST_EMAIL },
    {
      email: TEST_EMAIL,
      password: hashed,
      role: "hotelManager",
      isVerified: true,
      paymentStatus: "confirmed",
      plan: "pro",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`Test hotel user ready: ${result.email} (id: ${result._id})`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
