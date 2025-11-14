import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Message } from "../types";
import { getAiResponse } from "../services/geminiService";
import ChatInput from "../components/chat/ChatInput";
import ChatMessage from "../components/chat/ChatMessage";
import { INITIAL_GREETING } from "../constants";
import TravelerSidebar from "../components/traveler/Sidebar";
import HotelCard from "../components/chat/HotelCard";

import { getSmartChatResponse } from "../services/smartChatService";
import { useAuth } from "../contexts/AuthContext";

const TravelerUIPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: "0", sender: "ai", text: INITIAL_GREETING },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNewChat = () => {
    setMessages([{ id: "0", sender: "ai", text: INITIAL_GREETING }]);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleSendMessage = async (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text,
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
      const aiMessage = await getSmartChatResponse(text, user?.token);

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
            {messages.map((msg) => (
              <React.Fragment key={msg.id}>
                <ChatMessage message={msg} />
                {msg.hotels && msg.hotels.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {msg.hotels.map((hotel) => (
                      <HotelCard key={hotel.id} hotel={hotel} />
                    ))}
                  </div>
                )}
              </React.Fragment>
            ))}
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
