
import { Hotel, Booking, Listing } from './types';

export const MOCK_HOTELS: Hotel[] = [
    {
        id: 'hotel1',
        name: 'Bujumbura Beachfront Resort',
        images: ['https://picsum.photos/seed/hotel1/400/300', 'https://picsum.photos/seed/hotel1-2/400/300', 'https://picsum.photos/seed/hotel1-3/400/300'],
        price: 95,
        amenities: ['Pool', 'WiFi', 'Beach Access', 'Restaurant'],
        location: 'Bujumbura, Burundi',
        rating: 4.5
    },
    {
        id: 'hotel2',
        name: 'The Urban Oasis Hotel',
        images: ['https://picsum.photos/seed/hotel2/400/300', 'https://picsum.photos/seed/hotel2-2/400/300'],
        price: 120,
        amenities: ['Gym', 'Spa', 'Rooftop Bar', 'Free WiFi'],
        location: 'Downtown Bujumbura',
        rating: 4.8
    }
];

export const MOCK_BOOKINGS: Booking[] = [
    { id: 'B001', guestName: 'John Doe', checkIn: '2024-08-01', checkOut: '2024-08-05', status: 'Confirmed', totalPaid: 380 },
    { id: 'B002', guestName: 'Jane Smith', checkIn: '2024-08-03', checkOut: '2024-08-07', status: 'Confirmed', totalPaid: 420 },
    { id: 'B003', guestName: 'Mike Johnson', checkIn: '2024-08-10', checkOut: '2024-08-12', status: 'Pending', totalPaid: 240 },
    { id: 'B004', guestName: 'Emily Davis', checkIn: '2024-08-15', checkOut: '2024-08-18', status: 'Cancelled', totalPaid: 0 },
];

export const MOCK_LISTINGS: Listing[] = [
    { id: 'L01', name: 'Deluxe Queen Room', price: 95, photos: ['https://picsum.photos/seed/room1/200/150'], amenities: ['Queen Bed', 'Ocean View', 'Balcony'], isActive: true },
    { id: 'L02', name: 'Standard Twin Room', price: 80, photos: ['https://picsum.photos/seed/room2/200/150'], amenities: ['Two Twin Beds', 'Garden View'], isActive: true },
    { id: 'L03', name: 'Presidential Suite', price: 250, photos: ['https://picsum.photos/seed/room3/200/150'], amenities: ['King Bed', 'Jacuzzi', 'Living Room', 'Full Kitchen'], isActive: false },
]

export const INITIAL_GREETING = "Hello! I'm your AI travel assistant. How can I help you find the perfect hotel today?";
