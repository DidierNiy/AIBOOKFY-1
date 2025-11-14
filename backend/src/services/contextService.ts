// Context Service - Maintains conversation memory and user preferences
import { getGeminiModel } from './aiService';

interface ConversationContext {
  userId: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>;
  preferences: {
    budget?: string;
    travelStyle?: string;
    previousSearches?: string[];
    favoriteAmenities?: string[];
  };
  lastEmotion?: string;
  lastIntent?: string;
  lastPurpose?: string;
  lastUpdated: Date;
}

// In-memory storage (replace with Redis/Database for production)
const conversationContexts = new Map<string, ConversationContext>();

export class ContextService {
  // Save user message to context
  static saveUserMessage(userId: string, message: string): void {
    const context: ConversationContext = conversationContexts.get(userId) || {
      userId,
      messages: [],
      preferences: {},
      lastEmotion: undefined,
      lastIntent: undefined,
      lastPurpose: undefined,
      lastUpdated: new Date(),
    };

    context.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
    });

    // Keep only last 10 messages
    if (context.messages.length > 10) {
      context.messages = context.messages.slice(-10);
    }

    context.lastUpdated = new Date();
    conversationContexts.set(userId, context);
  }

  // Save AI response to context
  static saveAIMessage(userId: string, message: string): void {
    const context = conversationContexts.get(userId);
    if (!context) return;

    context.messages.push({
      role: 'assistant',
      content: message,
      timestamp: new Date(),
    });

    context.lastUpdated = new Date();
    conversationContexts.set(userId, context);
  }

  // Get conversation history
  static getConversationHistory(userId: string): string {
    const context = conversationContexts.get(userId);
    if (!context || context.messages.length === 0) {
      return '';
    }

    const recent = context.messages.slice(-4); // Last 4 messages
    return recent
      .map(msg => `${msg.role === 'user' ? 'Traveler' : 'You'}: ${msg.content}`)
      .join('\n');
  }

  // Extract and update user preferences using AI
  static async updatePreferences(userId: string, query: string): Promise<void> {
    const context = conversationContexts.get(userId);
    if (!context) return;

    try {
      const model = getGeminiModel();
      const prompt = `Analyze this new user message and update structured preference & state memory.
MESSAGE: "${query}"
CURRENT_MEMORY: ${JSON.stringify({ preferences: context.preferences, lastEmotion: context.lastEmotion, lastIntent: context.lastIntent, lastPurpose: context.lastPurpose })}

Return strict JSON:
{
  "preferences": {
    "budget": "luxury|mid-range|budget|unknown",
    "travelStyle": "business|leisure|family|romantic|adventure|unknown",
    "favoriteAmenities": ["amenity1", "amenity2"]
  },
  "emotion": "excited|stressed|curious|neutral|hopeful|uncertain|unknown",
  "intent": "search_hotels|get_hotel_details|book_hotel|greeting|provide_details|unknown",
  "travelPurpose": "business|leisure|honeymoon|family|solo|adventure|wellness|unknown"
}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = await response.text();
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

      try {
        const parsed = JSON.parse(cleanedText);
        if (parsed.preferences) {
          context.preferences = { ...context.preferences, ...parsed.preferences };
        }
        if (parsed.emotion) context.lastEmotion = parsed.emotion;
        if (parsed.intent) context.lastIntent = parsed.intent;
        if (parsed.travelPurpose) context.lastPurpose = parsed.travelPurpose;
        conversationContexts.set(userId, context);
      } catch (e) {
        console.log('Could not extract preferences');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  }

  // Get user preferences
  static getUserPreferences(userId: string): string {
    const context = conversationContexts.get(userId);
    if (!context || Object.keys(context.preferences).length === 0) {
      return '';
    }

    return `User Preferences: ${JSON.stringify(context.preferences, null, 2)} | Emotion: ${context.lastEmotion || 'unknown'} | Intent: ${context.lastIntent || 'unknown'} | Purpose: ${context.lastPurpose || 'unknown'}`;
  }

  static getState(userId: string) {
    const ctx = conversationContexts.get(userId);
    if (!ctx) return {} as Record<string, string | undefined>;
    return {
      lastEmotion: ctx.lastEmotion,
      lastIntent: ctx.lastIntent,
      lastPurpose: ctx.lastPurpose,
    };
  }

  // Clear old contexts (cleanup)
  static cleanupOldContexts(): void {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [userId, ctx] of conversationContexts.entries()) {
      if (now.getTime() - ctx.lastUpdated.getTime() > maxAge) {
        conversationContexts.delete(userId);
      }
    }
  }
}

// Run cleanup every hour
setInterval(() => ContextService.cleanupOldContexts(), 60 * 60 * 1000);
