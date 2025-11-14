import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Hotel } from "../../types";
import { useChat } from "../../contexts/ChatContext";

interface HotelCardProps {
  hotel: Hotel;
}

const HotelCard: React.FC<HotelCardProps> = ({ hotel }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const navigate = useNavigate();
  const { joinHotelRoom, sendMessage } = useChat();

  const images =
    Array.isArray(hotel.images) && hotel.images.length > 0
      ? hotel.images
      : [
          "https://images.unsplash.com/photo-1559599238-0ea6229ab6a6?q=80&w=1200&auto=format&fit=crop",
        ];

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="bg-light-card dark:bg-dark-card rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 w-full max-w-sm mx-auto">
      <div className="relative">
        <img
          src={images[currentImage]}
          alt={hotel.name}
          className="w-full h-48 object-cover"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-75 transition-opacity"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-75 transition-opacity"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg">{hotel.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {hotel.location}
        </p>
        <div className="flex items-center my-2">
          <span className="text-yellow-500">
            {"★".repeat(Math.round(hotel.rating))}
            {"☆".repeat(5 - Math.round(hotel.rating))}
          </span>
          <span className="text-xs ml-2 text-gray-500">
            {hotel.rating} stars
          </span>
        </div>
        <div className="flex flex-wrap gap-2 my-3">
          {hotel.amenities.slice(0, 3).map((amenity) => (
            <span
              key={amenity}
              className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full"
            >
              {amenity}
            </span>
          ))}
        </div>
        <div className="flex justify-between items-center mt-4">
          <p className="text-xl font-bold">
            ${hotel.price}
            <span className="text-sm font-normal">/night</span>
          </p>
          <button
            onClick={async (e) => {
              e.stopPropagation();
              // Log interaction to backend before navigating
              try {
                let token: string | null = null;
                const storedUser = localStorage.getItem("user");
                if (storedUser) {
                  try {
                    token = JSON.parse(storedUser)?.token || null;
                  } catch {}
                } else {
                  token = localStorage.getItem("token");
                }
                await fetch(
                  `${
                    process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"
                  }/api/chat/interactions`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({
                      hotelId: hotel.id,
                      action: "click_book",
                      metadata: { price: hotel.price },
                    }),
                  }
                );
              } catch (err) {
                console.error("Failed to log interaction", err);
              }
              // Join hotel room and send initial booking intent so hotel sees it in real time
              try {
                joinHotelRoom(hotel.id);
                sendMessage(`I'd like to book ${hotel.name}.`, hotel.id, false);
              } catch (e) {
                console.warn("Socket not available yet, continuing navigation");
              }
              // Navigate to booking page
              navigate(`/book/${hotel.id}`);
            }}
            className="bg-secondary text-white px-4 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default HotelCard;
