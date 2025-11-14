import React, { useEffect, useState } from "react";
import { useChat } from "../../../contexts/ChatContext";

const ClientChat: React.FC = () => {
  const { messages, joinHotelRoom } = useChat();
  const [hotelId, setHotelId] = useState("");
  const [joined, setJoined] = useState(false);

  const handleJoin = () => {
    if (!hotelId) return;
    joinHotelRoom(hotelId);
    setJoined(true);
  };

  return (
    <div className="bg-light-card dark:bg-dark-card p-6 rounded-lg shadow">
      <div className="mx-auto w-16 h-16 mb-4 text-primary">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </div>
      <h2 className="text-2xl font-bold mb-2 text-center">Client Chat</h2>
      <p className="text-gray-600 dark:text-gray-400 text-center">
        View traveler conversations with your AI assistant in real-time. Join a
        specific hotel room below.
      </p>

      <div className="mt-6 p-4 border rounded-lg dark:border-gray-700">
        <div className="flex gap-2 mb-4">
          <input
            value={hotelId}
            onChange={(e) => setHotelId(e.target.value)}
            placeholder="Enter Hotel ID"
            className="flex-1 p-2 border rounded dark:bg-dark-surface"
          />
          <button
            onClick={handleJoin}
            className="bg-secondary text-white px-4 py-2 rounded-md font-semibold hover:bg-opacity-90 transition-colors"
          >
            {joined ? "Joined" : "Join Live Chat"}
          </button>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {messages
            .filter((m) => !hotelId || m.hotelId === hotelId)
            .map((m, i) => (
              <div
                key={i}
                className="p-3 rounded bg-gray-100 dark:bg-gray-700 text-sm"
              >
                <strong>
                  {m.isAI || m.userId === "AI_ASSISTANT"
                    ? "AI"
                    : m.isHotelStaff
                    ? "Staff"
                    : "Traveler"}
                  :
                </strong>{" "}
                {m.message || m.text}
                <span className="ml-2 text-xs text-gray-500">
                  {m.timestamp
                    ? new Date(m.timestamp).toLocaleTimeString()
                    : ""}
                </span>
              </div>
            ))}
          {messages.length === 0 && (
            <div className="text-sm text-gray-500">
              No messages yet. When a traveler begins a booking, messages will
              appear here live.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientChat;
