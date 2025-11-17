import React from "react";
import { Message } from "../../types";
import HotelCard from "./HotelCard";
import BookingReceipt from "../booking/BookingReceipt";

interface ChatMessageProps {
  message: Message;
  onPayment?: () => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onPayment }) => {
  const isUser = message.sender === "user";

  if (message.isLoading) {
    return (
      <div className="flex items-start space-x-3 animate-fade-in-up">
        <div className="p-2 bg-primary rounded-full text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div className="flex items-center space-x-1 pt-2">
          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col animate-fade-in-up ${
        isUser ? "items-end" : "items-start"
      }`}
    >
      <div
        className={`flex items-start space-x-3 ${
          isUser ? "flex-row-reverse space-x-reverse" : ""
        }`}
      >
        {!isUser && (
          <div className="flex-shrink-0 p-2 bg-primary rounded-full text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
        )}
        {message.text && (
          <div
            className={`max-w-xl rounded-2xl px-4 py-3 ${
              isUser
                ? "bg-primary text-white"
                : "bg-light-card dark:bg-dark-card"
            }`}
          >
            {message.isVoiceMessage && isUser && (
              <div className="flex items-center gap-2 text-xs opacity-75 mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
                <span>Voice message</span>
              </div>
            )}
            <p className="text-sm whitespace-pre-wrap">{message.text}</p>
          </div>
        )}
        {message.bookingReceipt && (
          <BookingReceipt receipt={message.bookingReceipt} />
        )}
      </div>

      {message.paymentDetails &&
        message.paymentDetails.amount > 0 &&
        onPayment && (
          <div className="mt-2 ml-12">
            <button
              onClick={onPayment}
              className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors animate-fade-in-up"
            >
              Pay ${message.paymentDetails.amount.toFixed(2)} Now
            </button>
          </div>
        )}

      {message.hotels && (
        <div className="mt-4 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
          {message.hotels.map((hotel) => (
            <HotelCard key={hotel.id} hotel={hotel} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
