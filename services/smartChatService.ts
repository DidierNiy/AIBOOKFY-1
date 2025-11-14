
import { Message } from '../types';

const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api/chat/smart-chat`;

export const getSmartChatResponse = async (message: string, authToken?: string): Promise<Message> => {
  try {
    const headers: any = {
      'Content-Type': 'application/json',
    };
    
    // Only add Authorization header if token exists
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get smart chat response');
    }

    return {
      id: Date.now().toString(),
      sender: 'ai',
      text: data.response || "I apologize, but I'm having trouble understanding. Could you please rephrase your question?",
      hotels: data.hotels || [],
    };
  } catch (error) {
    console.error('Error in getSmartChatResponse:', error);
    throw error;
  }
};
