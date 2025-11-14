import express, { Request } from 'express';
import chatService from '../services/chatService';
import { getSmartResponse } from '../services/smartService';
import { authenticateUser } from '../middlewares/authMiddleware';
import Interaction from '../models/Interaction';

// Extend Request type to include user
interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

const router = express.Router();

// Protected routes - require authentication
// NOTE: smart-chat route does NOT require authentication for demo purposes
router.get('/:hotelId/history', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const { hotelId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const chatHistory = await chatService.getChatHistory(hotelId, userId);
    res.json(chatHistory);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Failed to fetch chat history' });
  }
});

// Get all chat histories for a hotel (for hotel dashboard)
router.get('/:hotelId/all-histories', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const { hotelId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Verify that the user is the hotel owner/staff
    if (userRole !== 'hotel_owner' && userRole !== 'hotel_staff') {
      return res.status(403).json({ message: 'Unauthorized to access hotel chat histories' });
    }

    const chatHistories = await chatService.getHotelChatHistories(hotelId);
    res.json(chatHistories);
  } catch (error) {
    console.error('Error fetching hotel chat histories:', error);
    res.status(500).json({ message: 'Failed to fetch hotel chat histories' });
  }
});

// Generate AI response (without websocket)
router.post('/generate-response', authenticateUser, async (req: AuthRequest, res) => {
  const { message, hotelContext } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    const response = await chatService.generateResponse(message, hotelContext, userId);
    res.json(response);
  } catch (error) {
    console.error('Error generating response:', error);
    res.status(500).json({ message: 'Failed to generate AI response' });
  }
});

// Log an interaction (clicks, views, bookings) for training/personalization
router.post('/interactions', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'User not authenticated' });

    const { hotelId, action, metadata } = req.body;

    const interaction = new Interaction({
      userId,
      hotelId,
      action,
      metadata,
    });

    await interaction.save();

    // (Optional) trigger async process to update user preferences / retrain models

    res.json({ message: 'Interaction logged' });
  } catch (error) {
    console.error('Error logging interaction:', error);
    res.status(500).json({ message: 'Failed to log interaction' });
  }
});

// New route for smart chat using Gemini (NO AUTH REQUIRED for demo)
router.post('/smart-chat', async (req: AuthRequest, res) => {
  const { message } = req.body;
  const userId = req.user?.id || 'guest-user';

  console.log('=== SMART CHAT REQUEST ===');
  console.log('User ID:', userId);
  console.log('Message:', message);

  if (!message) {
    console.log('❌ No message - returning 400');
    return res.status(400).json({ message: 'Message is required' });
  }

  try {
    console.log(`✅ Processing smart-chat request for user ${userId}: "${message}"`);
    
    const result = await getSmartResponse(message, userId);
    console.log('✅ getSmartResponse returned:', { 
      hasText: !!result.text, 
      textLength: result.text?.length || 0,
      hotelsCount: result.hotels?.length || 0 
    });
    
    const { text, hotels } = result;
    
    if (!text) {
      console.log('❌ No text in response');
      throw new Error('No response generated');
    }
    
    console.log(`✅ Sending response: ${text.substring(0, 50)}..., hotels: ${hotels.length}`);
    
    // Return consistent format: { response: string, hotels: array }
    const responseData = { 
      response: text, 
      hotels: hotels || [] 
    };
    
    console.log('✅ Final response object:', { 
      hasResponse: !!responseData.response,
      hotelsCount: responseData.hotels.length 
    });
    
    return res.json(responseData);
    
  } catch (err: any) {
    console.error('❌ ERROR in smart-chat route:', err);
    console.error('Error stack:', err?.stack);
    
    // Safely extract error message
    let errorDetail: string | null = null;
    if (process.env.NODE_ENV === 'development') {
      if (err instanceof Error) {
        errorDetail = err.message;
      } else {
        try {
          errorDetail = JSON.stringify(err);
        } catch {
          errorDetail = String(err);
        }
      }
    }
    
    console.log('❌ Sending error response:', { message: 'Error', error: errorDetail });
    
    // Send user-friendly error with development details
    return res.status(500).json({ 
      message: "I apologize, but I'm having trouble processing your request right now. Could you please try again?",
      error: errorDetail
    });
  }
});

export default router;
    