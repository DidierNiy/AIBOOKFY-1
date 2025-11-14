import { getGeminiModel } from './aiService';
import dotenv from 'dotenv';
import ChatHistory, { IMessage } from '../models/chatHistory';
import Listing from '../models/Listing';
import { getSmartResponse } from './smartService';

dotenv.config();

// Message structure for saving into DB
interface MessageData {
  hotelId: string;
  userId: string;
  content: string;
  isAI: boolean;
}

class ChatService {
  private model: any;

  constructor() {
    // Initialize the model asynchronously. If it fails, generateResponse will retry.
    this.model = null;
    this.initModel();
  }

  private async initModel() {
    try {
      this.model = await getGeminiModel();
    } catch (err) {
      console.error('Failed to initialize Gemini model:', err);
      this.model = null;
    }
  }

  // Smart chat without a specific hotel
  async getSmartChatResponse(userMessage: string, userId: string): Promise<{ text: string; hotels?: any[] }> {
    try {
      const genericHotelId = 'smart-chat';

      // Save user message
      await this.saveMessage({
        hotelId: genericHotelId,
        userId,
        content: userMessage,
        isAI: false,
      });

      // Get AI response from smart engine
      const aiResponse = await getSmartResponse(userMessage);

      // Save AI response
      await this.saveMessage({
        hotelId: genericHotelId,
        userId,
        content: aiResponse.text, // Ensure content is always a string
        isAI: true,
      });

      // Return response for frontend
      return { text: aiResponse.text, hotels: aiResponse.hotels };
    } catch (error) {
      console.error('Error in getSmartChatResponse:', error);
      throw new Error('Failed to get smart chat response');
    }
  }

  // AI chat with hotel context
  async generateResponse(userMessage: string, hotelContext: any, userId: string): Promise<{ text: string; hotels?: any[] }> {
    try {
      // ensure model is initialized (retry init if necessary)
      if (!this.model) {
        try {
          this.model = await getGeminiModel();
        } catch (e) {
          console.error('Could not load AI model before generating response:', e);
          throw new Error('AI model unavailable');
        }
      }
      // Save user message first
      await this.saveMessage({
        hotelId: hotelContext.id,
        userId,
        content: userMessage,
        isAI: false,
      });

      // Fetch chat history for context
      const chatHistory = await this.getChatHistory(hotelContext.id, userId);
      
      // Prepare conversation history for Gemini
      const chat = this.model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: `You are a helpful assistant for the hotel with ID: ${hotelContext.id}. Provide helpful and accurate information.` }]
          },
          {
            role: 'model',
            parts: [{ text: 'I understand. I\'m here to help with any questions about this hotel.' }]
          },
          ...(chatHistory.messages || []).slice(-5).flatMap(msg => [
            {
              role: msg.isAI ? 'model' : 'user',
              parts: [{ text: msg.content }]
            }
          ])
        ],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        },
      });

      // Get AI response
      const result = await chat.sendMessage(userMessage);
      const response = await result.response;
      const aiResponse = response.text() || 'I am not sure how to respond to that.';

      // Save AI response
      await this.saveMessage({
        hotelId: hotelContext.id,
        userId,
        content: aiResponse,
        isAI: true,
      });

      // Optional: search database if user wants hotels
      let hotelsFound: any[] | undefined;
      try {
        const searchKeywords = /(find|search|show|available|near|nearby|in )\s+([\w\-\s]+)/i;
        const searchMatch = userMessage.match(searchKeywords);
        if (searchMatch) {
          const term = (searchMatch[2] || userMessage).trim();
          const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, ''), 'i');
          hotelsFound = await Listing.find({
            $or: [
              { name: regex },
              { location: regex },
              { description: regex }
            ]
          }).limit(6).lean();

          if (hotelsFound && hotelsFound.length > 0) {
            const placeholderImage = 'https://images.unsplash.com/photo-1559599238-0ea6229ab6a6?q=80&w=1200&auto=format&fit=crop';
            const hotels = hotelsFound.map(h => ({
              id: h._id,
              name: h.name,
              location: h.location,
              price: h.price,
              description: h.description,
              images: Array.isArray(h.images) && h.images.length > 0 ? h.images : [placeholderImage],
              rating: h.rating || 4.0,
              amenities: h.amenities || []
            }));
            return { text: aiResponse, hotels };
          }
        }
      } catch (err) {
        console.error('Listing search error:', err);
      }

      return { text: aiResponse };
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  // Save messages to chat history
  private async saveMessage(messageData: MessageData): Promise<void> {
    const { hotelId, userId, content, isAI } = messageData;

    try {
      let chatHistory = await ChatHistory.findOne({ hotelId, userId });
      if (!chatHistory) {
        chatHistory = new ChatHistory({ hotelId, userId, messages: [] });
      }

      chatHistory.messages.push({
        content,
        sender: isAI ? 'AI' : userId,
        timestamp: new Date(),
        isAI,
      });

      await chatHistory.save();
    } catch (error) {
      console.error('Error saving message:', error);
      throw new Error('Failed to save message to chat history');
    }
  }

  async getChatHistory(hotelId: string, userId: string) {
    try {
      let chatHistory = await ChatHistory.findOne({ hotelId, userId });
      if (!chatHistory) {
        chatHistory = new ChatHistory({ hotelId, userId, messages: [] });
      }
      return chatHistory;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw new Error('Failed to fetch chat history');
    }
  }

  async getHotelChatHistories(hotelId: string) {
    try {
      return await ChatHistory.find({ hotelId }).sort('-updatedAt');
    } catch (error) {
      console.error('Error fetching hotel chat histories:', error);
      throw new Error('Failed to fetch hotel chat histories');
    }
  }
}

export default new ChatService();
