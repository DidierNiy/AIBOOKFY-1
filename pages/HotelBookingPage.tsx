import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Message, Hotel } from "../types";
import { useChat } from "../contexts/ChatContext";
import ChatInput from "../components/chat/ChatInput";
import ChatMessage from "../components/chat/ChatMessage";
import HotelDetailView from "../components/booking/HotelDetailView";
import PaymentModal from "../components/payment/PaymentModal";

interface GuestDetails {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  arrivalTime: string;
}

const HotelBookingPage: React.FC = () => {
  const { hotelId } = useParams<{ hotelId: string }>();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const bookingIdRef = useRef<string | null>(null);

  const {
    joinHotelRoom,
    sendMessage: sendSocketMessage,
    messages: socketMessages,
  } = useChat();

  // New state for payment modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    bookingId: string;
    amount: number;
  } | null>(null);

  // Fetch hotel data from backend
  useEffect(() => {
    const fetchHotel = async () => {
      if (!hotelId) return;

      try {
        const response = await fetch(
          `${
            process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"
          }/api/listings/${hotelId}`
        );
        if (response.ok) {
          const data = await response.json();
          setHotel({
            id: data._id,
            name: data.name,
            location: data.location,
            price: data.price,
            rating: data.rating,
            amenities: data.amenities,
            images:
              data.images && data.images.length > 0
                ? data.images
                : [
                    "https://images.unsplash.com/photo-1559599238-0ea6229ab6a6?q=80&w=1200&auto=format&fit=crop",
                  ],
            description: data.description,
          } as Hotel);
        }
      } catch (error) {
        console.error("Error fetching hotel:", error);
      }
    };

    fetchHotel();
  }, [hotelId]);

  // Join hotel room when component mounts
  useEffect(() => {
    if (hotelId && hotel) {
      console.log("🏨 Joining hotel room for booking:", hotelId);
      joinHotelRoom(hotelId);

      // Send initial AI greeting
      setMessages([
        {
          id: "0",
          sender: "ai",
          text: `Welcome! I'm excited to help you book ${hotel.name} in ${
            hotel.location
          }. 🏨\n\nThis beautiful property offers ${hotel.amenities
            .slice(0, 3)
            .join(", ")}${
            hotel.amenities.length > 3 ? " and more" : ""
          }!\n\nTo get started, could you share your check-in and check-out dates?`,
        },
      ]);
    }
  }, [hotelId, hotel, joinHotelRoom]);

  // Listen to socket messages (real-time updates from hotel owner)
  useEffect(() => {
    const hotelMessages = socketMessages.filter(
      (msg) => msg.hotelId === hotelId
    );
    if (hotelMessages.length > 0) {
      const lastSocketMsg = hotelMessages[hotelMessages.length - 1];

      // Only add hotel staff messages to display
      if (lastSocketMsg.isHotelStaff) {
        const staffMessage: Message = {
          id: Date.now().toString(),
          sender: "staff",
          text: lastSocketMsg.message,
        };
        setMessages((prev) => [...prev, staffMessage]);
      }
    }
  }, [socketMessages, hotelId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!hotel || !hotelId) return;

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
      // Get user info
      let userId = "guest";
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          userId = JSON.parse(storedUser)?._id || "guest";
        } catch {}
      }

      // Send message via socket - AI will respond via socket with hotel context
      sendSocketMessage(text, hotelId, false);

      // Remove loading message - real response will come via socket
      setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== "loading"));
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        sender: "ai",
        text: "Oops, something went wrong. Please try again.",
      };
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== "loading"),
        errorMessage,
      ]);
      setIsLoading(false);
    }
  };

  const handleOpenPaymentModal = () => {
    if (paymentDetails) {
      setIsPaymentModalOpen(true);
    }
  };

  const handleFinalizePayment = async (guestDetails: GuestDetails) => {
    if (bookingIdRef.current && paymentDetails && hotel) {
      try {
        // Save booking to backend
        const response = await fetch(
          `${
            process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"
          }/api/bookings`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              hotelId: hotel.id,
              guestName: guestDetails.guestName,
              guestEmail: guestDetails.guestEmail,
              guestPhone: guestDetails.guestPhone,
              arrivalTime: guestDetails.arrivalTime,
              amountPaid: paymentDetails.amount,
              status: "Confirmed",
            }),
          }
        );

        if (response.ok) {
          console.log("✅ Booking confirmed");
        }
      } catch (error) {
        console.error("Error saving booking:", error);
      }

      setMessages((prev) =>
        prev.map((m) => {
          if (m.paymentDetails?.bookingId === bookingIdRef.current) {
            return { ...m, paymentDetails: undefined };
          }
          return m;
        })
      );

      const confirmationMessage: Message = {
        id: Date.now().toString(),
        sender: "ai",
        bookingReceipt: {
          hotelName: hotel.name,
          hotelLocation: hotel.location,
          guestName: guestDetails.guestName,
          guestEmail: guestDetails.guestEmail,
          guestPhone: guestDetails.guestPhone,
          arrivalTime: guestDetails.arrivalTime,
          amountPaid: paymentDetails.amount,
          hotelContact: "contact@hotel.com",
        },
      };
      setMessages((prev) => [...prev, confirmationMessage]);
      setIsPaymentModalOpen(false);
      setPaymentDetails(null);
    }
  };

  if (!hotel) {
    return <div className="p-4 text-center">Hotel not found.</div>;
  }

  return (
    <>
      <div className="flex flex-col md:flex-row h-full w-full gap-6 p-4 md:p-6">
        <div className="md:w-1/2 lg:w-2/5 h-full">
          <HotelDetailView hotel={hotel} />
        </div>
        <div className="md:w-1/2 lg:w-3/5 flex flex-col h-full bg-light-card dark:bg-dark-card rounded-2xl shadow-lg">
          <main className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onPayment={handleOpenPaymentModal}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </main>
          <footer className="w-full border-t border-gray-200 dark:border-gray-700 p-4">
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          </footer>
        </div>
      </div>
      {isPaymentModalOpen && paymentDetails && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          amount={paymentDetails.amount}
          onPaymentFinalized={handleFinalizePayment}
        />
      )}
    </>
  );
};

export default HotelBookingPage;
