import { Request, Response } from 'express';
import { MpesaService } from '../services/mpesaService';
import User from '../models/user';

const mpesaService = new MpesaService();

export const initiatePayment = async (req: Request, res: Response) => {
  const { phoneNumber, amount, userId, plan } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Callback URL should be your production URL in real deployment
    const callbackUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/callback`;
    
    const result = await mpesaService.initiateSTKPush(
      phoneNumber,
      amount,
      callbackUrl
    );

    // Save payment details to user
    user.paymentStatus = 'pending';
    user.plan = plan;
    await user.save();

    res.json({
      message: 'Payment initiated',
      data: result
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ message: 'Failed to initiate payment' });
  }
};

export const handlePaymentCallback = async (req: Request, res: Response) => {
  try {
    const result = await mpesaService.handleCallback(req.body);
    
    if (result.success) {
      // Here you would typically update the user's payment status
      // You'll need to add logic to identify the user from the transaction
      
      res.json({ message: 'Payment processed successfully' });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    console.error('Payment callback error:', error);
    res.status(500).json({ message: 'Failed to process payment callback' });
  }
};

// Verify payment status - this can be called by frontend to check if payment is complete
export const verifyPaymentStatus = async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      paymentStatus: user.paymentStatus,
      plan: user.plan
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify payment status' });
  }
};