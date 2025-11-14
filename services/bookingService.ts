import { Booking } from '../types';
import { MOCK_BOOKINGS as initialBookings } from '../constants';

// Make a mutable copy of the mock data to simulate a DB/shared state
export const MOCK_BOOKINGS: Booking[] = [...initialBookings];

interface GuestDetails {
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    arrivalTime: string;
}

export const bookingService = {
  addBooking: (newBooking: Omit<Booking, 'id'>): Booking => {
    const booking: Booking = {
      id: `B00${MOCK_BOOKINGS.length + 1}`,
      ...newBooking
    };
    MOCK_BOOKINGS.unshift(booking); // Add to the top of the list for visibility
    return booking;
  },

  getBooking: (bookingId: string): Booking | undefined => {
    return MOCK_BOOKINGS.find(b => b.id === bookingId);
  },

  updateBookingStatus: (bookingId: string, status: 'Confirmed' | 'Pending' | 'Cancelled'): Booking | undefined => {
    const bookingIndex = MOCK_BOOKINGS.findIndex(b => b.id === bookingId);
    if (bookingIndex !== -1) {
      MOCK_BOOKINGS[bookingIndex].status = status;
      if (status === 'Confirmed') {
          MOCK_BOOKINGS[bookingIndex].totalPaid = MOCK_BOOKINGS[bookingIndex].totalPaid > 0 ? MOCK_BOOKINGS[bookingIndex].totalPaid : 250; // Mock payment amount
      }
      return MOCK_BOOKINGS[bookingIndex];
    }
    return undefined;
  },
  
  finalizeBooking: (bookingId: string, details: GuestDetails, amount: number): Booking | undefined => {
      const bookingIndex = MOCK_BOOKINGS.findIndex(b => b.id === bookingId);
      if (bookingIndex !== -1) {
          MOCK_BOOKINGS[bookingIndex].status = 'Confirmed';
          MOCK_BOOKINGS[bookingIndex].totalPaid = amount;
          MOCK_BOOKINGS[bookingIndex].guestName = details.guestName;
          MOCK_BOOKINGS[bookingIndex].guestEmail = details.guestEmail;
          MOCK_BOOKINGS[bookingIndex].guestPhone = details.guestPhone;
          MOCK_BOOKINGS[bookingIndex].arrivalTime = details.arrivalTime;
          return MOCK_BOOKINGS[bookingIndex];
      }
      return undefined;
  }
};