
import React, { useState } from 'react';
import { Listing } from '../../../types';
import CreateListingModal from './CreateListingModal';

interface ListingCardProps {
    listing: Listing;
    onEdit: () => void;
    onDelete: () => void;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, onEdit, onDelete }) => (
    <div className="bg-light-card dark:bg-dark-card rounded-lg shadow overflow-hidden flex flex-col md:flex-row">
        <img src={listing.photos[0]} alt={listing.name} className="w-full md:w-48 h-40 md:h-auto object-cover" />
        <div className="p-4 flex-1 flex flex-col">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-semibold">{listing.name}</h3>
                    <p className="text-xl font-bold text-primary">${listing.price}/night</p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${listing.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                    {listing.isActive ? 'Active' : 'Inactive'}
                </span>
            </div>
            <div className="flex-1 my-3">
                <p className="text-sm font-medium mb-1">Amenities:</p>
                <div className="flex flex-wrap gap-2">
                    {listing.amenities.map(a => <span key={a} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{a}</span>)}
                </div>
            </div>
            <div className="flex items-center space-x-2 mt-2">
                <button onClick={onEdit} className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-opacity-90 transition-colors w-full md:w-auto">Edit</button>
                <button onClick={onDelete} className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors w-full md:w-auto">Delete</button>
                <button className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-600 text-light-text dark:text-dark-text rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors w-full md:w-auto">View</button>
            </div>
             <div className="bg-blue-50 dark:bg-blue-900/50 p-3 rounded-md mt-4 text-sm text-blue-800 dark:text-blue-200">
                <strong>AI Suggestion:</strong> Add 'Free WiFi' to amenities. It's a top search filter for business travelers.
            </div>
        </div>
    </div>
);

interface ListingsProps {
    listings: Listing[];
    onSave: (listingData: Omit<Listing, 'id' | 'isActive' | 'photos'> & { photos: (File | string)[] }, editingListing: Listing | null) => void;
    onDelete: (listingId: string) => void;
}

const Listings: React.FC<ListingsProps> = ({ listings, onSave, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingListing, setEditingListing] = useState<Listing | null>(null);

    const handleOpenCreateModal = () => {
        setEditingListing(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (listing: Listing) => {
        setEditingListing(listing);
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingListing(null);
    };
    
    const handleSave = (listingData: Omit<Listing, 'id' | 'isActive' | 'photos'> & { photos: (File | string)[] }) => {
        onSave(listingData, editingListing);
        handleCloseModal();
    }


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Manage Your Listings</h2>
                <button 
                    onClick={handleOpenCreateModal}
                    className="bg-primary text-white px-4 py-2 rounded-md font-semibold hover:bg-opacity-90 transition-colors">
                    + Create New Listing
                </button>
            </div>
            <div className="space-y-4">
                {listings.map(listing => <ListingCard key={listing.id} listing={listing} onEdit={() => handleOpenEditModal(listing)} onDelete={() => onDelete(listing.id)} />)}
            </div>
            <CreateListingModal 
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSave}
                initialData={editingListing}
            />
        </div>
    );
};

export default Listings;