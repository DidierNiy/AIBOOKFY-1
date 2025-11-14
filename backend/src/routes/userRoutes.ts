import express from "express";
import { registerUser, loginUser, getAllUsers, verifyCode, requestPasswordReset, resetPassword, resendVerification } from "../controllers/userController";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/all", getAllUsers); // temporary route for debugging
router.post("/verify", verifyCode);
router.post("/request-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.post("/resend-verification", resendVerification);

export default router;
