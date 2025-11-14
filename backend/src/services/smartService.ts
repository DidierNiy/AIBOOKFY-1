import { getGeminiModel } from './aiService';
import Listing, { IListing } from '../models/Listing';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ContextService } from './contextService';

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
    // ensure we await the async factory so `model` is the instance (not a Promise)
    const model = await getGeminiModel();
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

// 4. Function to search the database for hotels with flexible matching
async function searchHotels(analysis: QueryAnalysis): Promise<HotelData[]> {
  const { location, amenities, hotelName } = analysis.entities;
  const query: any = {};
  const orConditions: any[] = [];

  console.log('Searching hotels with:', { location, amenities });

  // Build flexible search query
  if (location && location.trim()) {
    const locationRegex = new RegExp(location.trim(), 'i');
    orConditions.push(
      { location: locationRegex },
      { name: locationRegex },
      { description: locationRegex }
    );
  }

  if (amenities && amenities.length > 0) {
    query.amenities = { $in: amenities }; // Use $in instead of $all for more flexible matching
  }

  // If we have location search conditions, use $or
  if (orConditions.length > 0) {
    query.$or = orConditions;
  }

  try {
    // Cast the result to IListing[] for proper typing
    let listings: IListing[] = [] as any;

    // 1) Prioritize exact/strong name match if hotelName provided
    if (hotelName && hotelName.trim()) {
      const exactName = new RegExp(`^${hotelName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      listings = (await Listing.find({ name: exactName }).limit(3)) as IListing[];
      if (listings.length === 0) {
        const containsName = new RegExp(hotelName.trim().replace(/[.*+?^${}()|[\]\\]/g, ''), 'i');
        listings = (await Listing.find({ name: containsName }).limit(5)) as IListing[];
      }
    }

    // 2) If still nothing, do flexible search by location/amenities
    if (listings.length === 0) {
      listings = (await Listing.find(query).limit(20)) as IListing[];
    }
    
    // If no results found with strict query, try broader search
    if (listings.length === 0 && location) {
      console.log('No results found, trying broader search...');
      listings = (await Listing.find({}).limit(6)) as IListing[];
    }

    console.log(`Found ${listings.length} hotels`);

    const placeholderImage = 'https://images.unsplash.com/photo-1559599238-0ea6229ab6a6?q=80&w=1200&auto=format&fit=crop';
    
    // Adaptive ranking based on amenities/budget/name match and rating
    const budget = String((analysis.entities as any).budget || '').toLowerCase();
    const budgetScore = (price: number) => {
      if (!price || isNaN(price)) return 0;
      if (budget === 'budget') return price <= 100 ? 3 : price <= 150 ? 1 : 0;
      if (budget === 'mid-range' || budget === 'midrange') return price >= 80 && price <= 250 ? 3 : price <= 300 ? 1 : 0;
      if (budget === 'luxury') return price >= 250 ? 3 : price >= 200 ? 1 : 0;
      return 0;
    };

    const preferredAmenities: string[] = Array.isArray(amenities) ? amenities.map(a => String(a).toLowerCase()) : [];

    const nameRegex = hotelName ? new RegExp(hotelName.trim().replace(/[.*+?^${}()|[\]\\]/g, ''), 'i') : null;

    const scored = listings.map(l => {
      const a = (l.amenities || []).map(x => String(x).toLowerCase());
      const amenityHits = preferredAmenities.filter(p => a.includes(p)).length;
      const nameHit = nameRegex && nameRegex.test(l.name || '') ? 5 : 0;
      const priceHit = budgetScore(l.price || 0);
      const ratingHit = Math.min(l.rating || 0, 5) * 0.5; // scale rating to weight
      const score = amenityHits * 2 + nameHit + priceHit + ratingHit;
      return { l, score };
    }).sort((x, y) => y.score - x.score);

    const ranked = scored.map(({ l }) => l);

    return ranked.map((listing: IListing): HotelData => ({
      id: listing._id.toString(),
      name: listing.name || 'Hotel',
      description: listing.description || '',
      location: listing.location || '',
      price: listing.price || 0,
      amenities: listing.amenities || [],
      images: (Array.isArray(listing.images) && listing.images.length > 0)
        ? listing.images
        : [placeholderImage],
      rating: listing.rating || 4.0,
    }));
  } catch (error) {
    console.error('Error searching for hotels:', error);
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
   💰 Price: $${h.price}/night
   ⭐ Rating: ${h.rating}/5.0
   ✨ Amenities: ${h.amenities.slice(0, 5).join(', ')}
   📝 ${h.description.substring(0, 100)}...`
      ).join('\n\n')
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

CONVERSATION TYPE: ${hotels.length > 0 ? 'HOTEL SEARCH' : 'CASUAL/INFO'}

YOUR BEHAVIOR:
1. **Natural Greeting Response**: If user says "hi/hello/hey", greet warmly and ask how you can help with their travel plans today.
2. **Build Rapport**: For casual questions or small talk, respond naturally like ChatGPT - be helpful, friendly, conversational.
3. **Gradual Discovery**: Don't force hotel search. Let conversation flow. Ask follow-ups naturally.
4. **Hotel Search Mode**: ONLY when you have ${hotels.length} hotel results to share, present them enthusiastically with reasons they're great matches.
5. **Adaptive Tone**: Match user's energy - casual with casual, professional with business, excited with excited.

STYLE:
- Short, conversational sentences (like texting a knowledgeable friend)
- Use "I" naturally: "I can help you find...", "I'd recommend...", "I'm here to..."
- Avoid robotic phrases like "Certainly!" or "I would be happy to assist"
- Be human: acknowledge uncertainty, show personality, use light humor when appropriate
- ${hotels.length > 0 ? 'Highlight top 2 hotels with specific compelling reasons' : 'Focus on understanding what they need before searching'}

${(contextInfo?.clarifyingQuestions && contextInfo.clarifyingQuestions.length > 0 && hotels.length === 0)
  ? `If they haven't given enough to search yet, casually ask: ${contextInfo.clarifyingQuestions[0]}`
  : ''}

Respond now (plain text only, conversational):`;


  try {
    // ensure we await the async factory so `model` is the instance (not a Promise)
    const model = await getGeminiModel();
    const result = await model.generateContent(expertPrompt);
    const response = await result.response;
    const text = await response.text();
    
    console.log('🎨 AI Expert Response Generated:', text.substring(0, 150));
    console.log('📊 Response context:', { hotelsCount: hotels.length, queryLength: query.length });
    
    const cleaned = text.trim();
    
    // If no hotels and it's a greeting/casual, return friendly response
    if (hotels.length === 0 && cleaned.length > 10) {
      console.log('✅ Returning conversational response (no hotels)');
      return { text: cleaned, hotels: [] };
    }
    
    // If we have hotels, return them with the response
    if (hotels.length > 0) {
      console.log('✅ Returning response WITH hotels:', hotels.length);
      return { text: cleaned, hotels };
    }
    
    // Provide better default if model response too short
    let fallbackText: string;
    if (hotels.length > 0) {
      fallbackText = `I found ${hotels.length} great option${hotels.length===1?'':'s'} for you! Let me highlight the best matches based on what you're looking for.`;
    } else if (/^(hi|hello|hey|yo|hola)\b/i.test(query.trim()) || contextInfo?.lastIntent === 'greeting') {
      fallbackText = `Hey there! 👋 Great to meet you. I'm your travel buddy. What kind of trip are you thinking about — relaxing escape, city adventure, business, something romantic?`;  
    } else if (contextInfo?.lastIntent === 'small_talk') {
      fallbackText = `I'm here and ready to help with travel whenever you are. Got a destination in mind or just exploring ideas?`;
    } else {
      fallbackText = `Tell me your destination (city or area) and any preferences (budget, vibe, must-have amenities) and I'll start finding options.`;
    }
    return { 
      text: cleaned && cleaned.length > 20 ? cleaned : fallbackText,
      hotels 
    };
  } catch (error) {
    console.error('Error generating AI response:', error);
    // Intelligent fallback with greeting awareness
    let text: string;
    if (hotels.length > 0) {
      text = `I've got ${hotels.length} solid option${hotels.length===1?'':'s'} here. Want me to walk you through the top picks?`;
    } else if (/^(hi|hello|hey|yo|hola)\b/i.test(query.trim()) || contextInfo?.lastIntent === 'greeting') {
      text = `Hey! 👋 I'm your travel buddy. Whenever you're ready, tell me a destination or the kind of stay you want and I'll tailor options. What are you planning?`;
    } else if (contextInfo?.lastIntent === 'small_talk') {
      text = `Happy to chat! And when you feel like searching, just drop a place or style (beach, city, quiet, luxury, budget).`;
    } else {
      text = `Share a destination (city/area) plus any vibes or amenities you care about, and I'll start building a shortlist for you.`;
    }
    return { text, hotels };
  }
}

// 6. The main function for the smart service - ENHANCED with context
export async function getSmartResponse(
  query: string,
  userId: string = 'guest'
): Promise<{ text: string; hotels: HotelData[] }> {
  try {
    console.log('Processing query for user:', userId, '- Query:', query);
    
    // Save user message to conversation history
    ContextService.saveUserMessage(userId, query);
    
    // Update user preferences based on query
    await ContextService.updatePreferences(userId, query);
    
    // Get conversation history for context
  const conversationHistory = ContextService.getConversationHistory(userId);
  const userPreferences = ContextService.getUserPreferences(userId);
    
    console.log('Conversation context:', { 
      hasHistory: !!conversationHistory, 
      hasPreferences: !!userPreferences 
    });
    
    // Analyze query with enhanced context
    const analysis = await analyzeQuery(query);
    console.log('Query analysis:', analysis);

    // Only search hotels if shouldShowHotels is true
    let hotels: HotelData[] = [];
    if (analysis.shouldShowHotels && analysis.intent === 'search_hotels') {
      console.log('🔍 Triggering hotel search with analysis:', {
        intent: analysis.intent,
        shouldShowHotels: analysis.shouldShowHotels,
        location: analysis.entities.location
      });
      hotels = await searchHotels(analysis);
      console.log(`✅ Found ${hotels.length} hotels`);
    } else {
      console.log('💬 Conversational mode - no hotel search triggered', {
        intent: analysis.intent,
        shouldShowHotels: analysis.shouldShowHotels
      });
    }

    // Retrieve prior emotion/intent state for adaptive tone
    const state = ContextService.getState(userId);

    // Generate clarifying questions only if in search mode but missing key info
    const clarifyingQuestions: string[] = [];
    if (analysis.intent === 'search_hotels' || analysis.conversationType === 'search') {
      const hasLocation = !!analysis.entities.location && analysis.entities.location.trim().length > 0;
      const hasBudget = !!analysis.entities.budget;
      const hasPurpose = !!(analysis.entities.travelPurpose || state.lastPurpose);
      if (!hasLocation) clarifyingQuestions.push('Which city or area are you thinking about?');
      if (!hasBudget) clarifyingQuestions.push('What\'s your budget per night roughly?');
      if (!hasPurpose && hotels.length === 0) clarifyingQuestions.push('Is this for business, vacation, or something special?');
      // Limit to top 2 to avoid overload
    }
    const trimmedClarifiers = clarifyingQuestions.slice(0, 2);

    // Generate contextual response (pass current intent for accurate greeting handling)
    const response = await generateResponse(query, hotels, {
      conversationHistory,
      userPreferences,
      lastEmotion: state.lastEmotion,
      lastIntent: analysis.intent,
      clarifyingQuestions: trimmedClarifiers,
    });
    
    // Save AI response to conversation history
    ContextService.saveAIMessage(userId, response.text);
    
    return response;
    
  } catch (error) {
    console.error('Error in getSmartResponse:', error);
    // Graceful fallback
    return {
      text: "I'm your dedicated travel expert, and I'm here to create the perfect stay for you! ✈️ Tell me about your dream destination, and I'll find accommodations that exceed your expectations. What location are you interested in?",
      hotels: []
    };
  }
}
