import { getGeminiModel } from './aiService';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ContextService } from './contextService';
import { findHotels as findHotelsFromGeoapify } from './geoapifyService';

// Utility: robustly extract a JSON object string from a model response
function extractJsonString(input: string): string | null {
  if (!input) return null;
  // Remove code fences and zero-width / BOM characters
  let s = input
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();
  // Normalize smart quotes
  s = s.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
  // Try to locate the first top-level JSON object by balancing braces
  const firstBrace = s.indexOf('{');
  if (firstBrace === -1) return null;
  let depth = 0;
  for (let i = firstBrace; i < s.length; i++) {
    const ch = s[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        let candidate = s.substring(firstBrace, i + 1);
        // Remove trailing commas before closing brackets/braces
        candidate = candidate.replace(/,\s*([}\]])/g, '$1');
        return candidate.trim();
      }
    }
  }
  return null;
}

// Utility: safe JSON parse with cleanup attempts
function safeParseJson<T = any>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Try extracting a JSON block
    const block = extractJsonString(raw);
    if (!block) return null;
    try {
      return JSON.parse(block) as T;
    } catch {
      // Final attempt: loosen common issues
      const fixed = block
        // Remove trailing commas again just in case
        .replace(/,\s*([}\]])/g, '$1')
        // Replace unescaped newlines in strings (rare)
        .replace(/\n/g, ' ');
      try {
        return JSON.parse(fixed) as T;
      } catch {
        return null;
      }
    }
  }
}

// 1. Define the structure for the AI's understanding of a user's query
interface QueryAnalysis {
  intent: 'search_hotels' | 'get_hotel_details' | 'greeting' | 'small_talk' | 'question' | 'booking_intent' | 'unknown';
  entities: {
    location?: string;
    amenities?: string[];
    hotelName?: string;
    [key: string]: any; // Allow for other extracted details
  };
  conversationType: 'casual' | 'search' | 'transactional';
  shouldShowHotels: boolean;
}

// 2. Define the structure for the data we'll fetch from the database
interface HotelData {
  id: string;
  name: string;
  description: string;
  location: string;
  price: number;
  amenities: string[];
  images: string[];
  rating: number;
}

// 3. Function to analyze the user's query with Gemini - ENHANCED
async function analyzeQuery(query: string): Promise<QueryAnalysis> {
  // PRE-CHECK: Fast heuristic for obvious greetings BEFORE calling AI
  const normalizedQuery = query.trim().toLowerCase();
  
  // Exact greeting matches (most common)
  const greetingPatterns = ['hi', 'hello', 'hey', 'yo', 'sup', 'hola', 'howdy'];
  if (greetingPatterns.includes(normalizedQuery)) {
    console.log('🎯 Fast greeting detection:', normalizedQuery);
    return {
      intent: 'greeting',
      conversationType: 'casual',
      shouldShowHotels: false,
      entities: {}
    };
  }
  
  // Greeting with punctuation/emoji
  if (/^(hi|hello|hey|yo|sup|hola|howdy)[!.,?\s]*$/i.test(normalizedQuery)) {
    console.log('🎯 Fast greeting detection (with punctuation):', normalizedQuery);
    return {
      intent: 'greeting',
      conversationType: 'casual',
      shouldShowHotels: false,
      entities: {}
    };
  }
  
  const model = getGeminiModel();
  const prompt = `You are an elite AI travel analyst. Analyze this message and determine the conversation intent.

USER MESSAGE: "${query}"

Classify the intent and conversation type:

INTENT OPTIONS:
- "greeting": Hi, hello, hey, how are you, good morning, etc.
- "small_talk": Casual conversation, questions about yourself, weather, jokes, etc.
- "question": General travel questions, advice, recommendations (not specific search)
- "search_hotels": User wants to find/search for hotels. INCLUDES:
  * Explicit: "find hotels in X", "hotels in X", "accommodation in X"
  * Implicit: Just a city/country name (e.g., "Nairobi", "Kenya", "Paris")
  * With details: "romantic hotel in X under Y$", "cheap hotels X"
  * Any query mentioning a place name where they likely want accommodations
- "get_hotel_details": Asking about a specific hotel by name
- "booking_intent": Ready to book, wants to reserve
- "unknown": Cannot determine

CONVERSATION TYPE:
- "casual": Greeting or small talk
- "search": Looking for hotels/accommodations
- "transactional": Ready to book or get specific details

SHOULD SHOW HOTELS:
- true: Intent is "search_hotels" (whether explicit request or just a location name)
- false: For greetings, small talk, general questions

IMPORTANT: If the message is just a city/country/place name (e.g., "Nairobi", "Kenya", "Bujumbura", "Paris"), treat it as "search_hotels" with shouldShowHotels=true.

Return ONLY valid JSON:
{
  "intent": "greeting|small_talk|question|search_hotels|get_hotel_details|booking_intent|unknown",
  "conversationType": "casual|search|transactional",
  "shouldShowHotels": true|false,
  "entities": {
    "location": "extracted location if present",
    "hotelName": "specific hotel name if mentioned",
    "amenities": ["amenity1", "amenity2"],
    "budget": "luxury|mid-range|budget",
    "travelPurpose": "business|leisure|family|romantic",
    "emotionalTone": "excited|neutral|stressed|curious"
  }
}`;

  try {
    // ensure we await the async factory with generate mode so `model.generateContent` is supported
    const model = await getGeminiModel({ mode: 'generate' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    const cleanedText = text.replace(/\r?\n/g, ' ').trim();

    console.log('🤖 AI Query Analysis Raw Response:', cleanedText.substring(0, 200));

    let parsed = safeParseJson<QueryAnalysis>(cleanedText);
    if (!parsed) {
      console.error('❌ JSON parse error, using heuristic fallback');
      
      // Detect greetings
      if (/^(hi|hello|hey|good morning|good afternoon|good evening|greetings|sup|yo|hola)\b/i.test(query.trim())) {
        console.log('🎯 Fallback greeting detection');
        return {
          intent: 'greeting',
          conversationType: 'casual',
          shouldShowHotels: false,
          entities: {}
        };
      }
      
      // Detect questions/small talk
      if (/^(how are you|what can you do|who are you|tell me about|can you help)/i.test(query.trim())) {
        console.log('🎯 Fallback small_talk detection');
        return {
          intent: 'small_talk',
          conversationType: 'casual',
          shouldShowHotels: false,
          entities: {}
        };
      }
      
      const locationMatch = query.match(/(?:in|at|near|around)\s+([A-Za-z\s]+)|([A-Za-z\s]+)\s+(?:hotel|accommodation)/i);
      const hotelNameMatch = query.match(/([A-Z][A-Za-z0-9'&\-\s]{2,}\s(?:Hotel|Resort|Inn|Suites|Lodge|Villa|Boutique|Marriott|Hilton|Hyatt|Sheraton|Radisson))/i);
      
      // Check if it's a simple city/country name (2-30 chars, mostly letters, possibly capitalized)
      const simpleLocationPattern = /^[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?$/; // e.g., "Kenya", "Nairobi", "New York"
      const isSimpleLocation = simpleLocationPattern.test(query.trim());
      
      // Check for budget/preference keywords combined with location-like text
      const hasBudgetKeyword = /budget|cheap|affordable|under|luxury|premium|\$|dollar/i.test(query);
      const hasPurposeKeyword = /romantic|business|family|honeymoon|vacation|relaxing/i.test(query);
      
      const isLikelyHotelSearch = !!(locationMatch || hotelNameMatch || isSimpleLocation || (hasBudgetKeyword && query.length > 5) || (hasPurposeKeyword && query.length > 5));
      
      console.log('🎯 Fallback heuristics:', {
        locationMatch: !!locationMatch,
        hotelNameMatch: !!hotelNameMatch,
        isSimpleLocation,
        hasBudgetKeyword,
        hasPurposeKeyword,
        isLikelyHotelSearch
      });
      
      return {
        intent: isLikelyHotelSearch ? 'search_hotels' : 'question',
        conversationType: isLikelyHotelSearch ? 'search' : 'casual',
        shouldShowHotels: isLikelyHotelSearch,
        entities: {
          location: locationMatch ? (locationMatch[1] || locationMatch[2]).trim() : (isSimpleLocation ? query.trim() : query),
          hotelName: hotelNameMatch ? hotelNameMatch[1].trim() : undefined,
          budget: query.match(/budget|cheap|affordable/i) ? 'budget' : query.match(/luxury|premium|5.star|upscale/i) ? 'luxury' : 'mid-range',
        },
      };
    }

    // Normalize and enforce defaults
    if (!parsed.conversationType) {
      parsed.conversationType = parsed.intent === 'search_hotels' ? 'search' : 'casual';
    }
    
    if (parsed.shouldShowHotels === undefined) {
      parsed.shouldShowHotels = (parsed.intent === 'search_hotels' && !!parsed.entities?.location);
    }
    
    parsed.entities = parsed.entities || {};
    
    console.log('✅ AI Intent Analysis Result:', {
      intent: parsed.intent,
      conversationType: parsed.conversationType,
      shouldShowHotels: parsed.shouldShowHotels,
      hasLocation: !!parsed.entities?.location
    });
    
    // Heuristic hotel name extraction if model missed it
    if (!parsed.entities.hotelName && parsed.intent === 'search_hotels') {
      const hotelNameMatch = query.match(/([A-Z][A-Za-z0-9'&\-\s]{2,}\s(?:Hotel|Resort|Inn|Suites|Lodge|Villa|Boutique|Marriott|Hilton|Hyatt|Sheraton|Radisson))/i);
      if (hotelNameMatch) parsed.entities.hotelName = hotelNameMatch[1].trim();
    }
    
    return parsed;
  } catch (error) {
    console.error('Error analyzing query:', error);
    return {
      intent: 'unknown',
      conversationType: 'casual',
      shouldShowHotels: false,
      entities: {}
    };
  }
}

// 4. Function to search for hotels - REPLACED WITH GEOAPIFY
async function searchHotels(analysis: QueryAnalysis): Promise<HotelData[]> {
  const { location } = analysis.entities;

  if (!location || !location.trim()) {
    console.log('No location provided, skipping API search.');
    return [];
  }
  
  console.log(`🚀 Calling Geoapify to find hotels in: "${location}"`);

  try {
    const hotelsFromApi = await findHotelsFromGeoapify(location);
    console.log(`✅ Geoapify found ${hotelsFromApi.length} potential hotels.`);

    if (hotelsFromApi.length === 0) {
      return [];
    }
    
    // Map the API results to our HotelData structure.
    // We'll use placeholder data for fields not in the initial search result.
    const placeholderImage = 'https://images.unsplash.com/photo-1559599238-0ea6229ab6a6?q=80&w=1200&auto=format&fit=crop';
    
    const hotelData: HotelData[] = hotelsFromApi.map(hotel => {
      // Use images from Geoapify if available, otherwise use placeholder
      const images = (hotel.images && Array.isArray(hotel.images) && hotel.images.length > 0)
        ? hotel.images
        : [placeholderImage];
      
      console.log(`🖼️ Hotel ${hotel.name} images:`, images);
      
      return {
        id: hotel.id,
        name: hotel.name || 'Hotel Name',
        location: hotel.location || 'Location not available',
        description: 'Select this hotel to see more details.', // Placeholder description
        price: 0, // Placeholder price
        amenities: [], // Placeholder amenities
        images: images,
        rating: 0, // Placeholder rating
      };
    });

    return hotelData;

  } catch (error) {
    console.error('❌ Error calling Geoapify service from smartService:', error);
    // Return empty array if the API call fails
    return [];
  }
}

// 5. Function to generate expert-level, emotionally intelligent responses
async function generateResponse(
  query: string,
  hotels: HotelData[],
  contextInfo?: {
    conversationHistory?: string;
    userPreferences?: string;
    lastEmotion?: string;
    lastIntent?: string; // current detected intent for this turn
    clarifyingQuestions?: string[];
  }
): Promise<{ text: string; hotels: HotelData[] }> {
  const model = getGeminiModel();
  
  const hotelDetails = hotels.length > 0
    ? hotels.map((h, idx) => 
        `${idx + 1}. **${h.name}**
   📍 Location: ${h.location}
`
      ).join('\n')
    : 'No exact matches found in our current database.';

  // Lightweight dynamic memory distillation
  const distilledMemory = (contextInfo?.conversationHistory || '')
    .split(/\n|\r/)
    .slice(-12)
    .map(l => l.trim())
    .filter(Boolean)
    .join(' | ');

  const expertPrompt = `You are AIBookify - a friendly, intelligent AI travel assistant like ChatGPT, designed for natural conversation.

CONVERSATION CONTEXT:
${distilledMemory || '(first interaction)'}

USER STATE:
${contextInfo?.userPreferences || '(getting to know user)'}
- Emotion: ${contextInfo?.lastEmotion || 'neutral'}
- Intent: ${contextInfo?.lastIntent || 'unknown'}

CURRENT MESSAGE: "${query}"

SEARCH RESULTS:
I have found ${hotels.length} hotels based on the user's query.
${hotelDetails}

YOUR BEHAVIOR:
1. **Natural Greeting Response**: If user says "hi/hello/hey", greet warmly and ask how you can help with their travel plans today.
2. **Build Rapport**: For casual questions or small talk, respond naturally like ChatGPT - be helpful, friendly, conversational.
3. **Hotel Search Mode**: When you have hotel results to share, present them. Let the user know you found options and list the names and locations.
4. **Adaptive Tone**: Match user's energy - casual with casual, professional with business, excited with excited.

STYLE:
- Short, conversational sentences (like texting a knowledgeable friend)
- Use "I" naturally: "I can help you find...", "I'd recommend...", "I'm here to..."
- Avoid robotic phrases like "Certainly!" or "I would be happy to assist"

${(contextInfo?.clarifyingQuestions && contextInfo.clarifyingQuestions.length > 0 && hotels.length === 0)
  ? `If they haven't given enough to search yet, casually ask: ${contextInfo.clarifyingQuestions[0]}`
  : ''}

Respond now (plain text only, conversational):`;


  try {
    // ensure we await the async factory with generate mode
    const model = await getGeminiModel({ mode: 'generate' });
    const result = await model.generateContent(expertPrompt);
    const response = await result.response;
    const text = await response.text();
    
    console.log('🎨 AI Expert Response Generated:', text.substring(0, 150));
    
    return { text: text.trim(), hotels };
    
  } catch (error) {
    console.error('Error generating AI response:', error);
    let fallbackText = `I found ${hotels.length} great option${hotels.length===1?'':'s'} for you! Here are the top results.`;
    return { text: fallbackText, hotels };
  }
}

// 6. The main function for the smart service - ENHANCED with context
export async function getSmartResponse(
  query: string,
  userId: string = 'guest'
): Promise<{ text: string; hotels: HotelData[] }> {
  try {
    console.log('Processing query for user:', userId, '- Query:', query);
    
    ContextService.saveUserMessage(userId, query);
    await ContextService.updatePreferences(userId, query);
    
    const conversationHistory = ContextService.getConversationHistory(userId);
    const userPreferences = ContextService.getUserPreferences(userId);
    
    const analysis = await analyzeQuery(query);
    console.log('Query analysis:', analysis);

    let hotels: HotelData[] = [];
    if (analysis.shouldShowHotels && analysis.entities.location) {
      console.log('🔍 Triggering hotel search with analysis:', {
        intent: analysis.intent,
        location: analysis.entities.location
      });
      hotels = await searchHotels(analysis);
    } else {
      console.log('💬 Conversational mode - no hotel search triggered');
    }

    const state = ContextService.getState(userId);

    const clarifyingQuestions: string[] = [];
    if (analysis.intent === 'search_hotels' && !analysis.entities.location) {
      clarifyingQuestions.push('Which city or area are you thinking about?');
    }
    
    const response = await generateResponse(query, hotels, {
      conversationHistory,
      userPreferences,
      lastEmotion: state.lastEmotion,
      lastIntent: analysis.intent,
      clarifyingQuestions,
    });
    
    ContextService.saveAIMessage(userId, response.text);
    
    return response;
    
  } catch (error) {
    console.error('Error in getSmartResponse:', error);
    return {
      text: "I'm having a little trouble right now, but I'm still here to help! Could you tell me the destination you're interested in again?",
      hotels: []
    };
  }
}