import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Hotel } from "../../types";
import { ChatContext } from "../../contexts/ChatContext";

interface HotelCardProps {
  hotel: Hotel;
}

const HotelCard: React.FC<HotelCardProps> = ({ hotel }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const navigate = useNavigate();

  // Safely get chat context - use useContext directly to avoid throwing
  const chatContext = useContext(ChatContext);
  const joinHotelRoom = chatContext?.joinHotelRoom;
  const sendMessage = chatContext?.sendMessage;

  // DEBUG: Component is loading
  console.log('🔥 HotelCard component is rendering!');
  console.log('Hotel prop:', hotel);

  // Validate hotel data
  if (!hotel || !hotel.id || !hotel.name) {
    console.error('❌ Invalid hotel data:', hotel);
    return null;
  }

  // Debug logging
  console.log(`🏨 HotelCard rendering for: ${hotel.name}`);
  console.log('Hotel images received:', hotel.images);

  // Ensure images is always a valid array with at least a placeholder
  const placeholderImage = "https://images.unsplash.com/photo-1559599238-0ea6229ab6a6?q=80&w=1200&auto=format&fit=crop";

  let images: string[] = [placeholderImage];
  if (Array.isArray(hotel.images) && hotel.images.length > 0) {
    // Filter out any invalid URLs
    const validImages = hotel.images.filter(
      (img) => img && typeof img === 'string' && img.trim().length > 0
    );
    if (validImages.length > 0) {
      images = validImages;
    }
    console.log('Valid images after filtering:', validImages);
  }

  console.log(`Final images array for ${hotel.name}:`, images);

  // Ensure currentImage is within bounds
  const safeImageIndex = Math.max(0, Math.min(currentImage, images.length - 1));

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
          src={images[safeImageIndex] || placeholderImage}
          alt={hotel.name || 'Hotel'}
          className="w-full h-48 object-cover"
          onLoad={(e) => {
            console.log(`✅ Image loaded successfully for ${hotel.name}:`, (e.target as HTMLImageElement).src);
          }}
          onError={(e) => {
            console.error(`❌ Image failed to load for ${hotel.name}:`, (e.target as HTMLImageElement).src);
            // Fallback to placeholder if image fails to load
            const target = e.target as HTMLImageElement;
            if (target.src !== placeholderImage) {
              console.log(`🔄 Switching to placeholder for ${hotel.name}`);
              target.src = placeholderImage;
            }
          }}
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
        <h3 className="font-bold text-lg">{hotel.name || 'Hotel'}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {hotel.location || 'Location not available'}
        </p>
        {hotel.rating !== undefined && hotel.rating > 0 && (
          <div className="flex items-center my-2">
            <span className="text-yellow-500">
              {"★".repeat(Math.min(Math.round(hotel.rating), 5))}
              {"☆".repeat(Math.max(5 - Math.round(hotel.rating), 0))}
            </span>
            <span className="text-xs ml-2 text-gray-500">
              {hotel.rating.toFixed(1)} stars
            </span>
          </div>
        )}
        {hotel.amenities && Array.isArray(hotel.amenities) && hotel.amenities.length > 0 && (
          <div className="flex flex-wrap gap-2 my-3">
            {hotel.amenities.slice(0, 3).map((amenity, index) => (
              <span
                key={amenity || index}
                className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full"
              >
                {amenity}
              </span>
            ))}
          </div>
        )}
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
                if (joinHotelRoom) {
                  joinHotelRoom(hotel.id);
                }
                if (sendMessage) {
                  sendMessage(`I'd like to book ${hotel.name}.`, hotel.id, false);
                }
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
