
import { Message, ChatSession, LoadedChatSession } from '../types';

const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api/chat/smart-chat`;
const SESSIONS_URL = `${BASE_URL}/api/chat/sessions`;

export const getSmartChatResponse = async (message: string, authToken?: string, sessionId?: string): Promise<Message & { sessionId: string }> => {
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
      body: JSON.stringify({ message, sessionId }),
    });

    const data = await response.json();

    console.log('📡 API Response received:', data);
    console.log('📡 Hotels in response:', data.hotels);
    if (data.hotels && data.hotels.length > 0) {
      console.log('📡 First hotel:', data.hotels[0]);
      console.log('📡 First hotel images:', data.hotels[0].images);
    }

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get smart chat response');
    }

    const messageWithHotels = {
      id: Date.now().toString(),
      sender: 'ai' as const,
      text: data.response || "I apologize, but I'm having trouble understanding. Could you please rephrase your question?",
      hotels: data.hotels || [],
      sessionId: data.sessionId,
    };

    console.log('📡 Message object created:', messageWithHotels);
    console.log('📡 Message hotels:', messageWithHotels.hotels);

    return messageWithHotels;
  } catch (error) {
    console.error('Error in getSmartChatResponse:', error);
    throw error;
  }
};

export const getChatSessions = async (authToken?: string): Promise<ChatSession[]> => {
  try {
    const headers: any = {
      'Content-Type': 'application/json',
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(SESSIONS_URL, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch chat sessions');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return [];
  }
};

export const loadChatSession = async (sessionId: string, authToken?: string): Promise<LoadedChatSession | null> => {
  try {
    const headers: any = {
      'Content-Type': 'application/json',
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(`${SESSIONS_URL}/${sessionId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to load chat session');
    }

    return await response.json();
  } catch (error) {
    console.error('Error loading chat session:', error);
    return null;
  }
};

export const deleteChatSession = async (sessionId: string, authToken?: string): Promise<boolean> => {
  try {
    const headers: any = {
      'Content-Type': 'application/json',
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(`${SESSIONS_URL}/${sessionId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        return false;
      }
      throw new Error('Failed to delete chat session');
    }

    return true;
  } catch (error) {
    console.error('Error deleting chat session:', error);
    return false;
  }
};
