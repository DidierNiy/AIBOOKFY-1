import { Request, Response } from "express";
import User from "../models/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const JWT_SECRET = process.env.JWT_SECRET || "secretkey";

// Helper to send email (uses nodemailer if SMTP config provided, otherwise logs)
const sendEmail = async (to: string, subject: string, text: string) => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && port && user && pass) {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || user,
      to,
      subject,
      text,
    });
  } else {
    // Fallback for development: log the message
    console.log(`Email to: ${to}\nSubject: ${subject}\n${text}`);
  }
};

export const registerUser = async (req: Request, res: Response) => {
  console.log('Register Request Body:', req.body); // Debug log
  const { email, password, role } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
  const emailNorm = String(email).trim().toLowerCase();

  try {
    const userExists = await User.findOne({ email: emailNorm });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // create user as unverified (for hotel managers)
    const user = await User.create({
      email: emailNorm,
      password: hashedPassword,
      role,
      isVerified: role === 'hotelManager' ? false : true,
    });

    // If hotel manager, generate verification code and send email
    if (role === 'hotelManager') {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes
      user.verificationCode = code;
      user.verificationExpires = expires;
      await user.save();

      // send code via email (or log)
      await sendEmail(
        emailNorm,
        'Your verification code',
        `Your verification code is: ${code}. It expires in 15 minutes.`
      );
    }

    res.status(201).json({
      message: "User registered successfully",
      user: { id: user._id, email: user.email, role: user.role, isVerified: user.isVerified },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  console.log('Login Request Body:', req.body); // Debug log
  const { email, password, role } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
  const emailNorm = String(email).trim().toLowerCase();

  try {
  console.log('Looking up user by email:', emailNorm);
  const user = await User.findOne({ email: emailNorm });
  console.log('Found user:', user ? { email: user.email, role: user.role, isVerified: user.isVerified } : null); // Debug log
  if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Check if the user's role matches the requested role
    const requestedRole = role === 'hotel' ? 'hotelManager' : 'traveler';
    if (user.role !== requestedRole) {
      return res.status(400).json({ 
        message: `This account is registered as a ${user.role}. Please login with the correct account type.`
      });
    }

    // If hotel manager require verification
    if (user.role === 'hotelManager' && !user.isVerified) {
      return res.status(400).json({ message: 'Account not verified. Please verify your email before logging in.' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: { id: user._id, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Temporary route for debugging
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({}, { password: 0 }); // Exclude passwords from the response
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Verify code endpoint
export const verifyCode = async (req: Request, res: Response) => {
  const { email, code } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.verificationCode || !user.verificationExpires) {
      return res.status(400).json({ message: 'No verification code found. Request a new one.' });
    }

    if (new Date() > new Date(user.verificationExpires)) {
      return res.status(400).json({ message: 'Verification code expired. Please request a new one.' });
    }

    if (code !== user.verificationCode) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationExpires = undefined;
    await user.save();

    res.json({ message: 'Account verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Request password reset (sends token)
export const requestPasswordReset = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ message: 'If an account exists, a reset link has been sent.' });

    const token = Math.random().toString(36).slice(2, 12);
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    user.resetToken = token;
    user.resetExpires = expires;
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    await sendEmail(email, 'Password reset', `Reset your password using this link: ${resetLink}`);

    // Don't reveal whether user exists
    res.json({ message: 'If an account exists, a reset link has been sent.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Reset password using token
export const resetPassword = async (req: Request, res: Response) => {
  const { email, token, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !user.resetToken || !user.resetExpires) return res.status(400).json({ message: 'Invalid or expired token' });

    if (user.resetToken !== token) return res.status(400).json({ message: 'Invalid token' });
    if (new Date() > new Date(user.resetExpires)) return res.status(400).json({ message: 'Token expired' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Resend verification code
export const resendVerification = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'User already verified' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 1000 * 60 * 15);
    user.verificationCode = code;
    user.verificationExpires = expires;
    await user.save();

    await sendEmail(email, 'Your verification code', `Your verification code is: ${code}. It expires in 15 minutes.`);

    res.json({ message: 'Verification code resent' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
