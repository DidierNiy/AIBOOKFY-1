

import React, { useState, useEffect } from 'react';
import { MOCK_BOOKINGS } from '../../../services/bookingService';
import { Listing, Booking } from '../../../types';

interface BookingsProps {
    listings: Listing[];
}

const Bookings: React.FC<BookingsProps> = ({ listings }) => {
    // Local state to re-render when the shared bookings array changes
    const [bookings, setBookings] = useState<Booking[]>([...MOCK_BOOKINGS]);

    useEffect(() => {
        // This is a simple polling mechanism to check for changes in the shared
        // booking data. In a production app, this would be handled by a more
        // robust state management solution like Redux, Zustand, or context with websockets.
        const interval = setInterval(() => {
            if (bookings.length !== MOCK_BOOKINGS.length || JSON.stringify(bookings) !== JSON.stringify(MOCK_BOOKINGS)) {
                setBookings([...MOCK_BOOKINGS]);
            }
        }, 500); // Check for changes every 500ms

        return () => clearInterval(interval);
    }, [bookings]);
    
    const getStatusClass = (status: 'Confirmed' | 'Pending' | 'Cancelled') => {
        switch (status) {
            case 'Confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        }
    };

    const handleNotify = (booking: Booking) => {
        const listingId = window.prompt(`Enter the ID of the listing for booking #${booking.id} (e.g., L01, L02):`);
        if (!listingId) return;

        const listing = listings.find(l => l.id.toLowerCase() === listingId.toLowerCase());

        if (listing && listing.whatsappNumber) {
            const message = `
                --- SIMULATING WHATSAPP ALERT ---
                To: ${listing.whatsappNumber}

                Message:
                New booking received for "${listing.name}"!

                Guest: ${booking.guestName}
                Check-in: ${booking.checkIn}
                Check-out: ${booking.checkOut}
            `;
            alert(message.replace(/^ +/gm, '')); // Remove leading spaces from multiline string
        } else {
            alert(`Could not send alert. Listing with ID "${listingId}" not found, or it does not have a WhatsApp number.`);
        }
    };


    return (
        <div className="bg-light-card dark:bg-dark-card p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">All Bookings</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">Booking ID</th>
                            <th scope="col" className="px-6 py-3">Guest Details</th>
                            <th scope="col" className="px-6 py-3">Check-in</th>
                            <th scope="col" className="px-6 py-3">Check-out</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3">Total Paid</th>
                            <th scope="col" className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map((booking) => (
                            <tr key={booking.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-4 font-medium">{booking.id}</td>
                                <td className="px-6 py-4">
                                    <p className="font-medium">{booking.guestName}</p>
                                    <p className="text-xs text-gray-500">{booking.guestEmail}</p>
                                    <p className="text-xs text-gray-500">{booking.guestPhone}</p>
                                </td>
                                <td className="px-6 py-4">{booking.checkIn}</td>
                                <td className="px-6 py-4">{booking.checkOut}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 font-medium rounded-full ${getStatusClass(booking.status)}`}>
                                        {booking.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">${booking.totalPaid.toFixed(2)}</td>
                                <td className="px-6 py-4">
                                    <button 
                                        onClick={() => handleNotify(booking)}
                                        className="font-medium text-primary hover:underline"
                                    >
                                        Notify Manager
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/50 p-4 rounded-md mt-6 text-sm text-blue-800 dark:text-blue-200">
                <strong>AI Prediction:</strong> Booking #B003 has a 65% chance of cancellation based on booking lead time and lack of pre-stay communication. Consider sending a confirmation message.
            </div>
        </div>
    );
};

export default Bookings;