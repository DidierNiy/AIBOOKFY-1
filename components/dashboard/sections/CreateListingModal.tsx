
import React, { useState, useEffect } from 'react';
import { Listing } from '../../../types';

type ListingFormData = Omit<Listing, 'id' | 'isActive' | 'photos'> & { photos: (File | string)[] };

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (listingData: ListingFormData) => void;
  initialData?: Listing | null;
}

const CreateListingModal: React.FC<CreateListingModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [name, setName] = useState('');
  const [images, setImages] = useState<(File | string | null)[]>(Array(5).fill(null));
  const [amenities, setAmenities] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [location, setLocation] = useState('');
  const [socialMediaLink, setSocialMediaLink] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');

  // FIX: Moved clearForm before useEffect to fix initialization error.
  const clearForm = () => {
      setName('');
      setImages(Array(5).fill(null));
      setAmenities('');
      setPrice('');
      setLocation('');
      setSocialMediaLink('');
      setWhatsappNumber('');
  };

  useEffect(() => {
    if (isOpen && initialData) {
      setName(initialData.name);
      setPrice(initialData.price);
      setAmenities(initialData.amenities.join(', '));
      setLocation(initialData.location || '');
      setSocialMediaLink(initialData.socialMediaLink || '');
      setWhatsappNumber(initialData.whatsappNumber || '');
      
      const initialImages = [...initialData.photos, ...Array(5 - initialData.photos.length).fill(null)];
      setImages(initialImages);
    } else if (isOpen) { // Only clear if opening, not on every render
      clearForm();
    }
  }, [isOpen, initialData]);

  if (!isOpen) {
    return null;
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (e.target.files && e.target.files[0]) {
      const newImages = [...images];
      newImages[index] = e.target.files[0];
      setImages(newImages);
    }
  };

  const handleClose = () => {
    onClose();
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (price === '') return;

    onSave({
      name,
      photos: images.filter((img): img is File | string => img !== null),
      amenities: amenities.split(',').map(a => a.trim()).filter(Boolean),
      price: price,
      location: location,
      socialMediaLink: socialMediaLink,
      whatsappNumber: whatsappNumber,
    });
  };
  
  const getImagePreview = (image: File | string | null): string | null => {
      if (!image) return null;
      if (typeof image === 'string') return image;
      return URL.createObjectURL(image);
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-10"
      onClick={handleClose}
    >
      <div 
        className="bg-light-card dark:bg-dark-card rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6">{initialData ? 'Edit Listing' : 'Create New Listing'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-sm font-medium">Hotel/Room Title</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary focus:bg-white dark:focus:bg-dark-surface focus:ring-0" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Images (up to 5)</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {images.map((image, i) => {
                const previewUrl = getImagePreview(image);
                return (
                  <div key={i} className="relative border-2 border-dashed rounded-lg p-2 text-center h-24 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                    <input type="file" accept="image/*" onChange={e => handleImageChange(e, i)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    {previewUrl ? <img src={previewUrl} alt={`preview ${i}`} className="h-full w-full object-cover rounded" /> : <span className="text-xs text-gray-400">Image {i+1}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Amenities</label>
            <textarea value={amenities} onChange={e => setAmenities(e.target.value)} rows={3} placeholder="Pool, WiFi, Beach Access..." className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary focus:bg-white dark:focus:bg-dark-surface focus:ring-0"></textarea>
            <p className="text-xs text-gray-500 mt-1">Separate amenities with a comma.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Price (per night)</label>
              <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} required min="0" placeholder="$" className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary focus:bg-white dark:focus:bg-dark-surface focus:ring-0" />
            </div>
            <div>
              <label className="block text-sm font-medium">Location</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} required placeholder="Bujumbura, Burundi" className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary focus:bg-white dark:focus:bg-dark-surface focus:ring-0" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Social Media Link (optional)</label>
              <input type="url" value={socialMediaLink} onChange={e => setSocialMediaLink(e.target.value)} placeholder="https://instagram.com/yourhotel" className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary focus:bg-white dark:focus:bg-dark-surface focus:ring-0" />
            </div>
            <div>
              <label className="block text-sm font-medium">WhatsApp Number</label>
              <input type="tel" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} required placeholder="+1234567890" className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary focus:bg-white dark:focus:bg-dark-surface focus:ring-0" />
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={handleClose} className="px-6 py-2 text-sm bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cancel</button>
            <button type="submit" className="px-6 py-2 text-sm bg-primary text-white rounded-md hover:bg-opacity-90 transition-colors font-semibold">Save Listing</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateListingModal;
