import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat';
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
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
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
      // Save user message first
      await this.saveMessage({
        hotelId: hotelContext.id,
        userId,
        content: userMessage,
        isAI: false,
      });

      // Fetch last 5 messages for context
      const chatHistory = await this.getChatHistory(hotelContext.id, userId);
      const recentMessages = chatHistory.messages.slice(-5);

      // System prompt for context
      const systemPrompt = `You are an AI hotel assistant for ${hotelContext?.name || 'this hotel'}.
Location: ${hotelContext?.location || 'N/A'}
Price Range: ${hotelContext?.priceRange || 'N/A'}
Amenities: ${Array.isArray(hotelContext?.amenities) ? hotelContext.amenities.join(', ') : (hotelContext?.amenities || 'N/A')}
Available Rooms: ${hotelContext?.availableRooms ?? 'N/A'}`;

      // Typed messages for OpenAI
      const messages: ChatCompletionMessageParam[] = [
        { role: "system" as const, content: systemPrompt },
        ...recentMessages.map(msg => ({
          role: msg.isAI ? "assistant" as const : "user" as const,
          content: msg.content
        })),
        { role: "user" as const, content: userMessage }
      ];

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
        }
      } catch (err) {
        console.error('Listing search error:', err);
      }

      // Call OpenAI
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages,
        temperature: 0.3,
        max_tokens: 150,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      const aiResponse = completion.choices[0].message?.content ?? "I apologize, but I couldn't generate a response.";

      // Save AI response
      await this.saveMessage({
        hotelId: hotelContext.id,
        userId,
        content: aiResponse,
        isAI: true,
      });

      // Return hotels if found
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
