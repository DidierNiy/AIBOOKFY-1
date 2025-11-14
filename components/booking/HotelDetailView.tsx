import React, { useState } from 'react';
import { Hotel } from '../../types';
import ImageGalleryModal from './ImageGalleryModal';

interface HotelDetailViewProps {
  hotel: Hotel;
}

const HotelDetailView: React.FC<HotelDetailViewProps> = ({ hotel }) => {
  const [featuredImage, setFeaturedImage] = useState(hotel.images[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="bg-light-card dark:bg-dark-card rounded-2xl shadow-lg p-6 h-full overflow-y-auto">
      <h2 className="text-3xl font-bold mb-4">{hotel.name}</h2>
      
      {/* Image Gallery */}
      <div className="mb-4">
        <div className="relative group">
            <img 
                src={featuredImage} 
                alt="Featured view" 
                className="w-full h-64 object-cover rounded-lg cursor-pointer"
                onClick={() => setIsModalOpen(true)}
            />
             <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                <span className="text-white font-semibold">View Fullscreen</span>
            </div>
        </div>
        <div className="flex space-x-2 mt-2">
          {hotel.images.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`Thumbnail ${index + 1}`}
              className={`w-16 h-16 object-cover rounded-md cursor-pointer border-2 transition-colors ${featuredImage === img ? 'border-primary' : 'border-transparent hover:border-primary/50'}`}
              onClick={() => setFeaturedImage(img)}
            />
          ))}
        </div>
      </div>
      
      {/* Details */}
      <p className="text-gray-600 dark:text-gray-400 mb-4">{hotel.location}</p>
      <div className="flex items-center mb-4">
        <span className="text-yellow-500">{'★'.repeat(Math.round(hotel.rating))}{'☆'.repeat(5 - Math.round(hotel.rating))}</span>
        <span className="text-sm ml-2 text-gray-500">{hotel.rating} stars</span>
      </div>
      <p className="text-2xl font-bold mb-4">${hotel.price}<span className="text-base font-normal">/night</span></p>

      <div>
        <h4 className="font-semibold mb-2">Amenities</h4>
        <div className="flex flex-wrap gap-2">
          {hotel.amenities.map(amenity => (
            <span key={amenity} className="text-sm bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">{amenity}</span>
          ))}
        </div>
      </div>
      
      {isModalOpen && <ImageGalleryModal imageUrl={featuredImage} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

export default HotelDetailView;
