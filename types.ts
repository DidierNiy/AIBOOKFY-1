

export interface Hotel {
  id: string;
  name: string;
  images: string[];
  price: number;
  amenities: string[];
  location: string;
  rating: number;
  petFriendly?: boolean;
  freeParking?: boolean;
  familyFriendly?: boolean;
}

export interface BookingReceiptData {
    hotelName: string;
    hotelLocation: string;
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    arrivalTime: string;
    amountPaid: number;
    hotelContact: string; // Add contact info for receipt
}

export interface Message {
  id:string;
  sender: 'user' | 'ai' | 'staff';
  text?: string;
  hotels?: Hotel[];
  isLoading?: boolean;
  paymentDetails?: {
      bookingId: string;
      amount: number;
      currency: string;
  },
  navigateTo?: string;
  bookingReceipt?: BookingReceiptData; // Add this line
}

export interface Booking {
    id: string;
    guestName: string;
    checkIn: string;
    checkOut: string;
    status: 'Confirmed' | 'Pending' | 'Cancelled';
    totalPaid: number;
    guestEmail?: string;
    guestPhone?: string;
    arrivalTime?: string;
}

export interface Listing {
    id: string;
    name: string;
    price: number;
    photos: string[];
    amenities: string[];
    isActive: boolean;
    location?: string;
    socialMediaLink?: string;
    whatsappNumber?: string;
}

export interface PaymentSettings {
  stripeConnected: boolean;
  bankAccount: {
    accountHolder: string;
    accountNumber: string;
    bankName: string;
  };
  paypalEmail: string;
}

export interface RestaurantOrder {
  id: string;
  tableNumber: number;
  items: { name: string; quantity: number }[];
  status: 'Preparing' | 'Served' | 'Paid';
  totalPrice: number;
}