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
      this.model = await getGeminiModel({ mode: 'chat' });
    } catch (err) {
      console.error('Failed to initialize Gemini model:', err);
      this.model = null;
    }
  }

  // Smart chat without a specific hotel
  async getSmartChatResponse(userMessage: string, userId: string, sessionId?: string): Promise<{ text: string; hotels?: any[]; sessionId: string }> {
    try {
      let currentSessionId: string;
      
      // If no session ID provided, create a new session
      if (!sessionId) {
        const newSession = await this.createChatSession(userId, userMessage);
        currentSessionId = newSession._id.toString();
      } else {
        currentSessionId = sessionId;
      }

      // Save user message
      await this.saveMessage({
        hotelId: currentSessionId,
        userId,
        content: userMessage,
        isAI: false,
      });

      // Get AI response from smart engine
      const aiResponse = await getSmartResponse(userMessage);

      // Save AI response
      await this.saveMessage({
        hotelId: currentSessionId,
        userId,
        content: aiResponse.text, // Ensure content is always a string
        isAI: true,
      });

      // Update session with latest message
      await this.updateSessionLastMessage(currentSessionId, aiResponse.text);

      // Return response for frontend
      return { text: aiResponse.text, hotels: aiResponse.hotels, sessionId: currentSessionId };
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
          this.model = await getGeminiModel({ mode: 'chat' });
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
            const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'%3E%3Crect width='1200' height='800' fill='%234A5568'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial, sans-serif' font-size='48' fill='%23FFFFFF' text-anchor='middle' dominant-baseline='middle'%3EHotel Image%3C/text%3E%3C/svg%3E";
            const hotels = hotelsFound.map(h => {
              // Ensure images is always a valid array with at least the placeholder
              let images = [placeholderImage];
              if (Array.isArray(h.images) && h.images.length > 0) {
                const validImages = h.images.filter((img: string) => img && typeof img === 'string' && img.trim().length > 0);
                if (validImages.length > 0) {
                  images = validImages;
                }
              }

              return {
                id: h._id,
                name: h.name,
                location: h.location,
                price: h.price,
                description: h.description,
                images: images,
                rating: h.rating || 4.0,
                amenities: h.amenities || []
              };
            });
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

  // Create a new chat session
  async createChatSession(userId: string, firstMessage: string): Promise<any> {
    try {
      const sessionTitle = this.generateSessionTitle(firstMessage);
      const sessionId = new Date().getTime().toString();
      
      const chatHistory = new ChatHistory({
        hotelId: sessionId, // Using sessionId as hotelId for smart chat sessions
        userId,
        messages: [],
        sessionTitle,
        lastMessage: '',
      });
      
      return await chatHistory.save();
    } catch (error) {
      console.error('Error creating chat session:', error);
      throw new Error('Failed to create chat session');
    }
  }

  // Get all chat sessions for a user
  async getChatSessions(userId: string) {
    try {
      const sessions = await ChatHistory.find(
        { userId },
        { _id: 1, sessionTitle: 1, lastMessage: 1, updatedAt: 1, messages: 1 }
      ).sort('-updatedAt').limit(20);

      return sessions.map(session => ({
        id: session._id,
        title: session.sessionTitle || 'New Chat',
        lastMessage: session.lastMessage || 'No messages yet',
        updatedAt: session.updatedAt,
        messageCount: session.messages.length
      }));
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
      throw new Error('Failed to fetch chat sessions');
    }
  }

  // Load a specific chat session
  async loadChatSession(sessionId: string, userId: string) {
    try {
      const session = await ChatHistory.findOne({ 
        _id: sessionId, 
        userId 
      });
      
      if (!session) {
        return null;
      }

      return {
        id: session._id,
        title: session.sessionTitle,
        messages: session.messages.map(msg => ({
          id: msg.timestamp.getTime().toString(),
          sender: msg.isAI ? 'ai' : 'user',
          text: msg.content,
          timestamp: msg.timestamp,
        })),
        updatedAt: session.updatedAt,
      };
    } catch (error) {
      console.error('Error loading chat session:', error);
      throw new Error('Failed to load chat session');
    }
  }

  // Update session's last message
  async updateSessionLastMessage(sessionId: string, lastMessage: string) {
    try {
      await ChatHistory.findByIdAndUpdate(sessionId, {
        lastMessage: lastMessage.substring(0, 100) // Limit to 100 chars
      });
    } catch (error) {
      console.error('Error updating session last message:', error);
    }
  }

  // Generate session title from first message
  private generateSessionTitle(message: string): string {
    // Simple title generation - take first few words
    const words = message.split(' ').slice(0, 4).join(' ');
    return words.length > 30 ? words.substring(0, 30) + '...' : words;
  }

  // Delete a chat session
  async deleteChatSession(sessionId: string, userId: string): Promise<boolean> {
    try {
      const result = await ChatHistory.findOneAndDelete({ 
        _id: sessionId, 
        userId 
      });
      return result !== null;
    } catch (error) {
      console.error('Error deleting chat session:', error);
      throw new Error('Failed to delete chat session');
    }
  }
}

export default new ChatService();