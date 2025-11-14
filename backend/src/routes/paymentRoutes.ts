import express from 'express';
import { initiatePayment, handlePaymentCallback, verifyPaymentStatus } from '../controllers/paymentController';
import { authenticateUser } from '../middlewares/authMiddleware';

const router = express.Router();

// Protected routes - require authentication
router.use(authenticateUser);

// Initiate M-Pesa STK Push payment
router.post('/initiate', initiatePayment);

// Callback URL for M-Pesa (this shouldn't require authentication)
router.post('/callback', handlePaymentCallback);

// Verify payment status
router.get('/verify/:userId', verifyPaymentStatus);

export default router;