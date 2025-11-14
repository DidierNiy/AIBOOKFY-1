import { createContext, useContext, useState, useEffect } from "react";
import io, { Socket } from "socket.io-client";

interface ChatContextType {
  socket: Socket | null;
  messages: any[];
  sendMessage: (
    message: string,
    hotelId: string,
    isHotelStaff: boolean,
    options?: { suppressAI?: boolean; isAI?: boolean }
  ) => void;
  joinHotelRoom: (hotelId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const newSocket = io(
      process.env.REACT_APP_BACKEND_URL || "http://localhost:5000",
      {
        withCredentials: true,
      }
    );

    setSocket(newSocket);

    newSocket.on("receive_message", (message) => {
      // Normalize message shape
      const normalized = {
        hotelId: (message as any).hotelId,
        message: (message as any).message,
        text: (message as any).text,
        userId: (message as any).userId,
        isAI: (message as any).isAI,
        isHotelStaff: (message as any).isHotelStaff,
        hotels: (message as any).hotels,
        timestamp: (message as any).timestamp || new Date().toISOString(),
      };
      setMessages((prevMessages) => [...prevMessages, normalized]);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const sendMessage = (
    message: string,
    hotelId: string,
    isHotelStaff: boolean,
    options?: { suppressAI?: boolean; isAI?: boolean }
  ) => {
    if (socket) {
      const messageData = {
        message,
        hotelId,
        userId: localStorage.getItem("userId"),
        hotelContext: {
          // You would typically get this from your hotel data
          name: "Hotel Name",
          location: "Hotel Location",
          priceRange: "$100-$200",
          amenities: ["WiFi", "Pool", "Gym"],
          availableRooms: 10,
        },
        isHotelStaff,
        suppressAI: options?.suppressAI || false,
        isAI: options?.isAI || false,
      };

      socket.emit("send_message", messageData);
    }
  };

  const joinHotelRoom = (hotelId: string) => {
    if (socket) {
      socket.emit("join_hotel_room", hotelId);
    }
  };

  return (
    <ChatContext.Provider
      value={{ socket, messages, sendMessage, joinHotelRoom }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
