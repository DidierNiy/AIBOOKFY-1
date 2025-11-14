

import { MOCK_HOTELS } from '../constants';
import { Message, Hotel } from '../types';
import { bookingService } from './bookingService';
// Note: In a real application, you would import from "@google/genai"
// import { GoogleGenAI, FunctionDeclaration, Type } from '@google/genai';

// This is a mock service. The actual Gemini API calls are commented out.
// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Mock function to simulate a delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


export const getAiResponse = async (userMessage: string, chatHistory: Message[]): Promise<Message> => {
  await sleep(1500); // Simulate API latency

  const lowerCaseMessage = userMessage.toLowerCase();
  
  // New: Check for booking intent first
  if (lowerCaseMessage.includes('book') || lowerCaseMessage.includes('reserve')) {
      let hotelToBook: Hotel | null = MOCK_HOTELS.find(hotel => lowerCaseMessage.includes(hotel.name.toLowerCase())) || null;

      // If no hotel name is in the current message, check the context from the last AI message
      if (!hotelToBook) {
          const lastAiMessageWithHotels = [...chatHistory].reverse().find(m => m.sender === 'ai' && m.hotels && m.hotels.length > 0);
          if (lastAiMessageWithHotels?.hotels) {
              // User is likely referring to the hotel(s) just shown.
              // For simplicity, let's assume they mean the first one for a generic "book it".
              hotelToBook = lastAiMessageWithHotels.hotels[0];
          }
      }
      
      if (hotelToBook) {
          // We have a hotel, either from the message or context.
          const response: Message = {
              id: Date.now().toString(),
              sender: 'ai',
              text: `You got it! Let's proceed with booking the ${hotelToBook.name}. I'll take you to a page where we can confirm dates and finalize everything.`,
              navigateTo: `/book/${hotelToBook.id}`,
          };
          return response;
      }
  }


  const response: Message = { id: Date.now().toString(), sender: 'ai' };

  // Enhanced filtering logic
  const wantsPetFriendly = lowerCaseMessage.includes('pet friendly') || lowerCaseMessage.includes('pets');
  const wantsParking = lowerCaseMessage.includes('parking');
  const wantsFamilyFriendly = lowerCaseMessage.includes('family');

  let filteredHotels = MOCK_HOTELS;
  let responseText = "Certainly! I've found a couple of highly-rated hotels in Bujumbura for you. Take a look.";

  if (wantsPetFriendly || wantsParking || wantsFamilyFriendly) {
      filteredHotels = MOCK_HOTELS.filter(hotel => {
          const hasPetFriendly = wantsPetFriendly ? hotel.petFriendly : true;
          const hasParking = wantsParking ? hotel.freeParking : true;
          const hasFamilyFriendly = wantsFamilyFriendly ? hotel.familyFriendly : true;
          return hasPetFriendly && hasParking && hasFamilyFriendly;
      });
      
      if(filteredHotels.length > 0) {
          responseText = "Yes, I found some great options with those amenities for you:"
      } else {
          responseText = "I'm sorry, I couldn't find any hotels that match all of those criteria. Here are some other popular options:"
          filteredHotels = MOCK_HOTELS;
      }
  } else if (lowerCaseMessage.includes('bujumbura') && lowerCaseMessage.includes('under $100')) {
    responseText = "Of course! Here is a great beachfront option I found in Bujumbura for under $100.";
    filteredHotels = MOCK_HOTELS.filter(h => h.price < 100);
  } else if (!lowerCaseMessage.includes('find') && !lowerCaseMessage.includes('hotel')) {
     responseText = "I'm sorry, I'm having trouble understanding. Could you please rephrase? You can ask me to find hotels with specific criteria, like 'Find me a pet-friendly hotel in Bujumbura'.";
     filteredHotels = [];
  }

  response.text = responseText;
  if(filteredHotels.length > 0) {
    response.hotels = filteredHotels;
  }

  return response;
};

// New context-aware function for the booking page
export const getAiBookingResponse = async (
  userMessage: string,
  chatHistory: Message[],
  hotel: Hotel,
  currentBookingId: string | null
): Promise<Message> => {
  await sleep(1500);

  const lowerCaseMessage = userMessage.toLowerCase();
  const response: Message = { id: Date.now().toString(), sender: 'ai' };
  
  // Date parsing simulation
  const dateRegex = /(\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2})/;
  const dateMatch = lowerCaseMessage.match(dateRegex);

  // If we already have a booking ID, we are looking for guest count to finalize
  if (currentBookingId) {
    if (lowerCaseMessage.includes('guest')) {
      // Find the pending booking to get dates
      const pendingBooking = bookingService.getBooking(currentBookingId);
      const nights = pendingBooking ? (new Date(pendingBooking.checkOut).getTime() - new Date(pendingBooking.checkIn).getTime()) / (1000 * 3600 * 24) : 2;
      const total = hotel.price * Math.max(nights, 1);
      
      response.text = `Perfect, I've updated the booking. The total for your stay will be $${total.toFixed(2)}. Please use the button below to finalize your payment.`;
      response.paymentDetails = {
        bookingId: currentBookingId,
        amount: total,
        currency: 'USD',
      };
    } else {
      response.text = `I have your dates confirmed. How many guests will be staying?`;
    }
  } 
  // If we don't have a booking ID, we are looking for dates
  else if (dateMatch) {
    const checkIn = dateMatch[1];
    const checkOut = dateMatch[2];
    const newBooking = bookingService.addBooking({
      guestName: 'Alex', // Would come from auth context
      checkIn: checkIn,
      checkOut: checkOut,
      status: 'Pending',
      totalPaid: 0,
    });
    // This is a special message that contains the new booking ID but is not yet a payment request
    // The page will use this to update its internal state
    response.text = `Great! I've confirmed availability from ${checkIn} to ${checkOut}. To continue, how many guests will be staying?`;
    // We sneak the booking ID into the paymentDetails for the frontend to grab
    response.paymentDetails = { bookingId: newBooking.id, amount: -1, currency: '' };
  } 
  // Initial or unclear message
  else {
    response.text = `I can help with that. Please provide your desired check-in and check-out dates in the format: 'YYYY-MM-DD to YYYY-MM-DD'.`;
  }

  return response;
};