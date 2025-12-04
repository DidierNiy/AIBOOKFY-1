import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Message, ChatSession, LoadedChatSession } from "../types";
import { getAiResponse } from "../services/geminiService";
import ChatInput from "../components/chat/ChatInput";
import ChatMessage from "../components/chat/ChatMessage";
import { INITIAL_GREETING } from "../constants";
import TravelerSidebar from "../components/traveler/Sidebar";
import HotelCard from "../components/chat/HotelCard";

import {
  getSmartChatResponse,
  getChatSessions,
  loadChatSession,
  deleteChatSession,
} from "../services/smartChatService";
import { useAuth } from "../contexts/AuthContext";

const TravelerUIPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: "0", sender: "ai", text: INITIAL_GREETING },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(
    undefined
  );
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Load chat sessions on component mount
  useEffect(() => {
    loadChatSessions();
  }, [user?.token]);

  const loadChatSessions = async () => {
    try {
      const sessions = await getChatSessions(user?.token);
      setChatSessions(sessions);
    } catch (error) {
      console.error("Failed to load chat sessions:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNewChat = () => {
    setMessages([{ id: "0", sender: "ai", text: INITIAL_GREETING }]);
    setCurrentSessionId(undefined);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleLoadSession = async (sessionId: string) => {
    try {
      const session = await loadChatSession(sessionId, user?.token);
      if (session) {
        setMessages(session.messages);
        setCurrentSessionId(sessionId);
        if (window.innerWidth < 768) setIsSidebarOpen(false);
      }
    } catch (error) {
      console.error("Failed to load chat session:", error);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const deleted = await deleteChatSession(sessionId, user?.token);
      if (deleted) {
        // If we deleted the current session, start a new chat
        if (currentSessionId === sessionId) {
          handleNewChat();
        }
        // Refresh the sessions list
        loadChatSessions();
      }
    } catch (error) {
      console.error("Failed to delete chat session:", error);
    }
  };

  const handleSendMessage = async (
    text: string,
    isVoiceMessage: boolean = false
  ) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text,
      isVoiceMessage,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const loadingMessage: Message = {
      id: "loading",
      sender: "ai",
      isLoading: true,
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      const aiMessage = await getSmartChatResponse(
        text,
        user?.token,
        currentSessionId
      );

      // Update current session ID if this is a new session
      if (!currentSessionId && aiMessage.sessionId) {
        setCurrentSessionId(aiMessage.sessionId);
        // Refresh chat sessions list
        loadChatSessions();
      }

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== "loading"),
        aiMessage,
      ]);
    } catch (error) {
      console.error("Failed to get AI response:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        sender: "ai",
        text: "Oops, something went wrong. Please try again.",
      };
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== "loading"),
        errorMessage,
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full relative">
      <TravelerSidebar
        onNewChat={handleNewChat}
        onLoadSession={handleLoadSession}
        onDeleteSession={handleDeleteSession}
        chatSessions={chatSessions}
        currentSessionId={currentSessionId}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      <div className="flex flex-1 flex-col bg-light-bg dark:bg-dark-bg">
        <header className="md:hidden flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700 bg-light-card dark:bg-dark-surface">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Toggle Sidebar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h2 className="font-semibold">AIBookify Chat</h2>
          <div className="w-10"></div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.map((msg) => {
              const hasHotels = Array.isArray(msg.hotels) && msg.hotels.length > 0;

              return (
                <React.Fragment key={msg.id}>
                  <ChatMessage message={msg} />
                  {hasHotels && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                      {msg.hotels.map((hotel, index) => {
                        // Validate hotel before rendering
                        if (!hotel || !hotel.id) {
                          console.warn('Invalid hotel data at index', index, hotel);
                          return null;
                        }
                        return (
                          <HotelCard key={hotel.id || `hotel-${index}`} hotel={hotel} />
                        );
                      })}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </main>
        <footer className="w-full border-t border-gray-200 dark:border-gray-700 bg-light-card dark:bg-dark-surface p-4">
          <div className="mx-auto max-w-3xl">
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
            <p className="text-xs text-center text-gray-500 mt-2">
              AIBookify can make mistakes. Consider checking important
              information.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default TravelerUIPage;
